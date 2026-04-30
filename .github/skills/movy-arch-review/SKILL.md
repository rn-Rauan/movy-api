---
name: movy-arch-review
description: 'Audit an existing Movy API module against Clean Architecture + DDD rules. Detects violations: HttpException in use cases, organizationId from body, missing IDOR protection, wrong error code suffixes, missing guards, absent soft delete, and more.'
argument-hint: 'module name (e.g. vehicle, trip, bookings) or "all"'
---

# Movy Architecture Review

> Audita um módulo existente contra todos os padrões do projeto.
> Conhecimento base: [MOVY_BRAIN.md](../../MOVY_BRAIN.md)

---

## When to Use

- "revisa a arquitetura do módulo de pagamentos"
- "verifica se o trip module segue os padrões"
- "faz um arch review do módulo X"
- Antes de um PR de novo módulo ou refatoração
- Quando um módulo foi criado antes dos padrões atuais serem estabelecidos

---

## Pre-Flight Checklist

- [ ] Argumento recebido: `<module-name>` ou `all`
- [ ] Se `all`, executar para cada módulo em `src/modules/`

---

## Procedure

### Passo 1 — Mapear Arquivos do Módulo

Ler **todos** os arquivos do módulo alvo:

```
src/modules/<name>/
  application/use-cases/*.ts       ← use cases
  application/dtos/*.ts            ← DTOs
  domain/entities/*.ts             ← entidades
  domain/errors/*.ts               ← domain errors
  domain/interfaces/*.ts           ← repository interface
  infrastructure/db/mappers/*.ts   ← mappers
  infrastructure/db/repositories/*.ts ← prisma repositories
  presentation/controllers/*.ts    ← controllers
  presentation/mappers/*.ts        ← presenters
  <name>.module.ts                 ← module wiring
```

---

### Passo 2 — Checklist de Domínio

**Entidades** (`domain/entities/<name>.entity.ts`):
- [ ] Props são privadas via interface `<Name>Props`
- [ ] Existe `static create()` para criar novas instâncias
- [ ] Existe `static restore()` para hidratar do banco
- [ ] Getters públicos para todos os campos necessários
- [ ] Sem imports de `@nestjs/*` ou `@prisma/*`

**Domain Errors** (`domain/errors/<name>.errors.ts`):
- [ ] Todos os erros estendem `Error` (não `HttpException`)
- [ ] Cada erro tem `readonly code = '<NAME>_<SUFIXO>'`
- [ ] Sufixos corretos:
  - Recurso não encontrado → `_NOT_FOUND` (→ 404)
  - Duplicata → `_ALREADY_EXISTS` ou `_CONFLICT` (→ 409)
  - Dado inválido → `_BAD_REQUEST` (→ 400)
  - Acesso negado → `_FORBIDDEN` (→ 403)
  - Não autenticado → `_UNAUTHORIZED` (→ 401)
  - Recurso deletado → `_GONE` (→ 410)
- [ ] Sem sufixo desconhecido (causaria HTTP 500 em produção)

**Repository Interface** (`domain/interfaces/<name>.repository.ts`):
- [ ] Existe constante `<NAME>_REPOSITORY_TOKEN = Symbol(...)`
- [ ] Interface tem ao menos `save()`, `findById()`, `update()`, `delete()`
- [ ] Assinaturas retornam `Promise<Entity | null>` (não `void` para save/update)
- [ ] Métodos de listagem aceitam `PaginationOptions` e retornam `PaginatedResponse<Entity>`

---

### Passo 3 — Checklist de Aplicação

**Use Cases** (`application/use-cases/*.ts`):
- [ ] `ForbiddenException` do NestJS **ausente** em todos os use cases
- [ ] `NotFoundException` do NestJS **ausente** em todos os use cases
- [ ] `ConflictException` do NestJS **ausente** em todos os use cases
- [ ] `organizationId` nunca extraído de `dto.*` em rotas autenticadas — deve vir de `context.organizationId`
- [ ] `@Injectable()` presente em todos os use cases
- [ ] Use case injeta dependências via construtor com `@Inject(TOKEN)` para repositórios
- [ ] Retorno via `Presenter.toHTTP(entity)` — nunca a entidade crua

**DTOs** (`application/dtos/*.ts`):
- [ ] `CreateXDto` **não possui** campo `organizationId`
- [ ] Todos os campos têm `@ApiProperty()` ou `@ApiPropertyOptional()`
- [ ] Validadores do `class-validator` presentes (`@IsString()`, `@IsNotEmpty()`, etc.)
- [ ] `UpdateXDto` usa `PartialType(CreateXDto)` quando apropriado

---

### Passo 4 — Checklist de Infraestrutura

**Mapper** (`infrastructure/db/mappers/<name>.mapper.ts`):
- [ ] Método estático `toDomain(raw: PrismaModel): Entity` presente
- [ ] Método estático `toPersistence(entity: Entity): ...` presente
- [ ] `toDomain` usa `Entity.restore(...)` — nunca `Entity.create()`
- [ ] Value Objects hidratados via `.restore()` em `toDomain`
- [ ] Value Objects extraídos via `.value_` em `toPersistence`
- [ ] Import do tipo Prisma usa `import type { X } from 'generated/prisma'`

**Prisma Repository** (`infrastructure/db/repositories/prisma-<name>.repository.ts`):
- [ ] Implementa a interface `I<Name>Repository`
- [ ] Injeta `PrismaService` via construtor
- [ ] Queries de listagem usam `prisma.$transaction([findMany, count])` para paginação
- [ ] Soft delete implementado no repositório quando aplicável

---

### Passo 5 — Checklist de Apresentação

**Presenter** (`presentation/mappers/<name>.presenter.ts`):
- [ ] Método estático `toHTTP(entity): ResponseDto` presente
- [ ] Método estático `toHTTPList(entities[]): ResponseDto[]` presente
- [ ] Sem lógica de negócio — apenas mapeamento

**Controller** (`presentation/controllers/<name>.controller.ts`):
- [ ] `@UseGuards(JwtAuthGuard)` no nível da **classe** (não só nos métodos)
- [ ] Rotas com acesso restrito por role têm `@UseGuards(TenantFilterGuard, RolesGuard)` + `@Roles()`
- [ ] Rotas de listagem global (sem filtro de org) têm `@UseGuards(DevGuard)` + `@Dev()`
- [ ] `organizationId` extraído de `@GetUser()` — nunca de `@Param()` ou `@Body()` para escrita
- [ ] `@ApiTags()` presente na classe
- [ ] `@ApiOperation()` presente em cada endpoint

**Proteção IDOR** — Para cada endpoint com `/:id` sem `/:organizationId` na rota:
- [ ] Use case recebe `organizationId` e compara com o do recurso
- [ ] Lança `<Name>ForbiddenError` (não HTTP 403 direto) se `organizationId` diverge
- [ ] Módulos onde Driver não tem `organizationId` direto: usa `belongsToOrganization(id, orgId)` via JOIN na tabela `OrganizationMembership`

---

### Passo 6 — Checklist de Wiring

**Module File** (`<name>.module.ts`):
- [ ] Importa `SharedModule` (ou módulos necessários)
- [ ] `{ provide: <NAME>_REPOSITORY_TOKEN, useClass: Prisma<Name>Repository }` nos providers
- [ ] Todos os use cases listados em `providers`
- [ ] `exports: [<NAME>_REPOSITORY_TOKEN]` presente (permite injeção em outros módulos)
- [ ] Módulo adicionado ao `imports` do `AppModule`

---

### Passo 7 — Gerar Relatório

Formatar o resultado em três categorias:

```
## Resultado do Arch Review — Módulo: <name>

### ✅ Conforme (N itens)
- [lista do que está correto]

### ⚠️ Avisos (N itens — não bloqueantes)
- [desvios menores que não causam bugs mas violam padrão]

### ❌ Violações (N itens — devem ser corrigidas)
- [violações que causam bugs em produção, vazamentos de dados ou acoplamento indevido]
  - Arquivo: src/modules/<name>/...
  - Linha aproximada: ...
  - Correção: ...

### Próximos Passos
1. [ação prioritária 1]
2. [ação prioritária 2]
```

---

## Quick Reference

| Violação comum | O que procurar | Correção |
|---|---|---|
| `HttpException` em use case | `throw new ForbiddenException` | Substituir por domain error `_FORBIDDEN` |
| `organizationId` do body | `dto.organizationId` | Usar `context.organizationId` |
| IDOR ausente | `findById(id)` sem comparar `organizationId` | Passar `organizationId` e comparar |
| Erro sem sufixo | `readonly code = 'INVALID_PLATE'` | Adicionar sufixo: `INVALID_PLATE_BAD_REQUEST` |
| `toDomain` usando `create()` | `Entity.create(raw)` | Trocar para `Entity.restore(raw)` |
| Listagem global sem `@Dev()` | `GET /resources` sem guard de dev | Adicionar `@UseGuards(DevGuard) @Dev()` |
