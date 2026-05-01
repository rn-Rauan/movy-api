# Modelo SaaS — Movy API

> Planos, assinaturas, limites e ciclo de vida financeiro do sistema.

---

## 1. Visão Geral

A Movy API opera como SaaS multi-tenant. Cada organização assina um plano que define os limites de uso. O controle de limites é aplicado **antes** de qualquer criação de recurso.

```
Organization
  └── Subscription (1 ativa por vez)
        └── Plan (FREE | BASIC | PRO | PREMIUM)
              ├── maxVehicles
              ├── maxDrivers
              └── maxMonthlyTrips
```

---

## 2. Planos

Os planos são criados via seed (`npm run db:seed`) e não são editáveis via API pública.

| Plano | `maxVehicles` | `maxDrivers` | `maxMonthlyTrips` | `durationDays` |
|---|---|---|---|---|
| `FREE` | Limitado | Limitado | Limitado | 30 |
| `BASIC` | Médio | Médio | Médio | 30 |
| `PRO` | Alto | Alto | Alto | 30 |
| `PREMIUM` | Ilimitado | Ilimitado | Ilimitado | 30 |

> Os valores exatos dos limites são definidos no seed (`prisma/seed.ts`).

---

## 3. Ciclo de Vida da Assinatura

### 3.1 Auto-assinatura no Registro

Ao criar uma organização via `POST /auth/register-organization`, o sistema automaticamente assina a organização no plano **FREE** após a transação principal:

```
POST /auth/register-organization
  ├── TransactionManager.runInTransaction()
  │   ├── CreateUser
  │   ├── CreateOrganization
  │   └── CreateMembership (ADMIN)
  └── (fora da transação) SubscribeToPlanUseCase (FREE)
      └── Se falhar: não faz rollback do registro — org existe mas sem assinatura
```

> **Importante:** o seed deve ter rodado antes (`npm run db:seed`) — o plano FREE precisa existir.

### 3.2 Status da Assinatura

| Status | Significado |
|---|---|
| `ACTIVE` | Assinatura vigente |
| `PAST_DUE` | Expirada (lazy — detectada na próxima leitura) |
| `CANCELED` | Cancelada manualmente |

### 3.3 Expiração Lazy (sem cron)

A assinatura **não expira por um job agendado**. A expiração é verificada **on-demand**: quando o sistema lê a assinatura ativa de uma organização, `resolveActiveSubscription()` verifica se `expiresAt < now()` e, se for o caso, muda o status para `PAST_DUE` naquele momento.

```typescript
// src/modules/subscriptions/application/utils/resolve-active-subscription.ts
async function resolveActiveSubscription(orgId, repo) {
  const sub = await repo.findActiveByOrganizationId(orgId);
  if (!sub) return null;

  if (sub.expiresAt < new Date()) {
    // Expira on-demand
    sub.expire();
    await repo.save(sub);
    return null;
  }

  return sub;
}
```

Isso evita a necessidade de cron jobs e simplifica a infraestrutura.

---

## 4. Enforcement de Limites (`PlanLimitService`)

Centralizado em `src/modules/subscriptions/application/services/plan-limit.service.ts`. Injetado em qualquer use case que precise verificar limites antes de criar recursos.

### 4.1 Métodos disponíveis

```typescript
// Lança erro se org tiver atingido o limite de veículos
await planLimitService.assertVehicleLimit(organizationId, currentCount);

// Lança erro se org tiver atingido o limite de motoristas
await planLimitService.assertDriverLimit(organizationId, currentCount);

// Lança erro se org tiver atingido o limite mensal de viagens
await planLimitService.assertMonthlyTripLimit(organizationId, currentCount);
```

### 4.2 Padrão de uso em use cases

```typescript
// Em CreateVehicleUseCase, CreateTripInstanceUseCase, etc.
const count = await this.vehicleRepository.countActiveByOrganizationId(organizationId);
await this.planLimitService.assertVehicleLimit(organizationId, count);
// Se passou → pode prosseguir com a criação
```

### 4.3 Erros de Limite

Todos os erros de limite têm código com sufixo `_FORBIDDEN` → HTTP 403:

| Erro | Code | HTTP |
|---|---|---|
| `NoActiveSubscriptionError` | `NO_ACTIVE_SUBSCRIPTION_FORBIDDEN` | 403 |
| `VehicleLimitExceededError` | `VEHICLE_PLAN_LIMIT_FORBIDDEN` | 403 |
| `DriverLimitExceededError` | `DRIVER_PLAN_LIMIT_FORBIDDEN` | 403 |
| `MonthlyTripLimitExceededError` | `MONTHLY_TRIP_PLAN_LIMIT_FORBIDDEN` | 403 |

### 4.4 Módulo que usa PlanLimitService

Qualquer módulo que injeta `PlanLimitService` deve importar `SubscriptionsModule` no seu módulo NestJS:

```typescript
@Module({
  imports: [SharedModule, SubscriptionsModule],
  // ...
})
export class VehicleModule {}
```

---

## 5. Pagamentos (Simulação)

O sistema implementa **simulação de pagamentos** — não há integração com gateway real. O fluxo:

1. Passageiro se inscreve em uma viagem (`POST /organizations/:orgId/bookings`)
2. Um `Payment` é criado atomicamente com a `Enrollment` com status `PENDING`
3. Admin confirma o pagamento: `PATCH /organizations/:orgId/payments/:id/confirm` → status `COMPLETED`
4. Admin pode marcar como falhou: `PATCH /organizations/:orgId/payments/:id/fail` → status `FAILED`

**Regras:**
- Apenas pagamentos `PENDING` podem ser processados (confirm ou fail)
- Tentar processar um pagamento já processado lança `PaymentAlreadyProcessedError` (HTTP 409)
- Ambos os endpoints requerem `ADMIN + TenantFilterGuard`

### Criação Atômica (Enrollment + Payment)

A inscrição e o pagamento são criados em uma única transação via `UnitOfWork` (DbContext + AsyncLocalStorage):

```typescript
// CreateBookingUseCase
await this.dbContext.runInTransaction(async () => {
  const enrollment = await this.enrollmentRepository.save(newEnrollment);
  const payment = await this.paymentRepository.save(newPayment);
});
// Se qualquer save falhar → ambos são revertidos
```

---

## 6. Módulos Relacionados

| Módulo | Localização | Responsabilidade |
|---|---|---|
| `plans` | `src/modules/plans/` | CRUD de planos (admin dev) |
| `subscriptions` | `src/modules/subscriptions/` | Gestão de assinaturas + `PlanLimitService` |
| `bookings` | `src/modules/bookings/` | Inscrições + pagamentos |

---

## 7. Endpoints SaaS

### Planos (dev only)

| Método | Path | Proteção | Descrição |
|---|---|---|---|
| `POST` | `/plans` | `@Dev()` | Criar plano |
| `GET` | `/plans` | `@Dev()` | Listar planos |
| `GET` | `/plans/:id` | `@Dev()` | Detalhe do plano |

### Assinaturas

| Método | Path | Proteção | Descrição |
|---|---|---|---|
| `POST` | `/organizations/:orgId/subscriptions` | ADMIN | Assinar um plano |
| `GET` | `/organizations/:orgId/subscriptions/active` | ADMIN | Consultar assinatura ativa |

### Pagamentos

| Método | Path | Proteção | Descrição |
|---|---|---|---|
| `PATCH` | `/organizations/:orgId/payments/:id/confirm` | ADMIN | Confirmar pagamento |
| `PATCH` | `/organizations/:orgId/payments/:id/fail` | ADMIN | Marcar pagamento como falhou |
