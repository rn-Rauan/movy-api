---
name: movy-security-audit
description: 'Security audit for a Movy API module. Checks IDOR (OWASP A01), cross-tenant injection, guard composition, JWT extraction, domain error codes, global listing protection, and rate limiting. Outputs a risk-rated report.'
argument-hint: 'module name (e.g. vehicle, bookings) or "all"'
---

# Movy Security Audit

> Auditoria de segurança focada nos vetores de ataque específicos do projeto.
> Conhecimento base: [MOVY_BRAIN.md](../../MOVY_BRAIN.md)

---

## When to Use

- "faz um security audit do módulo de bookings"
- "verifica se o trip module tem proteção IDOR"
- "audita a segurança de todos os módulos"
- Antes de qualquer deploy em produção
- Após adicionar novos endpoints
- Quando um módulo recebe `/:id` na rota sem `/:organizationId`

---

## Vetores de Ataque no Contexto Movy

| Vetor | Descrição | Risco |
|---|---|---|
| IDOR | Acesso a recurso de outra org via `/:id` | CRÍTICO |
| Cross-tenant injection | `organizationId` aceito no body | CRÍTICO |
| Guard ausente | Rota autenticada sem `JwtAuthGuard` | ALTO |
| Role bypass | Rota admin acessível por DRIVER | ALTO |
| Tenant leak | Listagem global sem `@Dev()` | ALTO |
| Error code leak | Erro 500 por sufixo inválido | MÉDIO |
| JWT não enriquecido | Consulta ao banco por request | MÉDIO |

---

## Procedure

### Passo 1 — Mapear Superfície de Ataque

Ler os arquivos do módulo:
1. `presentation/controllers/<name>.controller.ts` — todas as rotas
2. `application/use-cases/*.ts` — todos os use cases
3. `application/dtos/create-<name>.dto.ts` e `update-<name>.dto.ts`
4. `domain/errors/<name>.errors.ts`
5. `<name>.module.ts`

Criar um inventário de rotas:
```
| Método | Rota                          | Guards                     | Role requerida |
| POST   | /resources                    | JwtAuthGuard, TenantFilter | ADMIN          |
| GET    | /resources/:id                | JwtAuthGuard               | —              |
| DELETE | /resources/:id                | JwtAuthGuard, RolesGuard   | ADMIN          |
```

---

### Passo 2 — Auditoria IDOR (OWASP A01)

Para **cada endpoint com `/:id`** (sem `/:organizationId` na rota):

**Verificar no controller:**
```typescript
// ✅ Correto — extrai organizationId do JWT
@Get(':id')
async findById(@Param('id') id: string, @GetUser() ctx: TenantContext) {
  return this.findByIdUseCase.execute(id, ctx.organizationId!)
}

// ❌ Vulnerável — não valida tenant
@Get(':id')
async findById(@Param('id') id: string) {
  return this.findByIdUseCase.execute(id)
}
```

**Verificar no use case:**
```typescript
// ✅ Correto — compara organizationId
const resource = await this.repo.findById(id)
if (!resource) throw new ResourceNotFoundError(id)
if (resource.organizationId !== organizationId) throw new ResourceForbiddenError()

// Para Driver (sem organizationId direto):
// ✅ Correto — JOIN via OrganizationMembership
const belongs = await this.repo.belongsToOrganization(driverId, organizationId)
if (!belongs) throw new DriverAccessForbiddenError()
```

Marcar como **CRÍTICO** se qualquer endpoint `/:id` não tiver essa validação.

---

### Passo 3 — Auditoria Cross-Tenant (Injeção de organizationId)

Verificar em **todos os DTOs de escrita** (Create, Update):

```typescript
// ❌ Vulnerável — aceita organizationId do cliente
export class CreateResourceDto {
  organizationId: string  // ← vetor de injeção cross-tenant!
}

// ✅ Correto — sem organizationId no DTO
export class CreateResourceDto {
  name: string  // apenas campos que o cliente deve definir
}
```

Verificar em **todos os use cases de escrita**:

```typescript
// ❌ Vulnerável — usa organizationId do DTO
const entity = Entity.create({ organizationId: dto.organizationId })

// ✅ Correto — usa organizationId do JWT (context)
const entity = Entity.create({ organizationId: context.organizationId })
```

Marcar como **CRÍTICO** se `organizationId` for aceito do body em qualquer rota autenticada.

---

### Passo 4 — Auditoria de Guards

Para cada rota, verificar composição correta de guards:

**Controller global:**
```typescript
// ✅ Obrigatório em toda classe de controller
@UseGuards(JwtAuthGuard)
export class ResourceController {}
```

**Rotas de escrita (admin):**
```typescript
// ✅ Correto
@Post()
@UseGuards(TenantFilterGuard, RolesGuard)
@Roles(RoleName.ADMIN)
async create() {}

// ❌ Falta TenantFilterGuard (DRIVER de org X pode criar em org Y)
@Post()
@UseGuards(RolesGuard)
@Roles(RoleName.ADMIN)
async create() {}
```

**Rotas de leitura multi-tenant:**
```typescript
// ✅ Correto — TenantFilter garante que org A não vê dados de org B
@Get('/organization/:organizationId')
@UseGuards(TenantFilterGuard)
async findAll() {}
```

**Rotas de listagem global (dev-only):**
```typescript
// ✅ Correto
@Get()
@UseGuards(DevGuard)
@Dev()
async findAll() {}

// ❌ Listagem global exposta sem proteção
@Get()
async findAll() {}
```

Marcar como **ALTO** qualquer rota sem guard apropriado.

---

### Passo 5 — Auditoria de Domain Errors

Verificar `domain/errors/<name>.errors.ts`:

```typescript
// ❌ Sufixo ausente → AllExceptionsFilter retorna 500!
export class ResourceForbiddenError extends Error {
  readonly code = 'RESOURCE_FORBIDDEN'  // ← sem sufixo _FORBIDDEN
}

// ✅ Correto
export class ResourceForbiddenError extends Error {
  readonly code = 'RESOURCE_ACCESS_FORBIDDEN'  // ← sufixo _FORBIDDEN → 403
}
```

**Mapa de sufixos corretos:**
- Não encontrado: `_NOT_FOUND` → 404
- Duplicata: `_ALREADY_EXISTS` ou `_CONFLICT` → 409
- Dado inválido: `_BAD_REQUEST` → 400
- Acesso proibido: `_FORBIDDEN` → 403
- Não autenticado: `_UNAUTHORIZED` → 401
- Recurso deletado/inativo: `_GONE` → 410

Marcar como **MÉDIO** erros com código sem sufixo reconhecido (causa 500 em produção).

---

### Passo 6 — Auditoria do Pipeline JWT

Verificar se o `JwtStrategy.validate()` consulta o banco:

Verificar `src/modules/auth/` ou `src/shared/`:
```typescript
// ❌ Consulta banco a cada request — latência desnecessária
async validate(payload: JwtPayload) {
  const user = await this.userRepository.findById(payload.sub)  // ← NÃO deve existir
  return user
}

// ✅ Correto — confia no payload enriquecido
async validate(payload: JwtPayload) {
  return payload  // payload já tem userId, organizationId, role, isDev
}
```

Marcar como **MÉDIO** se houver consulta ao banco no validate.

---

### Passo 7 — Auditoria de Rate Limiting

Verificar `src/app.module.ts`:
```typescript
// ✅ Correto — throttler global
ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }])
// providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }]
```

Marcar como **MÉDIO** se rate limiting não estiver configurado globalmente.

---

### Passo 8 — Gerar Relatório de Segurança

```
## Security Audit Report — Módulo: <name>
Data: <data>

### Superfície de Ataque (N rotas auditadas)
<tabela de rotas>

### 🔴 CRÍTICO (N itens) — Corrigir antes de qualquer deploy
- [descrição]
  Arquivo: src/modules/<name>/...
  Vetor: IDOR / Cross-tenant / etc.
  Correção: [instrução concreta]

### 🟠 ALTO (N itens) — Corrigir em até 1 sprint
- [descrição]
  Arquivo: ...
  Correção: ...

### 🟡 MÉDIO (N itens) — Corrigir no próximo ciclo
- [descrição]
  Correção: ...

### ✅ OK (N itens)
- [lista do que está seguro]

### Score: X/10
```

---

## Quick Reference

| Verificação | Arquivo | Sinal de problema |
|---|---|---|
| IDOR | use case | `findById(id)` sem `organizationId` |
| Cross-tenant | DTO | campo `organizationId` presente |
| Guard ausente | controller | método sem `@UseGuards(...)` |
| Error 500 | domain errors | `code` sem sufixo reconhecido |
| JWT banco | jwt.strategy.ts | `repository.findById` no validate |
| Listagem global | controller | `GET /` sem `@Dev()` |
| Rate limit | app.module.ts | `ThrottlerModule` ausente |
