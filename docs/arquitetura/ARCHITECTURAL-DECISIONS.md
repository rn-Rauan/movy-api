# Decisões Arquiteturais — Movy API

> Registro das principais decisões técnicas tomadas ao longo do projeto, com contexto, problema enfrentado, alternativas consideradas e solução adotada.

---

## ADR-001 — Clean Architecture + DDD Lite por módulo

**Data:** Mar 2026  
**Status:** Vigente

### Contexto
O projeto precisava de uma estrutura que suportasse crescimento orgânico de módulos sem criar acoplamento cruzado entre domínios diferentes (User, Organization, Trip, etc.).

### Decisão
Adotar **Clean Architecture** com **DDD Lite** por módulo. Cada módulo é autocontido com quatro camadas: `domain/`, `application/`, `infrastructure/`, `presentation/`. O domínio não conhece NestJS, Prisma ou HTTP.

### Consequências
- Use cases nunca lançam `HttpException` — apenas `DomainError`
- Repositórios são interfaces (abstract classes) — implementações Prisma ficam em `infrastructure/`
- Troca de ORM ou framework não afeta as regras de negócio
- Custo: mais arquivos e boilerplate por módulo

---

## ADR-002 — Erros de Domínio com mapeamento por sufixo de código

**Data:** Abr 2026  
**Status:** Vigente

### Contexto
Os use cases inicialmente lançavam `HttpException` do `@nestjs/common` (ex: `ConflictException`, `NotFoundException`). Isso acoplava a camada de aplicação ao protocolo HTTP — uma regra de negócio não deveria saber que resposta HTTP 409 existe.

### Decisão
Introduzir `DomainError` como classe base para todos os erros de negócio. Cada erro tem um campo `code` com sufixo que o `AllExceptionsFilter` global usa para determinar o HTTP status:

| Sufixo do `code` | HTTP |
|---|---|
| `_NOT_FOUND` | 404 |
| `_ALREADY_EXISTS` | 409 |
| `INVALID_` / `_BAD_REQUEST` | 400 |
| `_FORBIDDEN` | 403 |
| `_UNAUTHORIZED` | 401 |

### Consequências
- Use cases completamente desacoplados de HTTP
- Novos tipos de erro são adicionados sem alterar o filtro de exceções
- Padronização da nomenclatura de erros em todos os módulos

---

## ADR-003 — TenantContext populado no JwtAuthGuard, não em middleware

**Data:** 11 Abr 2026  
**Status:** Vigente

### Contexto
A implementação inicial usava um `TenantContextMiddleware` para extrair dados do JWT e popular `req.context`. O middleware rodava **antes** do `JwtAuthGuard`, então `req.user` ainda não existia quando o middleware executava — o `TenantContext` nunca era populado.

### Problema
O pipeline do NestJS executa middlewares antes de guards. O Passport só decodifica o JWT dentro do guard. Qualquer código que dependa de `req.user` precisa rodar em um guard, não em middleware.

### Decisão
Mover a população de `req.context` para dentro do `JwtAuthGuard`, logo após `super.canActivate()` (que aciona o Passport). O guard extrai `organizationId`, `role` e `isDev` do payload JWT enriquecido e monta o `TenantContext`.

### Consequências
- Pipeline correto: `JwtAuthGuard → RolesGuard → TenantFilterGuard → DevGuard`
- `TenantContextMiddleware` eliminado
- `TenantContext` sempre disponível para todos os guards subsequentes

---

## ADR-004 — JWT Strategy sem query ao banco por request

**Data:** 13 Abr 2026  
**Status:** Vigente

### Contexto
A `JwtStrategy.validate()` original chamava `userRepository.findById(sub)` a cada request autenticado para confirmar que o usuário ainda existia e estava ativo. Isso adicionava uma query de banco em cada request.

### Decisão
Eliminar a query do `JwtStrategy`. A strategy retorna diretamente o payload do JWT, que é enriquecido no momento do login/refresh com todos os dados necessários (`userId`, `organizationId`, `role`, `isDev`, `userStatus`). A confiança é depositada no JWT assinado.

### Trade-offs
- **Ganho:** eliminação de 1 SQL por request autenticado
- **Custo aceito:** se um usuário for desativado no banco, seu access token permanece válido até expirar (1 hora). Esse é o trade-off padrão de sistemas JWT stateless.
- O refresh token valida o usuário no banco (`userRepository.findById`) — então na próxima rotação o estado é reconciliado.

---

## ADR-005 — Desacoplamento Organization ↔ Membership (padrão Orchestrator)

**Data:** 14 Abr 2026  
**Status:** Vigente

### Contexto
O `CreateOrganizationUseCase` importava `MembershipRepository` e `RoleRepository` para criar automaticamente a membership ADMIN quando uma organização era criada. Isso violava o SRP e criava dependência circular entre módulos (`OrganizationModule → MembershipModule`).

### Decisão
Transferir a responsabilidade de orquestração para o `RegisterOrganizationWithAdminUseCase` no módulo Auth, usando o padrão **Orchestrator**:

```
RegisterOrganizationWithAdminUseCase
  → CreateUserUseCase
  → CreateOrganizationUseCase
  → CreateMembershipUseCase
```

O `OrganizationModule` passou a importar apenas `SharedModule`, sem nenhuma dependência do `MembershipModule`.

### Consequências
- `OrganizationModule` coeso e sem acoplamento externo
- Orquestração atômica possível via `TransactionManager` (ver ADR-010)
- `POST /organizations` restrito a `@Dev()` — criação real de orgs ocorre via `POST /auth/register-organization`

---

## ADR-006 — organizationId nunca vem do body de requests

**Data:** 14 Abr 2026  
**Status:** Vigente

### Contexto
O `CreateMembershipDto` aceitava `organizationId` como campo opcional no body. Isso abria um vetor onde um ator malicioso poderia enviar um `organizationId` diferente e criar memberships em outra organização.

### Decisão
O `organizationId` **sempre** vem do JWT (`req.context.organizationId`), nunca do body da requisição. Essa regra é aplicada em todos os módulos: memberships, vehicles, trips, bookings.

### Consequências
- `CreateMembershipDto` simplificado para `{ userEmail: string, roleId: number }`
- Eliminação de um vetor de injection cross-tenant em toda a API
- Convenção documentada: controllers extraem `organizationId` via `@GetTenantId()` ou `@GetUser()`

---

## ADR-007 — Driver desacoplado de Organization (15 Abr 2026)

**Data:** 15 Abr 2026  
**Status:** Vigente

### Contexto
O model `Driver` possuía uma coluna `organizationId` com FK direta para `Organization`. Isso criava um lock onde um usuário só podia ser motorista de **uma** organização — fundamental incompatível com SaaS multi-tenant onde um motorista freelancer pode trabalhar para várias empresas.

### Decisão
Remover `organizationId` do schema `Driver`. O vínculo driver→organização passa a ser feito exclusivamente via `OrganizationMembership` (tabela pivot já existente). Migration `remove_org_from_driver` aplicada.

O fluxo de onboarding de motorista ficou:
1. Usuário cria perfil driver via `POST /drivers` (self-service, `userId` do JWT)
2. Admin busca motorista por email + CNH via `GET /drivers/lookup` (verificação de identidade)
3. Admin vincula via `POST /memberships` com `roleId=DRIVER`

### Consequências
- Um usuário pode ser motorista em múltiplas organizações simultaneamente
- `findByOrganizationId` reimplementado via JOIN: `user.userRoles.some({ organizationId, removedAt: null, role: { name: 'DRIVER' } })`
- Verificação de ownership para IDOR: `belongsToOrganization(driverId, orgId)` via query de membership, não FK direta

---

## ADR-008 — Proteção IDOR via verificação de ownership no use case

**Data:** 17 Abr 2026  
**Status:** Vigente

### Contexto
Endpoints com parâmetro `/:id` (sem `:organizationId` na rota) não validavam se o recurso pertencia à organização do caller. Um admin da Org A poderia acessar veículos/drivers da Org B conhecendo o UUID.

### Decisão
Dois mecanismos de proteção dependendo da entidade:

**Entidades com FK direta** (Vehicle, TripTemplate, TripInstance):
```typescript
if (vehicle.organizationId !== organizationId) {
  throw new VehicleAccessForbiddenError();
}
```

**Entidades sem FK direta** (Driver — vínculo via membership):
```typescript
const belongs = await this.driverRepository.belongsToOrganization(driverId, orgId);
if (!belongs) throw new DriverAccessForbiddenError();
```

**Rotas com `:organizationId` no path:** protegidas pelo `TenantFilterGuard` antes de chegar ao use case.

### Consequências
- Erros de acesso são HTTP 403 (`_FORBIDDEN`), não 404 — o recurso existe, mas o caller não tem acesso
- `VehicleAccessForbiddenError`, `DriverAccessForbiddenError`, `TripInstanceAccessForbiddenError`, `BookingAccessForbiddenError` adicionados

---

## ADR-009 — Snapshot de dados críticos em TripInstance e Enrollment

**Data:** 21 Abr 2026  
**Status:** Vigente

### Contexto
`TripInstance` é criada a partir de um `TripTemplate`. Se o template for atualizado (preços, capacidade, `isPublic`) após instâncias já criadas, os dados históricos ficariam inconsistentes.

### Decisão
Campos críticos são **copiados** (snapshot) para `TripInstance` no momento da criação, não lidos dinamicamente do template:

- `TripInstance.totalCapacity` — snapshot da capacidade do veículo no ato da criação
- `TripInstance.isPublic` — snapshot de `TripTemplate.isPublic`
- `TripInstance.minRevenue` — snapshot do template (ou null se `autoCancelEnabled=false`)
- `TripInstance.autoCancelAt` — calculado: `departureTime - autoCancelOffset`

Da mesma forma, `Enrollment.recordedPrice` é o preço no ato da inscrição — imutável após criação.

### Consequências
- Histórico financeiro preservado mesmo com mudanças no template
- Preço é definido server-side no `CreateBookingUseCase` (busca o `TripTemplate` e seleciona o preço correto) — cliente não envia o preço

---

## ADR-010 — TransactionManager com AsyncLocalStorage (UnitOfWork)

**Data:** 27 Abr 2026  
**Status:** Vigente

### Contexto
Operações como `RegisterOrganizationWithAdminUseCase` (User → Org → Membership) e `CreateBookingUseCase` (Enrollment → Payment) precisavam de atomicidade. A abordagem inicial usava compensação manual (rollback explícito em caso de falha), o que era frágil e complexo.

### Alternativas Consideradas
1. **Compensação manual** — callbacks de rollback explícitos por etapa. Implementado inicialmente, removido depois. Complexo e propenso a bugs.
2. **Prisma `$transaction` passado como parâmetro** — funcionaria mas polui as assinaturas dos use cases com detalhe de infraestrutura.
3. **AsyncLocalStorage com TransactionManager** — solução adotada.

### Decisão
`TransactionManager.runInTransaction(callback)` usa `AsyncLocalStorage` para propagar o client transacionado sem alterar as assinaturas dos repositórios. O `PrismaService` detecta se há uma transação ativa no contexto e usa automaticamente o client transacionado.

```typescript
await this.transactionManager.runInTransaction(async () => {
  await this.userRepository.save(user);       // usa tx automaticamente
  await this.orgRepository.save(org);         // usa tx automaticamente
  await this.membershipRepository.save(m);    // usa tx automaticamente
  // rollback automático se qualquer save lançar
});
```

### Consequências
- Código de compensação manual completamente eliminado
- Rollback automático pelo Prisma em qualquer falha dentro da transação
- Use cases não conhecem detalhes de transação — responsabilidade do orchestrator

---

## ADR-011 — Revogação de Refresh Token via JTI

**Data:** 01 Mai 2026  
**Status:** Vigente

### Contexto
Refresh tokens JWT são stateless por natureza — uma vez emitidos, são válidos até expirar. Isso impede implementar logout real ou detectar tokens roubados.

### Decisão
Cada refresh token recebe um claim `jti` (JWT ID, UUID v4) que é persistido na tabela `refresh_tokens`. O `RefreshTokenUseCase` valida a existência do JTI antes de aceitar o token. O `LogoutUseCase` apaga o JTI para revogar a sessão.

Rotação de token: cada uso de um refresh token gera um novo par de tokens e invalida o JTI anterior.

### Trade-offs
- **Access token** permanece stateless — não é revogável. Expira em 1h (padrão da indústria para tokens de curta duração).
- **Refresh token** é revogável — tem estado no banco.
- Adição de 1 SQL por operação de refresh (lookup do JTI) — custo aceito para suportar logout real.

### Consequências
- Logout verdadeiro implementável (`POST /auth/logout`)
- Roubo de refresh token é detectável: se o token legítimo usar um JTI já consumido, o sistema rejeita
- Tabela `refresh_tokens` com cascade `onDelete: Cascade` no user — limpeza automática

---

## ADR-012 — Expiração de Assinatura Lazy (sem cron)

**Data:** 29 Abr 2026  
**Status:** Vigente

### Contexto
Assinaturas têm `expiresAt`. Seria necessário um job agendado (cron) para detectar e marcar assinaturas expiradas como `PAST_DUE` periodicamente.

### Decisão
A expiração é verificada **on-demand** (`lazy`). A função `resolveActiveSubscription(orgId, repo)` verifica `expiresAt < now()` no momento em que a assinatura é lida. Se expirada, muda o status para `PAST_DUE` na mesma operação.

### Consequências
- Sem necessidade de cron job ou scheduler externo
- Infraestrutura simplificada
- Custo: a assinatura pode permanecer como `ACTIVE` no banco por um curto período após expirar, até a próxima leitura — aceito para este caso de uso
- `PlanLimitService` e `FindActiveSubscriptionUseCase` usam `resolveActiveSubscription` internamente

---

## ADR-013 — Isolamento de Transação Serializable em CreateBookingUseCase

**Data:** 25–27 Abr 2026  
**Status:** Vigente

### Contexto
O `CreateBookingUseCase` verifica disponibilidade (`countActiveByTripInstance`) antes de criar a inscrição. Duas requisições simultâneas poderiam ler a mesma contagem e ambas concluírem que há vaga disponível, criando uma condição de corrida clássica de sistemas de reservas.

### Decisão
Todo o fluxo de criação de booking — incluindo o `countActiveByTripInstance` — é executado dentro de `runInTransaction` com nível de isolamento `Serializable`. Sob `Serializable`, duas transações que leram o mesmo dado conflitam: uma recebe erro `P2034` do Prisma e é retentada com dados atualizados.

### Consequências
- Eliminação da race condition de reservas duplas
- Maior contenção no banco para esse endpoint específico — aceito dado o volume esperado
- Prisma lida com o retry automaticamente via `P2034`

---

## ADR-014 — PublicTripQueryService como cross-aggregate read service

**Data:** 21 Abr 2026  
**Status:** Vigente

### Contexto
Os endpoints públicos de viagem (`GET /public/trip-instances`) precisavam retornar dados de `TripInstance` junto com campos do `TripTemplate` associado (preços, origem, destino). `TripInstanceRepository` não deveria carregar dados de outro agregado para não violar o SRP.

### Decisão
Criar `PublicTripQueryService` como abstract class no domínio com implementação em `infrastructure/db/services/`. Esse serviço realiza o JOIN entre `TripInstance` e `TripTemplate` diretamente no banco, retornando um DTO de leitura (`PublicTripInstanceData`) específico para o caso de uso.

### Consequências
- `TripInstanceRepository` permanece focado em persistência de instâncias
- Queries de leitura complexas (cross-aggregate) têm um lugar explícito na arquitetura
- `PublicTripQueryService` é read-only — nunca muta dados

---

## ADR-015 — Validação de prerequisito Driver antes do check de soft-delete em Membership

**Data:** 14 Abr 2026  
**Status:** Vigente

### Contexto
O `CreateMembershipUseCase` verificava se uma membership soft-deleted existia (para restaurá-la) antes de validar se o usuário tinha perfil Driver. Um ator malicioso podia usar uma membership DRIVER previamente removida para "reativar" um vínculo sem ter criado perfil Driver.

### Decisão
A validação de prerequisito (existence de perfil Driver para `roleId=DRIVER`) ocorre **antes** do check de soft-delete. A ordem explícita é:
1. Buscar usuário por email
2. Se role = DRIVER → validar existência de perfil Driver
3. Checar membership existente (ativa ou soft-deleted)
4. Criar ou restaurar

### Consequências
- Bypass via reativação de membership eliminado
- A validação de domínio sempre ocorre independentemente do estado da membership

---

## ADR-016 — AllExceptionsFilter com mapeamento declarativo por padrão de código

**Data:** 13 Abr 2026  
**Status:** Vigente

### Contexto
O filtro global de exceções usava lógica imperativa com múltiplos `if/else instanceof` para mapear tipos de erro para status HTTP. Adicionar um novo tipo de erro exigia alterar o filtro.

### Decisão
Substituir a lógica imperativa por mapeamento declarativo: o filtro inspeciona o sufixo do `DomainError.code` e determina o HTTP status. Nenhuma alteração no filtro é necessária para suportar novos tipos de erro — basta usar o sufixo correto no `code`.

### Consequências
- Filtro estável e extensível sem modificação
- Convenção de nomenclatura de `code` de erros torna-se parte do contrato da arquitetura
- Erros com sufixos não reconhecidos caem para HTTP 500 (detecção rápida de erros mal configurados)

---

## ADR-017 — Testes unitários com injeção manual, sem mocks de framework

**Data:** 16 Abr 2026  
**Status:** Vigente

### Contexto
Testes com `TestingModule` do NestJS são mais lentos e acoplados ao framework. Use cases são classes simples que recebem dependências no construtor — não precisam do container IoC para ser testados.

### Decisão
Testes unitários usam injeção manual de dependências. Padrão adotado:

```typescript
function makeMocks() {
  return {
    repo: { findById: jest.fn(), save: jest.fn() } as jest.Mocked<Repository>,
  };
}
// sut = new UseCase(mocks.repo)
```

Config dedicada `test/jest-unit.json` com `moduleNameMapper` para aliases `src/` e `test/`.

### Consequências
- Testes rápidos e isolados
- Sem dependência do container NestJS nos testes de use case
- `npm test` (config raiz) não funciona para testes unitários — usar `npx jest --config test/jest-unit.json`

---

---

## ADR-018 — JWT mono-org: token carrega apenas uma organizationId por sessão

**Data:** 01 Mai 2026  
**Status:** Limitação conhecida — implementação futura pendente

### Contexto

O `JwtPayloadService.enrichPayload()` chama `MembershipRepository.findFirstActiveByUserId()`, que retorna a **primeira** membership ativa ordenada por `assignedAt ASC`. Isso significa que o JWT é sempre emitido com o contexto de uma única org — a mais antiga.

Um usuário administrador em múltiplas organizações fica preso na org mais antiga e não consegue acessar as demais via API sem intervenção manual.

### Problema Concreto

```
Admin "joao@empresa.com" possui memberships ativas em:
  - Org A (assignedAt: 2024-01-01)  ← selecionada no JWT
  - Org B (assignedAt: 2024-02-01)  ← inacessível

PATCH /organizations/org-b-uuid/... → 403 Forbidden
```

O `TenantFilterGuard` compara o `:organizationId` da rota com `req.context.organizationId` do JWT. Mismatch imediato → 403.

### Causa Raiz

O design original assumiu que um usuário pertenceria a no máximo uma organização por vez. O repositório já possui `findAllActiveByUserId()` (preparado mas não utilizado), evidenciando que o multi-org switching foi planejado mas não implementado.

### Alternativas Consideradas

1. **Múltiplos tokens (um por org)** — descartado: complexidade no cliente, gerenciamento de N refresh tokens.
2. **Trocar `organizationId` pelo param da rota dinamicamente** — descartado: eliminaria a garantia de isolamento do `TenantFilterGuard`.
3. **Endpoint `POST /auth/switch-organization`** — abordagem escolhida para implementação futura: usuário troca de contexto explicitamente e recebe novo par de tokens com a `organizationId` da org destino, com rotação de refresh token.

### Decisão Temporária

Mantém o comportamento atual (primeira org por `assignedAt`). Nenhuma mudança de código até a feature de switching ser implementada.

### Impacto

- Usuários com **1 organização** → sem impacto.
- Usuários com **2+ organizações** → precisam de suporte manual ou aguardar o switching.
- Usuários `isDev` → sem impacto (bypass de todas as verificações de org).

### Plano de Implementação

Ver `plan.md` na session state. Resumo das peças necessárias:

1. `OrganizationSwitchForbiddenError` (domain error, sufixo `_FORBIDDEN`)
2. `SwitchOrganizationDto` (`{ organizationId: UUID, refreshToken: string }`)
3. `JwtPayloadService.enrichPayload(userId, targetOrganizationId?)` — parâmetro opcional
4. `SwitchOrganizationUseCase` — valida membership ativa + rotaciona tokens
5. `POST /auth/switch-organization` com `JwtAuthGuard`

---

## Resumo Cronológico

| Data | ADR | Decisão |
|---|---|---|
| Mar 2026 | ADR-001 | Clean Architecture + DDD Lite por módulo |
| Abr 2026 | ADR-002 | DomainError com mapeamento por sufixo de código |
| 11 Abr | ADR-003 | TenantContext no JwtAuthGuard, não em middleware |
| 13 Abr | ADR-004 | JWT Strategy sem query ao banco por request |
| 13 Abr | ADR-016 | AllExceptionsFilter com mapeamento declarativo |
| 14 Abr | ADR-005 | Desacoplamento Organization ↔ Membership (Orchestrator) |
| 14 Abr | ADR-006 | organizationId nunca vem do body |
| 14 Abr | ADR-015 | Validação de prerequisito Driver antes do soft-delete check |
| 15 Abr | ADR-007 | Driver desacoplado de Organization |
| 16 Abr | ADR-017 | Testes unitários com injeção manual |
| 17 Abr | ADR-008 | Proteção IDOR via ownership check no use case |
| 21 Abr | ADR-009 | Snapshot de dados críticos em TripInstance/Enrollment |
| 21 Abr | ADR-014 | PublicTripQueryService como cross-aggregate read service |
| 25 Abr | ADR-013 | Isolamento Serializable em CreateBookingUseCase |
| 27 Abr | ADR-010 | TransactionManager com AsyncLocalStorage |
| 29 Abr | ADR-012 | Expiração de assinatura lazy (sem cron) |
| 01 Mai | ADR-011 | Revogação de Refresh Token via JTI |
| 01 Mai | ADR-018 | JWT mono-org: limitação conhecida de multi-org switching |
