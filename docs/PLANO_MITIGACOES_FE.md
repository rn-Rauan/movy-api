# Plano: Mitigação dos 12 pontos do Frontend até o TCC

## Contexto

O frontend reportou 12 pontos (B1–B12) entre travas reais, inconsistências de contrato e otimizações. Prazo: **~2 semanas para entrega escrita ao orientador + ~1 mês até apresentação do TCC**. Objetivo deste plano é entregar o que de fato destrava o FE, manter o trabalho academicamente apresentável, e evitar escopo que não cabe no prazo.

**Decisões já tomadas:**
- Email (B3/B6): **mock service** (logger + endpoint `@Dev()` para inspeção). Sem provedor externo no TCC.
- Querystring de atribuição de driver/vehicle (B10): **manter**, só documentar no Swagger.
- DELETE driver (B5): **já é soft-delete no código** (verificado em `src/modules/driver/application/use-cases/remove-driver.use-case.ts:43`) — resposta ao FE, sem código.

**Itens que serão fechados sem código BE:** B5, B8 (tipo de `Plan.id` é `Int` no schema — fix é no FE), B9 (falso alarme), B10 (manter querystring + doc), B11, B12 (adiados pós-TCC).

**Itens com implementação:** B1, B2, B3, B4, B6, B7.

---

## Sequenciamento por janela

| Janela | Itens | Esforço |
|---|---|---|
| Dia 1 (PR único) | B4 + B7 + responder B5/B8/B9/B10 | ~3 h |
| Dia 2 | B1 (`GET /trip-instances/driver/me`) | ~5 h |
| Dia 3 | B2 (driver confirma payment) | ~6 h |
| Dia 4–6 | B3 + B6 + mock email infra | ~16 h |
| Dia 7+ | Doc sync (`movy-doc-sync`), tests, escrita TCC | — |

Total dev: **~30 h** (~5 dias produtivos), sobra ~3 semanas para escrita e apresentação.

---

## Fase 1 — Quick wins (Dia 1)

### B4 — `telephone` + `emailVerifiedAt` em `TokenResponseDto.user`

**Editar** `src/modules/auth/application/dtos/token-response.dto.ts:32-36` — incluir `telephone: string` e `emailVerifiedAt: Date | null`. Atualizar `@ApiProperty.example`.

**Editar todos os call-sites que constroem `TokenResponseDto`:**
- `src/modules/auth/application/use-cases/login.use-case.ts`
- `src/modules/auth/application/use-cases/register.use-case.ts`
- `src/modules/auth/application/use-cases/register-organization-with-admin.use-case.ts`
- `src/modules/auth/application/use-cases/refresh-token.use-case.ts`
- `src/modules/auth/application/use-cases/setup-organization-for-existing-user.use-case.ts`

> Observação: `emailVerifiedAt` só ganha valor real após Fase 3. Por enquanto retorna `null` (campo já existe no DTO).

### B7 — `GET /public/plans` (rota pública, só `isActive: true`)

**Criar** `src/modules/plans/presentation/controllers/public-plan.controller.ts` — sem `@UseGuards` (padrão "público = omite guard", validado em `PublicOrganizationController` e `PublicTripInstanceController`). Reusa `FindAllPlansUseCase` (ou cria `FindActivePlansUseCase` se filtro precisar entrar no domínio — preferir o filtro no use case, mais limpo).

**Editar** `src/modules/plans/plans.module.ts` para registrar o novo controller.

### Respostas ao FE (zero código)

- **B5** — apontar `src/modules/driver/application/use-cases/remove-driver.use-case.ts:43` (`driver.deactivate()` → `status = INACTIVE`). FE deve refazer o teste — provavelmente viu o registro "sumir" porque listagens filtram `INACTIVE`.
- **B8** — `Plan.id` é `Int` no Prisma (`prisma/schema.prisma`, model `Plan`). FE deve alinhar `types.ts:214` para `number`.
- **B9** — confirmado falso alarme.
- **B10** — manter querystring; adicionar `@ApiQuery` com nota de design no Swagger de `PUT /trip-instances/:id/driver` e `.../vehicle` em `src/modules/trip/presentation/controllers/trip-instance.controller.ts:227,257`.

---

## Fase 2 — B1: `GET /trip-instances/driver/me` (Dia 2)

**Padrão reusado:** `GET /drivers/me` (`src/modules/driver/presentation/controllers/driver.controller.ts:101-111`) → `@GetUser() ctx.userId` → `DriverRepository.findByUserId`.

**Presenter reusado:** `TripInstancePresenter.toHTTPWithMeta` (`src/modules/trip/presentation/mappers/trip-instance.presenter.ts:53-85`) — já enriquece com `departurePoint`, `destination`, `bookedCount`, `availableSlots`.

### Criar
- `src/modules/trip/application/use-cases/find-trip-instances-by-driver-me.use-case.ts` — resolve `userId → driverId` via `DriverRepository.findByUserId`; se não houver perfil de driver, retorna lista vazia (não erra — driver pode estar em onboarding).
- `src/modules/trip/application/dtos/find-trip-instances-by-driver-query.dto.ts` — `@IsOptional() @IsEnum(TripStatus) status?` + `page?: number` + `limit?: number`.

### Editar
- `src/modules/trip/domain/interfaces/trip-instance.repository.ts` — adicionar `findByDriverIdWithMeta(driverId, status?, pagination)`.
- `src/modules/trip/infrastructure/db/repositories/prisma-trip-instance.repository.ts` — implementar (reusar o mesmo `include` do `findByOrganizationIdWithMeta`, aplicar `where: { driverId, ...(status && { tripStatus: status }) }`, `orderBy: { departureTime: 'asc' }`).
- `src/modules/trip/presentation/controllers/trip-instance.controller.ts` — adicionar rota **antes de `:id`** (para evitar shadowing):
  ```
  @Get('driver/me')
  @UseGuards(RolesGuard) @Roles(RoleName.DRIVER)
  ```
- `src/modules/trip/trip.module.ts` — importar `DriverModule` para injetar `DriverRepository`.

### Testes
- `test/modules/trip/application/use-cases/find-trip-instances-by-driver-me.use-case.spec.ts` — happy path, driver sem perfil → `[]`, filtro de status, paginação.

---

## Fase 3 — B2: Driver confirma/falha payment próprio (Dia 3)

**Decisão arquitetural:** authorization fina ("driver é dono da TripInstance do payment") fica **no use case** (regra de domínio), não em guard novo. Guards só liberam o role.

### Criar
- Em `src/modules/payment/domain/errors/payment.errors.ts` (ou arquivo dedicado) — `PaymentNotAssignedToDriverError` com `code = 'PAYMENT_NOT_ASSIGNED_TO_DRIVER_FORBIDDEN'`.

### Editar
- `src/modules/payment/domain/interfaces/payment.repository.ts` — `findDriverIdByPaymentId(id): Promise<string | null>` (navega Payment → Booking → TripInstance.driverId numa query).
- `src/modules/payment/infrastructure/db/repositories/prisma-payment.repository.ts` — implementar com `include`.
- `src/modules/payment/application/use-cases/confirm-payment.use-case.ts` — assinatura passa a receber `ctx: { userId, role }`. Se `ctx.role === DRIVER`: resolve `driverId = DriverRepository.findByUserId(ctx.userId)`, compara com `paymentRepo.findDriverIdByPaymentId(id)`. Mismatch → `PaymentNotAssignedToDriverError`.
- `src/modules/payment/application/use-cases/fail-payment.use-case.ts` — mesma mudança.
- `src/modules/payment/presentation/controllers/payment.controller.ts:78,97` — trocar `@Roles(ADMIN)` por `@Roles(ADMIN, DRIVER)` e passar `ctx` ao use case.
- `src/modules/payment/payment.module.ts` — importar `DriverModule`.

### Testes
- `test/modules/payment/application/use-cases/confirm-payment.use-case.spec.ts` — driver-owner (OK), driver-not-owner (forbidden), admin ignora driver check, payment já processado (mantém comportamento). Mesmos casos em `fail-payment`.

---

## Fase 4 — B3 + B6 + Email Mock (Dias 4–6)

### Schema (Prisma)
Editar `prisma/schema.prisma`:
- `User.emailVerifiedAt DateTime?`
- `model PasswordResetToken { id, userId, tokenHash (unique), expiresAt, usedAt, createdAt, user @relation, @@index([userId]) }` — TTL 1h.
- `model EmailVerificationToken { ... }` — TTL 24h.

Rodar `npx prisma migrate dev --name email_verification_and_password_reset`.

> Decisão: armazenar **hash do token** no DB, retornar token raw só no email mock. Padrão do `RefreshToken`.

### Shared — Email Service (mock)
Criar:
- `src/shared/infrastructure/email/email.service.interface.ts` — `abstract class EmailService { abstract send(to, subject, body, metadata?): Promise<void> }`.
- `src/shared/infrastructure/email/console-email.service.ts` — loga via `Logger`, empurra em `InMemoryEmailLog`.
- `src/shared/infrastructure/email/in-memory-email-log.ts` — singleton FIFO max 50 (`push`, `findByRecipient`, `latest`).
- `src/shared/presentation/controllers/dev-emails.controller.ts` — `@UseGuards(JwtAuthGuard, DevGuard) @Dev() GET /dev/emails/latest?to=`.

Editar `src/shared/shared.module.ts` para registrar (`{ provide: EmailService, useClass: ConsoleEmailService }`), exportar globalmente, e declarar o controller.

### Auth — Domain
Criar:
- `src/modules/auth/domain/entities/password-reset-token.entity.ts` — factory `create(userId)` gera UUID raw + hash sha256 + `expiresAt = now + 1h`.
- `src/modules/auth/domain/entities/email-verification-token.entity.ts` — idem, +24h.
- `src/modules/auth/domain/interfaces/password-reset-token.repository.ts` — `save`, `findByTokenHash`, `markUsed(id)`, `deleteExpired`.
- `src/modules/auth/domain/interfaces/email-verification-token.repository.ts` — idem.
- `src/modules/auth/domain/errors/auth.errors.ts` — `InvalidOrExpiredResetTokenError` (`INVALID_OR_EXPIRED_RESET_TOKEN_BAD_REQUEST`), `InvalidOrExpiredVerificationTokenError` (`INVALID_OR_EXPIRED_VERIFICATION_TOKEN_BAD_REQUEST`).

### Auth — Application
Criar:
- `src/modules/auth/application/use-cases/forgot-password.use-case.ts` — sempre 204 (evita enumeration); só envia email se user existe.
- `src/modules/auth/application/use-cases/reset-password.use-case.ts` — valida token, atualiza `passwordHash`, marca token usado, revoga refresh tokens do user, faz auto-login (delega ao `LoginUseCase` ou monta `TokenResponseDto`).
- `src/modules/auth/application/use-cases/verify-email.use-case.ts` — valida token, seta `User.emailVerifiedAt`, marca usado.
- `src/modules/auth/application/use-cases/send-email-verification.use-case.ts` — helper interno reaproveitado pelos registers.
- DTOs em `src/modules/auth/application/dtos/`: `forgot-password.dto.ts`, `reset-password.dto.ts`, `verify-email.dto.ts`.

Editar:
- `src/modules/auth/application/use-cases/register.use-case.ts` — após criar user, invocar `SendEmailVerificationUseCase` em try/catch (não-fatal, padrão fire-and-forget igual à FREE plan auto-subscription).
- `src/modules/auth/application/use-cases/register-organization-with-admin.use-case.ts` — idem após `createUserUseCase`.

### Auth — Infrastructure
Criar:
- `src/modules/auth/infrastructure/db/repositories/prisma-password-reset-token.repository.ts`
- `src/modules/auth/infrastructure/db/repositories/prisma-email-verification-token.repository.ts`

### Auth — Presentation
Editar `src/modules/auth/presentation/controllers/auth.controller.ts`:
- `POST /auth/forgot-password` (204)
- `POST /auth/reset-password` (200, `TokenResponseDto`)
- `POST /auth/verify-email` (204)

### User — Domain + Mapper
Editar:
- `src/modules/user/domain/entities/user.entity.ts` — adicionar `emailVerifiedAt?: Date` em props, getter, `markEmailVerified()`, incluir em `restore`.
- `src/modules/user/infrastructure/db/mappers/user.mapper.ts` — mapear `emailVerifiedAt`.
- `src/modules/user/presentation/mappers/user.presenter.ts` — expor `emailVerifiedAt` no `UserResponseDto`.

### Auth — Module
Editar `src/modules/auth/auth.module.ts` — registrar novos use cases, repositórios, importar `UserModule`/`SharedModule` se preciso.

### Testes
- `test/modules/auth/application/use-cases/forgot-password.use-case.spec.ts` — email existe, email não existe (ambos 204; só o primeiro envia).
- `test/modules/auth/application/use-cases/reset-password.use-case.spec.ts` — válido, expirado, usado, inexistente.
- `test/modules/auth/application/use-cases/verify-email.use-case.spec.ts` — válido, expirado, usado.
- Atualizar `register.use-case.spec.ts` e `register-organization-with-admin.use-case.spec.ts` para asserir chamada ao `SendEmailVerificationUseCase`.

---

## Critical Files

| Path | Mudança |
|---|---|
| `prisma/schema.prisma` | +2 tabelas, +1 campo em `User` |
| `src/modules/auth/application/dtos/token-response.dto.ts` | +`telephone`, +`emailVerifiedAt` |
| `src/modules/auth/presentation/controllers/auth.controller.ts` | +3 rotas |
| `src/modules/trip/presentation/controllers/trip-instance.controller.ts` | +rota `driver/me`, +Swagger note B10 |
| `src/modules/payment/application/use-cases/confirm-payment.use-case.ts` | +driver auth |
| `src/modules/payment/application/use-cases/fail-payment.use-case.ts` | +driver auth |
| `src/modules/payment/presentation/controllers/payment.controller.ts` | `@Roles(ADMIN, DRIVER)` |
| `src/modules/plans/presentation/controllers/public-plan.controller.ts` | novo |
| `src/shared/shared.module.ts` | +`EmailService` provider |

## Reuse map

| Funcionalidade | Onde já existe |
|---|---|
| Driver "me" pattern | `src/modules/driver/presentation/controllers/driver.controller.ts:101-111` |
| Presenter enriquecido de TripInstance | `src/modules/trip/presentation/mappers/trip-instance.presenter.ts:53-85` |
| Public controller pattern (sem guard) | `PublicOrganizationController`, `PublicTripInstanceController` |
| Soft-delete pattern | `RemoveDriverUseCase`, `RemoveVehicleUseCase` |
| Fire-and-forget pós-create (FREE plan) | `register-organization-with-admin.use-case.ts` |
| Token armazenado como hash | `RefreshToken` (prisma model + repo) |
| Domain error → HTTP code suffix | `AllExceptionsFilter` (`_FORBIDDEN`, `_BAD_REQUEST`) |
| `@Dev()` decorator + `DevGuard` | `src/shared/infrastructure/decorators/dev.decorator.ts` |

---

## Verificação (end-to-end)

Por fase, antes de PR:

```bash
npx tsc --noEmit                                   # type safety
npx jest --config test/jest-unit.json              # unit tests
npm run lint
npx prisma migrate dev                             # Fase 4 only
npm run start:dev                                  # smoke manual via Swagger /api
```

**Smoke manual mínimo por feature:**
- **B1** — login como driver, `GET /trip-instances/driver/me?status=SCHEDULED` → 200 com array enriquecido.
- **B2** — criar booking + payment → atribuir driver à TripInstance → login como driver → `PATCH .../payments/:id/confirm` → 200. Driver de outra TripInstance → 403 com code `PAYMENT_NOT_ASSIGNED_TO_DRIVER_FORBIDDEN`.
- **B4** — login → resposta inclui `telephone` e `emailVerifiedAt: null`.
- **B7** — sem token, `GET /public/plans` → 200 com planos `isActive: true`.
- **B3+B6** — register → checar `GET /dev/emails/latest?to=...` (logado como `@Dev()`) → token aparece → `POST /auth/verify-email { token }` → 204 → `GET /users/me` mostra `emailVerifiedAt` populado. Idem para forgot/reset.

**Sync de documentação (TCC):**
- Após cada fase, rodar a skill `movy-doc-sync` para atualizar `docs/DOCUMENTACAO_TECNICA.md` e `docs/DOC-TCC.tex` (tabelas de módulos, contagem de testes, métricas).
- Após B2 e B3/B6, considerar rodar a skill `movy-security-audit` no módulo `payment` e `auth` para garantir que IDOR e authz fina passam revisão.

---

## Itens explicitamente fora do escopo TCC

- **B11** (`GET /bookings/by-trip/:tripId/mine`) — FE tem workaround viável (P2 no BACKLOG).
- **B12** (preview de próximas instâncias) — UX-only, não trava nada.
- **B10** (migrar querystring → body) — breaking change sem ganho técnico.
- **Email real** (Resend/SES/SMTP) — listado como future work no TCC.

Esses pontos viram seção "Trabalhos Futuros" da escrita do TCC.
