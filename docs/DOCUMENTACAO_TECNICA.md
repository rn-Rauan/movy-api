# Documentação Técnica: Movy API - SaaS de Gerenciamento de Transporte

## 1. Introdução
A Movy API é o núcleo de um ecossistema de software como serviço (SaaS) projetado para otimizar o gerenciamento de transporte coletivo e viagens recorrentes. O sistema permite que organizações de transporte gerenciem frotas, motoristas, rotas e passageiros de forma centralizada e eficiente.

## 2. Metodologia
A metodologia adotada para o desenvolvimento do projeto baseia-se em práticas modernas de engenharia de software, garantindo escalabilidade, manutenibilidade e robustez.

### 2.1 Abordagem de Desenvolvimento
- **Domain-Driven Design (DDD):** Foco no domínio do negócio, utilizando padrões como **Entidades** para representar objetos com identidade (ex: `User`), **Value Objects** para encapsular regras de validação de dados (ex: `Email`, `UserName`) e o **Padrão de Repositório** para abstrair a persistência de dados.
- **Clean Architecture:** Organização do código em camadas concêntricas (Domínio, Aplicação, Infraestrutura, Apresentação), garantindo que as regras de negócio sejam independentes de frameworks externos.
- **Desenvolvimento Modular:** Divisão do sistema em módulos independentes (User, Organization, Trip, etc.), facilitando a manutenção e o crescimento orgânico do projeto.
- **Test-Driven Development (TDD):** Priorização da criação de testes unitários e de integração (utilizando Jest) para garantir a integridade das funcionalidades.

### 2.2 Tecnologias Utilizadas
A stack tecnológica foi selecionada visando alta performance e produtividade:

| Tecnologia           | Função                    | Justificativa                                                |
| :------------------- | :------------------------ | :----------------------------------------------------------- |
| **Node.js (v18+)**   | Ambiente de execução      | Alta performance e ecossistema maduro.                       |
| **NestJS (v11)**     | Framework Backend         | Estrutura modular e suporte nativo a TypeScript.             |
| **TypeScript**       | Linguagem                 | Tipagem estática e redução de erros em tempo de execução.    |
| **Prisma (v7)**      | ORM                       | Tipagem forte para o banco de dados e migrações seguras.     |
| **PostgreSQL**       | Banco de Dados Relacional | Confiabilidade e suporte a consultas complexas.              |
| **Docker**           | Conteinerização           | Padronização do ambiente de desenvolvimento e produção.      |
| **JWT / NestJS**     | Autenticação             | Implementação customizada de autenticação JWT com NestJS e Bcrypt. |
| **Bcrypt**           | Segurança                 | Hash seguro de senhas para proteção de dados sensíveis.      |
| **Jest (v30)**       | Testes Unitários          | Framework de testes com ts-jest para execução de testes TypeScript. |

---

## 3. Arquitetura do Sistema

### 3.1 Diagrama de Arquitetura de Software
O sistema utiliza uma arquitetura baseada em camadas dentro de cada módulo, seguindo os princípios de Clean Architecture:

```mermaid
graph TD
    subgraph Presentation_Layer
        Controller[Controllers / API REST]
        DTO[DTOs / Request Validation]
    end

    subgraph Application_Layer
        UseCase[Use Cases / Serviços de Aplicação]
    end

    subgraph Domain_Layer
        Entity[Entities / Agregados]
        ValueObjects[Value Objects]
        Interface[Repository Interfaces]
        Errors[Domain Errors]
    end

    subgraph Infrastructure_Layer
        RepoImpl[Prisma Repository Implementation]
        DB[PostgreSQL / Prisma ORM]
        External[External Providers - Hash, Auth]
    end

    Controller --> UseCase
    UseCase --> Entity
    UseCase --> Interface
    RepoImpl -- Implements --> Interface
    RepoImpl --> DB
```

### 3.2 Estrutura de Pastas
A organização do projeto reflete a modularidade e a separação de camadas:
- `src/modules/`: Contém os módulos funcionais do sistema (ex: `user`).
  - `application/`: DTOs e Casos de Uso.
  - `domain/`: Entidades, Value Objects e interfaces de repositório.
  - `infrastructure/`: Implementações de banco de dados e mappers.
  - `presentation/`: Controladores e rotas.
- `src/shared/`: Recursos compartilhados (filtros de exceção, interceptadores, provedores globais).
- `prisma/`: Esquema do banco de dados e arquivos de migração.
- `test/`: Testes unitários organizados por módulo, com factories e configuração Jest dedicada.

---

## 4. Resultados Parciais

Até o momento, o projeto atingiu os seguintes marcos:

### 4.1 Modelagem de Dados Completa
O esquema do banco de dados (`schema.prisma`) foi totalmente desenhado, contemplando:
- Gerenciamento de **Organizações** (Multi-tenancy).
- Planos e Assinaturas (**SaaS model**).
- Gestão de **Frotas** (Veículos e Motoristas).
- Agendamento de **Viagens Recorrentes** e Instâncias de Viagem.
- Sistema de **Inscrições** e **Pagamentos**.

### 4.2 Implementação Completa do Módulo de Usuário (CRUD)
O módulo de usuários foi implementado de forma completa, servindo como um pilar para as demais funcionalidades do sistema, com integração de autenticação JWT. Todos os módulos seguem princípios de Clean Architecture e Domain-Driven Design, com clara separação de responsabilidades.

As seguintes funcionalidades foram implementadas e validadas:
- **`POST /users`**: Cadastro de novos usuários com validação de DTOs (`CreateUserDto`) e hashing de senha utilizando Bcrypt.
- **`GET /users`**: Lista todos os usuários com status `ACTIVE`, com suporte a **paginação** através dos query parameters `page` e `limit`. A resposta é encapsulada em um DTO paginado, que inclui os dados, o total de itens e informações da página.
- **`GET /users/:id`**: Busca de um usuário específico por ID. A lógica de negócio garante que usuários inativos (soft-deleted) não sejam retornados, resultando em um erro `404 Not Found` para proteger a informação.
- **`PUT /users/:id`**: Atualização dos dados de um usuário. O DTO de atualização (`UpdateUserDto`) foi projetado para permitir apenas a modificação de campos pertinentes, garantindo a imutabilidade de dados sensíveis.
- **`DELETE /users/:id`**: Implementação de **Soft Delete**. Em vez de uma exclusão física, a operação altera o status do usuário para `INACTIVE`. Esta abordagem preserva a integridade referencial dos dados e o histórico do sistema, sendo uma prática recomendada para sistemas complexos.

### 4.2.1 Módulo de Autenticação (JWT)
O módulo de autenticação implementa um sistema completo de login, registro, refresh de tokens JWT e registro de organização com admin, seguindo os princípios de Clean Architecture:

**Endpoints REST:**
- **`POST /auth/login`**: Autenticação de usuário com email e senha, retornando access token e refresh token.
- **`POST /auth/register`**: Registro de novo usuário com validação de dados e hashing de senha.
- **`POST /auth/refresh`**: Renovação de access token utilizando refresh token válido.
- **`POST /auth/register-organization`**: Fluxo unificado de registro — cria usuário (admin), organização e membership ADMIN em uma única chamada, retornando os tokens de acesso diretamente *(adicionado 12 Abr 2026)*.
- **`POST /auth/setup-organization`**: Fluxo para usuário já autenticado (sem org) criar uma organização — retorna novo JWT com o contexto da org embutido *(adicionado 14 Abr 2026)*.

**Use Cases Implementados:**
1. `LoginUseCase`: Validação de credenciais, geração de tokens JWT e retorno de dados do usuário.
2. `RegisterUseCase`: Criação de novo usuário com validação de email único e hashing de senha.
3. `RefreshTokenUseCase`: Validação de refresh token e geração de novo par de tokens.
4. `RegisterOrganizationWithAdminUseCase`: Orquestra criação de usuário + organização + membership ADMIN + login automático **atomicamente via `TransactionManager.runInTransaction`** — rollback automático pelo Prisma se qualquer etapa falhar *(atualizado 27 Abr 2026: compensação manual substituída por transação).*
5. `SetupOrganizationForExistingUserUseCase`: Cria organização para usuário já autenticado, gera membership ADMIN e re-emite JWT com o novo `organizationId` no payload *(adicionado 14 Abr 2026)*.

**Infraestrutura de Segurança:**
- **JWT Strategy**: Implementação customizada com Passport.js para validação de tokens. *Otimizado em 13 Abr 2026* — a query ao banco (`userRepository.findById`) foi removida do ciclo de validação. A strategy agora confia exclusivamente no payload do JWT (enriquecido no momento do login), resultando em melhoria significativa de performance por eliminar uma consulta ao banco a cada request autenticado.
- **Bcrypt**: Hashing seguro de senhas com salt rounds configuráveis.
- **JwtAuthGuard**: Guard global para proteção de rotas autenticadas.
- **Token Response**: DTO estruturado com access token, refresh token e dados do usuário.

**Camadas de Implementação:**
- **Domínio**: Regras de negócio para autenticação e geração de tokens.
- **Aplicação**: Use cases com validação de entrada e tratamento de erros específicos.
- **Infraestrutura**: JWT strategy, Bcrypt provider e integração com banco de dados.
- **Apresentação**: Controlador com documentação Swagger completa e validação de DTOs.

### 4.3 Módulo Completo de Organização (CRUD)
O módulo de organização foi implementado com suporte total a operações CRUD, servindo como base para a arquitetura multi-tenant do sistema:

**Endpoints REST:**
- **`POST /organizations`**: Criação de nova organização com validação de CNPJ, nome, email e telefone.
- **`GET /organizations`**: Listagem de todas as organizações (ativas e inativas) com suporte a paginação (`page`, `limit`).
- **`GET /organizations/active`**: Listagem exclusiva de organizações com status `ACTIVE`, paginada.
- **`GET /organizations/me`**: Lista as organizações às quais o usuário autenticado pertence (paginado). Acessível por ADMIN e DRIVER. *(novo 21 Abr 2026)*
- **`GET /organizations/:id`**: Busca de organização específica por ID com validação de existência.
- **`PUT /organizations/:id`**: Atualização de dados da organização (nome, email, telefone, endereço, slug).
- **`DELETE /organizations/:id`**: Desativação da organização via **soft delete** (altera status para `INACTIVE`).

**Use Cases Implementados:**
1. `CreateOrganizationUseCase`: Validação e criação com geração automática de slug *(refatorado 14 Abr 2026: SRP — apenas cria a entidade Organização, sem dependências de Membership ou Role)*.
2. `FindAllOrganizationsUseCase`: Listagem paginada de todas as organizações.
3. `FindAllActiveOrganizationsUseCase`: Listagem paginada apenas de organizações ativas.
4. `FindOrganizationByIdUseCase`: Busca com tratamento de não-encontrado e validação de acesso via `OrganizationForbiddenError` *(atualizado 14 Abr)*.
5. `UpdateOrganizationUseCase`: Atualização com re-validação e `OrganizationForbiddenError` *(atualizado 14 Abr)*.
6. `DisableOrganizationUseCase`: Soft delete com auditoria de timestamp e `OrganizationForbiddenError` *(atualizado 14 Abr)*.
7. `FindOrganizationByUserUseCase`: Retorna orgs associadas ao `userId` do token JWT (paginado), delegando para `findOrganizationByUserId` no repositório. *(novo 21 Abr 2026)*

**Value Objects e Entidades:**
- **`Cnpj`**: Value Object com validação de CNPJ (formato e dígitos verificadores).
- **`OrganizationName`**: Value Object com regras de tamanho e caracteres.
- **`Slug`**: Value Object para URL-friendly identifier gerado automaticamente.
- **`Address`**: Value Object para endereço da organização.
- **`Email` e `Telephone`**: Value Objects compartilhados com validação de domínio.
- **`Status`**: Type union `ACTIVE | INACTIVE` para rastreamento de estado.

**Camadas de Implementação:**
- **Domínio**: Entidade `Organization` com propriedades imutáveis e setters que validam através de Value Objects. Erros de domínio: `OrganizationNotFoundError`, `OrganizationAlreadyExistsError`, `OrganizationForbiddenError` *(novo 14 Abr)*.
- **Aplicação**: DTOs (`CreateOrganizationDto`, `UpdateOrganizationDto`, `OrganizationResponseDto`) com validação via class-validator. Interface `TenantContextParams` centralizada em `dtos/index.ts` *(movida 14 Abr)*.
- **Infraestrutura**: `PrismaOrganizationRepository` implementando a interface `OrganizationRepository`.
- **Apresentação**: `OrganizationController` com JWT authentication guard global. `POST /organizations` restrito a `@Dev()` *(atualizado 14 Abr)* — criação real de organizações ocorre via `POST /auth/register-organization`.

**Decisão Arquitetural (14 Abr 2026) — Desacoplamento Organization ↔ Membership:**
O `CreateOrganizationUseCase` anteriormente importava `MembershipRepository` e `RoleRepository` para criar automaticamente a membership ADMIN. Isso violava o Princípio da Responsabilidade Única (SRP) e criava acoplamento circular entre módulos. A solução adotada foi o padrão **Orchestrator** no `RegisterOrganizationWithAdminUseCase` (módulo Auth), que executa a sequência User → Org → Membership **atomicamente via `TransactionManager.runInTransaction`** — o rollback é gerenciado pelo Prisma, sem código de compensação manual. O `OrganizationModule` agora importa apenas o `SharedModule`, com zero dependência do `MembershipModule`.

### 4.4 Sistema de Roles e Permissões
Implementada a base de um sistema de controle de acesso baseado em roles (RBAC):
- **Role Entity**: Entidade para representar funções do sistema (ADMIN, DRIVER, USER).
- **Role Repository**: Interface de repositório para abstração de persistência.
- **Role Mapper**: Mapper para conversão entre entidades e DTOs.
- **Seed Script**: Script de inicialização que popula automaticamente os roles no banco de dados na primeira execução.
- **Database Seeding**: Configuração do `docker-compose.yml` para executar seed automaticamente quando o banco é iniciado pela primeira vez.


## 4.5 Módulo Completo de Membership (Associações)
O módulo de membership foi implementado para gerenciar associações entre usuários, roles e organizações, utilizando a tabela `OrganizationMembership` como base. Ele suporta multi-tenancy e é fundamental para RBAC futuro.

**Endpoints REST:**
- **`POST /memberships`**: Criar associação (user + role + organization).
- **`GET /memberships/user/:userId`**: Listar associações de um usuário (paginado).
- **`GET /memberships/organization/:organizationId`**: Listar associações de uma organização (paginado).
- **`GET /memberships/me/role/:organizationId`**: Retorna o role do usuário autenticado em uma organização específica. Acessível por ADMIN e DRIVER. *(novo 21 Abr 2026)*
- **`GET /memberships/:userId/:roleId/:organizationId`**: Buscar por chave composta.
- **`PATCH /memberships/:userId/:roleId/:organizationId/restore`**: Restaurar associação.
- **`DELETE /memberships/:userId/:roleId/:organizationId`**: Remover (soft delete).

**Use Cases Implementados:**
1. `CreateMembershipUseCase`: Validação e criação com prevenção de duplicatas. *(atualizado 14 Abr: recebe `tenantOrganizationId` via JWT, valida prerequisito Driver antes do check de soft-delete)*
2. `FindMembershipByCompositeKeyUseCase`: Busca específica com erro 404.
3. `FindMembershipsByUserUseCase`: Listagem paginada por usuário. *(atualizado 14 Abr: filtrada pela org do caller para não-devs)*
4. `FindMembershipsByOrganizationUseCase`: Listagem paginada por organização.
5. `RemoveMembershipUseCase`: Soft delete via `removedAt`.
6. `RestoreMembershipUseCase`: Reversão de soft delete.
7. `FindRoleByUserIdAndOrganizationIdUseCase`: Retorna o role do usuário em uma organização. Exposto via `GET /memberships/me/role/:organizationId`. *(exposto via HTTP em 21 Abr 2026)*

**Entidades e Value Objects:**
- **`Membership`**: Entidade com propriedades imutáveis e métodos `create()`, `remove()`, `restore()`.
- **Erros de Domínio**: `MembershipAlreadyExistsError`, `MembershipNotFoundError`, `DriverNotFoundForMembershipError` *(novo 14 Abr → HTTP 400)*.
- **`RoleResponseDto`**: `{ id: number, name: RoleName }` com decorators Swagger — usado no endpoint de role do usuário. *(novo 21 Abr 2026)*

**Segurança e Isolamento de Tenant (14 Abr 2026):**
- `POST /memberships` não aceita mais `organizationId` no body — a org vem exclusivamente do JWT (`TenantContext.organizationId`). Isso elimina o vetor de ataque em que um actor malicioso poderia criar memberships em outra organização.
- `GET /memberships/user/:userId` retorna apenas memberships da org do caller (para não-devs), prevenindo vazamento de dados cross-tenant.
- `CreateMembershipDto` simplificado para `{ userEmail: string, roleId: number }` — sem campos opcionais ambíguos.
- Validação de prerequisito para role DRIVER: a API verifica se o usuário possui perfil `Driver` associado à organização antes de criar a membership. A validação ocorre ANTES do check de soft-delete para impedir bypass via reativação.

**Camadas de Implementação:**
- **Domínio**: Entidade `Membership` com regras de negócio.
- **Aplicação**: DTOs (`CreateMembershipDto`, `MembershipResponseDto`, `RoleResponseDto`) com validação.
- **Infraestrutura**: `PrismaMembershipRepository` implementando `MembershipRepository`.
- **Apresentação**: `MembershipController` com JWT guard e `MembershipPresenter`.

### 4.7 Módulo Completo de Driver (CRUD com Value Objects) | Redesign Arquitetural (15 Abr 2026)
O módulo de driver foi implementado com arquitetura 100% alinhada com o User Module, utilizando Value Objects para encapsular validações de CNH. Em 15 Abr 2026, o módulo passou por um redesign arquitetural significativo: a coluna `organizationId` foi removida do model `Driver`, desacoplando o motorista da organização. Motoristas agora são entidades globais, vinculados a organizações exclusivamente via `OrganizationMembership`. Isso permite que um usuário seja motorista em múltiplas organizações simultaneamente.

**Endpoints REST:**
- **`POST /drivers`**: Criar perfil de motorista (self-service). O usuário preenche CNH, categoria e data de expiração. O `userId` é extraído do JWT. Validação de duplicata: se o usuário já possui perfil, retorna `DriverAlreadyExistsError` (HTTP 409). *(redesenhado 15 Abr)*
- **`GET /drivers/me`**: Obter perfil do driver atual (autenticado).
- **`GET /drivers/lookup`**: Buscar perfil de motorista por e-mail + CNH. Usado pelo admin para verificar identidade antes de vincular driver à org via membership. Requer `@Roles(ADMIN)`. *(novo 15 Abr)*
- **`GET /drivers/organization/:organizationId`**: Listar drivers da organização (paginado). Implementado via JOIN: `user.userRoles.some({ organizationId, role: { name: 'DRIVER' } })`. *(reimplementado 15 Abr)*
- **`GET /drivers/:id`**: Buscar driver específico por ID.
- **`PUT /drivers/:id`**: Atualizar dados do driver (CNH, status).
- **`DELETE /drivers/:id`**: Remover driver (soft delete).

**Use Cases Implementados (7 total):**
1. `CreateDriverUseCase`: Criação self-service com check de duplicata *(redesenhado 15 Abr)*
2. `UpdateDriverUseCase`: Atualização com coordenação de value objects
3. `FindDriverByIdUseCase`: Busca com tratamento 404
4. `FindDriverByUserIdUseCase`: Busca por usuário
5. `FindAllDriversByOrganizationUseCase`: Paginação com JOIN via membership *(reimplementado 15 Abr)*
6. `RemoveDriverUseCase`: Soft delete com validação
7. `LookupDriverUseCase`: Verificação cruzada email + CNH para admin *(novo 15 Abr)*

**Value Objects Implementados:**
- **`Cnh`**: Valida 9-12 caracteres alfanuméricos com create factory e .value_ getter
- **`CnhCategory`**: Enum A-E com VALID_CATEGORIES, isValid() static e create factory

**Entidade Driver:**
- DriverEntity com DriverProps interface
- Propriedades privadas com getters públicos
- Métodos de mutação: activate(), deactivate(), suspend(), updateCnh()
- Static factory create() e restore() para DDD compliance

**Domain Errors:**
- InvalidCnhError, InvalidCnhCategoryError, DriverNotFoundError, DriverAlreadyExistsError *(novo 15 Abr)*, DriverProfileNotFoundByEmailError *(novo 15 Abr)*, DriverCreationFailedError, DriverUpdateFailedError, e outros *(11+ tipos)*

**Mapper Pattern:**
- toDomain(): Hidratação de value objects via Cnh.create(), CnhCategory.create()
- toPersistence(): Extração de valores primitivos com .value_

**Decisão Arquitetural (15 Abr 2026) — Desacoplamento Driver ↔ Organization:**
O model `Driver` possuía uma coluna `organizationId` com relação direta para `Organization`, criando um lock onde um usuário só podia ser motorista de **uma** organização. Isso era uma limitação arquitetural fundamental para um SaaS multi-tenant. A solução foi remover `organizationId` do `Driver` e utilizar a tabela `OrganizationMembership` (já existente) como tabela pivot. O vínculo driver→org agora é feito quando o admin cria uma membership com `roleId=DRIVER`. O fluxo completo:
1. Usuário se registra e cria perfil de motorista via `POST /drivers` (self-service)
2. Admin busca o motorista via `GET /drivers/lookup?email=x&cnh=y` (verificação de identidade)
3. Admin cria membership via `POST /memberships` com `roleId=DRIVER` (vincula motorista à org)

**Alinhamento Arquitetural:**
- ✅ Repository: save() → Promise<DriverEntity | null>, update() → Promise<DriverEntity | null>
- ✅ Repository: delete() em vez de remove(), findByOrganizationId(options: PaginationOptions)
- ✅ Paginação: PaginatedResponse<DriverEntity> com page, limit, totalPages
- ✅ DTOs: Arquivos separados com @ApiProperty/@ApiPropertyOptional
- ✅ Presenter: Métodos estáticos toHTTP() e toHTTPList()
- ✅ RBAC: @Roles(RoleName.ADMIN), RolesGuard, TenantFilterGuard
- ✅ Schema: DriverStatus enum (ACTIVE, INACTIVE, SUSPENDED)
- ✅ Redesign: Driver desacoplado de Organization (15 Abr)

### 4.10 Infraestrutura de Testes Unitários ✅ IMPLEMENTADO (16 Abr 2026)

Foi implementada uma infraestrutura completa de testes unitários utilizando Jest 30 com ts-jest, cobrindo os use cases críticos do sistema. Os testes seguem o padrão AAA (Arrange-Act-Assert) com injeção manual de dependências, sem mocks de framework.

**Configuração:**
- `test/jest-unit.json`: Configuração dedicada com `rootDir`, `testRegex` para arquivos em `test/`, e `moduleNameMapper` para resolver aliases `src/`.
- Comando de execução: `npx jest --config test/jest-unit.json`

**Padrão de Testes Adotado:**
- **`makeMocks()`**: Função que cria todos os mocks necessários para o use case com `jest.fn()` e tipagem via `as any as jest.Mocked<T>`.
- **`setupHappyPath()`**: Configura os mocks para o cenário de sucesso padrão, retornando as entidades criadas.
- **`sut`** (System Under Test): Instância real do use case com dependências injetadas manualmente.
- **Factories por módulo**: Funções `make*()` que criam entidades de domínio com valores padrão e suporte a overrides.

**Suites de Teste (37 suites, 278 testes):**

| Use Case | Testes | Cenários Cobertos |
|----------|--------|--------------------|
| `LoginUseCase` | 5 | Happy path (tokens + user info), orquestração de chamadas, user not found, user inactive, senha incorreta |
| `RegisterOrganizationWithAdminUseCase` | 5 | Happy path, orquestração User→Org→Membership, rollback transacional (org fail), rollback transacional (membership fail), role not found |
| `SetupOrganizationForExistingUserUseCase` | 6 | Happy path, orquestração completa, user not found, user inactive, ADMIN role not found, membership fails |
| `CreateMembershipUseCase` | 7 | Happy path ADMIN, happy path DRIVER com perfil, restore soft-deleted, user not found, DRIVER sem perfil, membership already exists |
| `CreateDriverUseCase` | 4 | Happy path criação, verificação de duplicata, DriverAlreadyExistsError, DriverCreationFailedError |
| `CreateTripTemplateUseCase` | 5 | Happy path (create + return, save once, campos corretos), TripTemplateCreationFailedError, InvalidTripPriceConfigurationError |
| `FindTripTemplateByIdUseCase` | 4 | Happy path, TripTemplateNotFoundError, TripTemplateAccessForbiddenError, acesso por org |
| `UpdateTripTemplateUseCase` | 8 | Happy path, campos atualizados, save once, NotFoundError, AccessForbiddenError, InactiveError, update null, sem campos |
| `DeactivateTripTemplateUseCase` | 4 | Happy path, TripTemplateNotFoundError, TripTemplateAccessForbiddenError, template já inativo |
| `CreateTripInstanceUseCase` | 15 | Happy path, campos propagados do template, TripInstanceCreationFailedError, validações de capacidade e datas |
| `FindTripInstanceByIdUseCase` | 5 | Happy path, TripInstanceNotFoundError, TripInstanceAccessForbiddenError, retorno de campos corretos |
| `FindAllTripInstancesByOrganizationUseCase` | 4 | Happy path, paginação, lista vazia, campos corretos |
| `FindTripInstancesByTemplateUseCase` | 8 | Happy path, paginação, lista vazia, filtro por templateId, campos corretos |
| `TransitionTripInstanceStatusUseCase` | 15 | Happy paths (SCHEDULED→IN_PROGRESS, IN_PROGRESS→COMPLETED/CANCELLED), InvalidTripStatusTransitionError (múltiplas transições inválidas), NotFoundError, AccessForbiddenError |
| `AssignDriverToTripInstanceUseCase` | 11 | Happy path (atribuir + desatribuir null), DriverNotFoundError (FK validation), TripInstanceNotFoundError, TripInstanceAccessForbiddenError |
| `AssignVehicleToTripInstanceUseCase` | 11 | Happy path (atribuir + desatribuir null), VehicleNotFoundError (FK validation), TripInstanceNotFoundError, TripInstanceAccessForbiddenError |
| `FindAllTripTemplatesByOrganizationUseCase` | 4 | Happy path, chamada de repo com args corretos, lista vazia, repasse da resposta paginada |
| `CreateVehicleUseCase` | 4 | Happy path (criação + save), PlateAlreadyInUseError, VehicleCreationFailedError |
| `FindVehicleByIdUseCase` | 3 | Happy path, VehicleNotFoundError, VehicleAccessForbiddenError |
| `CreateUserUseCase` | 3 | Happy path (criação + hash de senha), UserEmailAlreadyExistsError |
| `FindUserByIdUseCase` | 3 | Happy path, UserNotFoundError (inexistente), UserNotFoundError (inativo) |
| `CreateOrganizationUseCase` | 4 | Happy path (criação + save), CNPJ duplicado, slug duplicado |
| `FindOrganizationByIdUseCase` | 6 | Happy path, bypass dev, OrganizationNotFoundError (inexistente + inativo), OrganizationForbiddenError |
| `CreateBookingUseCase` | 18 | Happy path SCHEDULED/CONFIRMED, reinscrição após cancelamento, TripInstanceNotBookableError (DRAFT/CANCELED/IN_PROGRESS), BookingAlreadyExistsError, TripInstanceNotFoundError, BookingCreationFailedError, PaymentCreationFailedError, transação atômica via UnitOfWork (DbContext/AsyncLocalStorage) |
| `CancelBookingUseCase` | 8 | Happy path (status INACTIVE), update chamado uma vez, entidade persistida com INACTIVE, BookingAlreadyInactiveError, BookingNotFoundError, BookingAccessForbiddenError, update retorna null |
| `ConfirmPresenceUseCase` | 7 | Happy path org member (presenceConfirmed=true), update chamado uma vez, entidade persistida corretamente, BookingAlreadyInactiveError, owner bloqueado (2 testes), BookingNotFoundError, BookingAccessForbiddenError cross-org |
| `FindBookingByIdUseCase` | 5 | Happy path, findById chamado com id correto, BookingNotFoundError, BookingAccessForbiddenError (cross-org), dados não expostos no forbidden |
| `FindBookingsByOrganizationUseCase` | 5 | Happy path (lista paginada), args corretos, mapeamento para dto, lista vazia, metadados de paginação preservados |
| `FindBookingsByTripInstanceUseCase` | 9 | Happy path com ORG_ID (4 testes), TripInstanceNotFoundError (2), acesso negado — org mismatch, B2C, repo não chamado (3 testes) |
| `FindBookingsByUserUseCase` | 8 | Happy path, userId correto (somente as próprias), mapeamento para dto, lista vazia, filtro status ACTIVE, filtro INACTIVE, filtro undefined (sem filtro) |
| `FindBookingDetailsUseCase` | 11 | Happy path owner (4 testes), happy path org member (1), BookingNotFoundError (2), BookingAccessForbiddenError (3), TripInstanceNotFoundError (1) |
| `GetBookingAvailabilityUseCase` | 9 | SCHEDULED/CONFIRMED bookable (2), DRAFT/IN_PROGRESS não bookable (2), trip lotada (1), capacity=0 (1), tripInstanceId no response (1), trip not found (2) |
| `CreatePlanUseCase` | 5 | Happy path (create + save, durationDays correto, ordem findByName→save), PlanAlreadyExistsError (error + save não chamado), PlanCreationFailedError |
| `SubscribeToPlanUseCase` | 7 | Happy path (create + save once, expiresAt = now + plan.durationDays), PlanNotFoundError (inexistente + inativo), SubscriptionAlreadyActiveError (error + save não chamado), SubscriptionCreationFailedError |
| `DevGuard` | 8 | Rota sem `@Dev()` → permite (3 variações de ctx), `isDev=true` → permite, `isDev=false` → ForbiddenException (ADMIN + DRIVER), ctx ausente → BadRequestException, verificação de metadata com DEV_ONLY_KEY |
| `RolesGuard` | 9 | Sem `@Roles()` → permite (null + empty array), ADMIN em rota ADMIN → permite, DRIVER em rota ADMIN → ForbiddenException, DRIVER em rota ADMIN\|DRIVER → permite, sem role → ForbiddenException, `isDev=true` → bypass, ctx ausente → BadRequestException, metadata com ROLES_KEY |
| `TenantFilterGuard` | 9 | ctx ausente → BadRequestException, `isDev=true` → bypass (2 casos), `organizationId` param match → permite, mismatch → ForbiddenException, `orgId` param match → permite, `query.organizationId` match → permite, org member sem param → permite, B2C sem param → ForbiddenException |

**Factories Implementadas (20 total):**

| Factory | Localização | Entidade/DTO |
|---------|------------|-------------|
| `makeUser()` | `test/modules/user/factories/` | User entity com value objects |
| `makeOrganization()` | `test/modules/organization/factories/` | Organization entity com value objects |
| `makeRole()` | `test/shared/factories/` | Role entity (ADMIN/DRIVER) |
| `makeJwtPayload()` | `test/modules/auth/factories/` | JwtPayload object |
| `makeMembership()` | `test/modules/membership/factories/` | Membership entity (suporte a removedAt) |
| `makeDriver()` | `test/modules/driver/factories/` | DriverEntity com Cnh/CnhCategory |
| `makeRegisterOrgDto()` | `test/modules/auth/factories/` | RegisterOrganizationWithAdminDto |
| `makeSetupOrgDto()` | `test/modules/auth/factories/` | SetupOrganizationDto |
| `makeCreateDriverDto()` | `test/modules/driver/factories/` | CreateDriverDto |
| `makeTripTemplate()` | `test/modules/trip/factories/` | TripTemplateEntity |
| `makeTripInstance()` | `test/modules/trip/factories/` | TripInstanceEntity |
| `makeCreateTripTemplateDto()` | `test/modules/trip/factories/` | CreateTripTemplateDto |
| `makeCreateTripInstanceDto()` | `test/modules/trip/factories/` | CreateTripInstanceDto |
| `makeUpdateTripTemplateDto()` | `test/modules/trip/factories/` | UpdateTripTemplateDto |
| `makeVehicle()` | `test/modules/vehicle/factories/` | VehicleEntity com Plate value object |
| `makeBooking()` | `test/modules/bookings/factories/` | Booking entity com Money/EnrollmentType |
| `makeCreateBookingDto()` | `test/modules/bookings/factories/` | CreateBookingDto literal |
| `makePlan()` | `test/modules/plans/factories/` | PlanEntity com durationDays |
| `makeCreatePlanDto()` | `test/modules/plans/factories/` | CreatePlanDto com durationDays |
| `makeSubscription()` | `test/modules/subscriptions/factories/` | SubscriptionEntity com expiresAt calculado |

**Estrutura de Pastas dos Testes:**
```
test/
├── jest-unit.json
├── modules/
│   ├── auth/
│   │   ├── factories/ (jwt-payload, register-org.dto, setup-org.dto)
│   │   └── application/use-cases/ (login, register-org, setup-org specs)
│   ├── membership/
│   │   ├── factories/ (membership)
│   │   └── application/use-cases/ (create-membership spec)
│   ├── driver/
│   │   ├── factories/ (driver, create-driver.dto)
│   │   └── application/use-cases/ (create-driver spec)
│   ├── trip/
│   │   ├── factories/ (trip-template, trip-instance, create-trip-template.dto, create-trip-instance.dto, update-trip-template.dto)
│   │   └── application/use-cases/ (11 specs: create/find/update/deactivate template + create/find/findAll/findByTemplate/transition/assignDriver/assignVehicle instance)
│   ├── vehicle/
│   │   ├── factories/ (vehicle)
│   │   └── application/use-cases/ (create-vehicle, find-vehicle-by-id specs)
│   ├── user/
│   │   ├── factories/ (user)
│   │   └── application/use-cases/ (create-user, find-user-by-id specs)
│   └── organization/
│       ├── factories/ (organization)
│       └── application/use-cases/ (create-organization, find-organization-by-id specs)
   ├── bookings/
│   ├── factories/ (booking, create-booking.dto)
│   └── application/use-cases/ (9 specs: create, cancel, confirm-presence, find-by-id, find-by-org, find-by-trip-instance, find-by-user, find-booking-details, get-booking-availability)
│   ├── plans/
│   │   ├── factories/ (plan, create-plan.dto)
│   │   └── application/use-cases/ (create-plan spec)
│   └── subscriptions/
│       ├── factories/ (subscription)
│       └── application/use-cases/ (subscribe-to-plan spec)
└── shared/
    ├── factories/ (role)
    └── guards/ (dev.guard, roles.guard, tenant-filter.guard)
```

**Total Bookings:** 9 suites, 85 testes. **Total projeto (27 Abr):** 34 suites, 252 testes. **Total projeto (28 Abr):** 37 suites, 278 testes (guards: DevGuard, RolesGuard, TenantFilterGuard). **Total projeto (29 Abr):** 37 suites, 280 testes (mocks de `PlanLimitService` adicionados em 4 specs: register-org, create-driver, create-trip-instance, create-vehicle).

**Fix Jest — `moduleNameMapper`
Adicionado `"^test/(.*)$": "<rootDir>/test/$1"` em `test/jest-unit.json` e `package.json`. Sem esse mapeamento, imports como `import { makeTripInstance } from 'test/modules/trip/factories/...'` falhavam na resolução de módulo quando o spec era rodado pelo VS Code Jest runner (que usa o config do `package.json` diretamente).

### 4.8 RBAC (Role-Based Access Control) Architecture ✅ COMPLETO (11 Abr 2026)

**Problema Identificado e Corrigido:**
O middleware `TenantContextMiddleware` não funcionava corretamente no pipeline do NestJS porque rodava ANTES do `JwtAuthGuard`. Isso significa que quando o middleware executava, `req.user` ainda não existia (Passport não havia decodificado o JWT), resultando em `req.context` nunca ser populado.

**Solução Implementada:**
A população de `req.context` foi movida para dentro do `JwtAuthGuard` (após a validação do JWT pelo Passport), garantindo que todos os guards subsequentes tenham acesso ao `TenantContext`.

**Pipeline NestJS (Correto):**
```
Request
  ↓
JwtAuthGuard.canActivate()
  ├─ super.canActivate()        → Passport valida JWT, popula req.user
  ├─ Cria TenantContext        → Extrai organizationId, role, isDev de req.user
  ├─ req.context = context     → Injetar no request
  └─ return true
  ↓
RolesGuard.canActivate()        → Lê @Roles() metadata, compara com ctx.role
  ↓
TenantFilterGuard.canActivate() → Compara :organizationId param com ctx.organizationId
  ↓
DevGuard.canActivate()          → Verifica ctx.isDev se @Dev() está presente
  ↓
Controller handler
```

**Três Guards com Responsabilidades Distintas:**

1. **TenantFilterGuard** — *Multi-tenant Isolation*
   - Pergunta: "Você pertence a essa organização?"
   - Valida que o `:organizationId` na rota corresponde ao `ctx.organizationId` do JWT
   - Garante isolamento total entre tenants
   - Exemplo: `GET /organizations/org-123/drivers` rejeita se `ctx.organizationId !== 'org-123'`
   - Bypass: Devs (`isDev=true`) pulam essa validação

2. **RolesGuard** — *Authorization by Role*
   - Pergunta: "Você tem permissão para fazer isso dentro da sua org?"
   - Lê metadata `@Roles()` e compara com `ctx.role`
   - Controla o que cada role pode fazer (ADMIN, DRIVER, etc)
   - Exemplo: `DELETE /organizations/:id` com `@Roles(ADMIN)` rejeita DRIVER mesmo na org correta
   - Bypass: Devs (`isDev=true`) pulam essa validação

3. **DevGuard** — *Developer-Only Access*
   - Pergunta: "Você é desenvolvedor?"
   - Bloqueia acesso de usuários comuns a endpoints internos/debug
   - Apenas para rotas marcadas com `@Dev()`
   - Exemplo: `GET /users` (listagem global) é dev-only, `GET /users/me` é qualquer autenticado
   - Sem bypass automático — isDev é necessário

**Composição de Guards Típica:**

```typescript
// Rota de negócio com acesso restrito por role
@UseGuards(JwtAuthGuard)                    // autenticado?
class OrganizationController {
  @UseGuards(TenantFilterGuard, RolesGuard)
  @Roles(RoleName.ADMIN)
  @Delete('/organizations/:id/drivers/:driverId')
  deleteDriver() { }  // apenas ADMIN da org pode acessar
}

// Rota de debug exclusiva para devs
@UseGuards(JwtAuthGuard)                    // autenticado?
class DebugController {
  @UseGuards(DevGuard)
  @Dev()
  @Get('/debug/users')
  debugUsers() { }  // apenas devs podem acessar
}
```

**Componentes Implementados:**

| Componente | Arquivo | Descrição |
|-----------|---------|----------|
| `@Dev()` decorator | `infrastructure/decorators/dev.decorator.ts` | Marca rota como dev-only |
| `DevGuard` | `infrastructure/guards/dev.guard.ts` | Valida `ctx.isDev` se `@Dev()` presente |
| `RolesGuard` | `infrastructure/guards/roles.guard.ts` | Valida `ctx.role` contra `@Roles()` |
| `TenantFilterGuard` | `infrastructure/guards/tenant-filter.guard.ts` | Valida isolamento multi-tenant |
| `JwtAuthGuard` | `infrastructure/guards/jwt.guard.ts` | **Novo:** Popula `req.context` após validação |
| `TenantContext` interface | `infrastructure/types/tenant-context.interface.ts` | **Novo:** Fonte única de verdade, centralizada |
| `@Roles()` decorator | `infrastructure/decorators/roles.decorator.ts` | Existente, define roles requeridas |

**Detecção de Devs:**
Devs são identificados pela variável de ambiente `DEV_EMAILS` (CSV), que é verificada durante o enriquecimento do JWT no `JwtPayloadService`. Usuários com email na whitelist recebem `isDev=true` no payload do JWT e **pulam automaticamente** validações de `organizationId` e `role`.

**Status:** ✅ Funcional e testado em produção (11 Abr 2026)

---

### 4.9 Infraestrutura de Desenvolvimento
- Configuração de ambiente com Docker e Docker Compose.
- Pipeline de migrações Prisma configurado.
- Sistema global de tratamento de exceções e logs.
- Seed automático integrado ao lifecycle de inicialização do Docker.
- Shared Module padronizado para expor componentes reutilizáveis.
- Value Objects com validação centralizada (Cnh, CnhCategory, Email, Telephone, etc.)
- RBAC Architecture com guards descentralizados e contexto centralizado (TenantContext)

---

## 5. Principais Desafios e Soluções

| Desafio                                 | Solução Implementada                                                  | 
|**Multi-tenancy (SaaS)**                 | Implementação do modelo de `Organization` e `OrganizationMembership`, garantindo que dados de diferentes empresas sejam isolados. |
| **Autenticação JWT**                     | Implementação customizada de login, refresh token e registro com `JwtModule`, `JwtStrategy` e `Bcrypt`. |
| **Complexidade de Viagens Recorrentes** | Separação em `TripTemplate` (modelo da rota) e `TripInstance` (execução específica), permitindo agendamentos flexíveis.           |
| **Manutenibilidade do Código**          | Adoção de Clean Architecture, que isola as regras de negócio de mudanças em tecnologias externas (como troca de ORM ou Banco de Dados). |
| **Garantia da Integridade dos Dados**   | A validação de dados de domínio (ex: formato de e-mail, comprimento do nome) foi encapsulada em **Value Objects**. Isso substituiu o uso de tipos primitivos (`string`) e validadores espalhados, garantindo que um dado só possa ser instanciado em um estado válido, aumentando a robustez e a segurança do sistema. |
| **Segurança de Dados**                  | Uso de Bcrypt para senhas e validação rigorosa de DTOs para prevenir entradas maliciosas.                                         |
| **Acoplamento da Lógica de Negócio com o Protocolo HTTP** | Inicialmente, os casos de uso lançavam exceções HTTP (ex: `ConflictException`). Isso acoplava a camada de aplicação a detalhes da camada de apresentação. **Solução:** Foi implementado um sistema de **Erros de Domínio** (`DomainError`), onde os casos de uso lançam erros de negócio específicos (ex: `UserEmailAlreadyExistsError`). Um filtro global (`AllExceptionsFilter`) foi modificado para interceptar esses erros de domínio e traduzi-los para os códigos de status HTTP corretos (`409 Conflict`, `404 Not Found`, etc.), garantindo o desacoplamento das camadas. |

---

## 6. Implementações Recentes (11 Abr 2026)

### Driver Module - COMPLETO (11 Abr 2026)
Implementada a arquitetura completa do módulo Driver com total alinhamento com o User Module:

**Componentes Implementados:**
- ✅ **Domain Layer:**
  - DriverEntity com props object pattern (Like User)
  - DriverProps interface com value objects (Cnh, CnhCategory)
  - Value Objects:
    - Cnh: Valida 9-12 caracteres alfanuméricos
    - CnhCategory: Enum A-E com validação e VALID_CATEGORIES
  - 7 Domain Errors específicos (InvalidCnh, InvalidCnhCategory, DriverNotFound, etc)
  - DriverStatus constants (ACTIVE, INACTIVE, SUSPENDED)
  - Métodos de mutação: activate(), deactivate(), suspend(), updateCnh()

- ✅ **Application Layer:**
  - 6 Use Cases: Create, Update, FindById, FindByUserId, FindByOrganization, Remove
  - DTOs separados em 3 arquivos com @ApiProperty decorators
  - CreateDriverDto, UpdateDriverDto, DriverResponseDto com validação class-validator
  - Value object instantiation em CreateDriverUseCase e UpdateDriverUseCase
  - Tratamento de erros com InternalServerErrorException

- ✅ **Infrastructure Layer:**
  - DriverMapper com toDomain (hidratação de value objects) e toPersistence
  - PrismaDriverRepository implementando IDriverRepository
  - Métodos seguindo sinatura de User: save(), update(), delete(), findByOrganizationId(options)
  - Paginação via PaginationOptions e retorno PaginatedResponse
  - Transações Prisma ($transaction) para operações múltiplas

- ✅ **Presentation Layer:**
  - DriverController com 6 endpoints REST
  - RBAC Guards: @Roles(RoleName.ADMIN), RolesGuard, TenantFilterGuard
  - DriverPresenter com métodos estáticos toHTTP() e toHTTPList()
  - Extração de value objects com .value_ nos responses

- ✅ **Schema & Database:**
  - Driver model com DriverStatus enum
  - DriverStatus (ACTIVE, INACTIVE, SUSPENDED)
  - Migrations automáticas via Prisma

**Alinhamento com User Module:**
- ✅ Repositório: save() | null, update() | null, delete(), findByOrganizationId(PaginationOptions)
- ✅ Value Objects: Nova abstração com validação
- ✅ Mapper: toDomain hidrata value objects, toPersistence extrai .value_
- ✅ DTOs: Separados com Swagger documentation
- ✅ Use Cases: Instanciam value objects antes de criar/atualizar entidades
- ✅ Presenter: Métodos estáticos para mapping
- ✅ RBAC: Guards aplicados nos endpoints
- ✅ Compilação: TypeScript ✅ sem erros

---

## 6.2 Implementações Recentes (12-13 Abr 2026)

### Endpoint Register-Organization (12 Abr 2026)
Implementado fluxo unificado de onboarding: um único endpoint `POST /auth/register-organization` que encapsula criação de usuário + organização + membership ADMIN + geração de tokens.
- `RegisterOrganizationWithAdminDto`: DTO unificado com validação de dados do admin e da organização.
- `RegisterOrganizationWithAdminUseCase`: Orquestra os use cases de criação em sequência e retorna tokens de acesso.
- `CreateOrganizationUseCase` atualizado para aceitar `userId` e criar automaticamente a membership ADMIN.
- Migration Prisma aplicada para suportar as novas relações.

## 6.3 Implementações (14 Abr 2026)

### Security Hardening — Organization Module
Os 3 use-cases de acesso à organização (`FindOrganizationByIdUseCase`, `UpdateOrganizationUseCase`, `DisableOrganizationUseCase`) lançavam `ForbiddenException` do `@nestjs/common`, acoplando a camada de domínio ao framework HTTP. A correção introduziu `OrganizationForbiddenError` (erro de domínio com `code = 'ORGANIZATION_ACCESS_FORBIDDEN'`) mapeado pelo `AllExceptionsFilter` para HTTP 403. A interface `TenantContextParams` foi centralizada em `application/dtos/index.ts`, removendo dependência cíclica entre use-cases.

### Membership Module — Simplificação e Isolamento de Tenant
O `CreateMembershipDto` foi simplificado de 3 campos (2 opcionais + 1 potencialmente injeccióvel) para 2 campos obrigatórios: `{ userEmail, roleId }`. O `organizationId` passou a vir exclusivamente do JWT, eliminando um vetor de injection cross-tenant. O endpoint `GET /memberships/user/:userId` foi escopo-restrito à organização do caller.

### Validação de Prerequisito Driver em Membership
A criação de membership com role DRIVER agora valida se o usuário possui um perfil `Driver` ativo e associado à organização-alvo. Dois bugs corrigidos: (a) códigos de erro sem sufixo reconhecido pelo `AllExceptionsFilter` — corrigidos para `_BAD_REQUEST`; (b) validação ocorria após o check de soft-delete, permitindo bypass via reativação — movida para antes.

### Desacoplamento: Organization ↔ Membership
O `CreateOrganizationUseCase` violava o SRP ao importar `MembershipRepository` e `RoleRepository`. A responsabilidade de orquestração foi transferida para o `RegisterOrganizationWithAdminUseCase` (módulo Auth), que executa a sequência User → Org → Membership **atomicamente via `TransactionManager.runInTransaction`** (27 Abr 2026: padrão de compensação manual removido — rollback gerenciado pelo Prisma). O `OrganizationModule` agora importa apenas o `SharedModule`.

```
// Antes:
OrganizationModule → imports: [SharedModule, forwardRef(() => MembershipModule)]

// Depois:
OrganizationModule → imports: [SharedModule]
```

### Novo Endpoint: POST /auth/setup-organization
Criado para atender o caso de uso de usuários já autenticados que ainda não possuem organização. O `SetupOrganizationForExistingUserUseCase` valida o usuário, cria a organização, cria a membership ADMIN e re-emite o JWT com o novo `organizationId` no payload. O frontend recebe o token atualizado na mesma resposta, sem necessidade de re-login.

---

O `JwtStrategy.validate()` foi refatorado para eliminar a consulta ao banco de dados (`userRepository.findById`) executada a cada request autenticado. A strategy agora retorna diretamente o payload do JWT, que é enriquecido no momento do login/refresh com todos os dados necessários (`userId`, `organizationId`, `role`, `isDev`). Isso elimina latencia desnecessária e reduz carga no banco.

### Refactoring Driver Module (13 Abr 2026)
- Use cases reescritos com error handling mais preciso e tipó forte TypeScript.
- `PrismaDriverRepository` reestruturado para maior consistência e confiabilidade.
- Novos tipos de erro adicionados ao `driver.errors.ts` (total: 9+ tipos).

### AllExceptionsFilter Refatorado (13 Abr 2026)
O filtro global de exceções foi refatorado para usar mapeamento de erros por padrão de código de erro de domínio, tornando o código mais declarativo e facilmente extensível para novos tipos de erro sem alterar a lógica de despacho.

### TypeScript: Migração para `import type` (12 Abr 2026)
Imports de tipos foram migrados para a sintaxe `import type` em todos os módulos relevantes, melhorando o isolamento de dependências em tempo de compilação e seguindo boas práticas de TypeScript.

## 6.4 Implementações (15 Abr 2026)

### Senior Code Audit + 15 Correções P2/P3
Foi realizado um audit completo do código por um modelo de revisão sênior, resultando em nota 7.5/10 com 5 problemas críticos, 7 médios e 8 menores identificados. Todas as correções P2/P3 foram aplicadas:
- **RefreshTokenDto**: Criado com class-validator para validar body do `POST /auth/refresh` (antes era `@Body('refreshToken')` sem tipo)
- **Rate Limiting**: `@nestjs/throttler` instalado e configurado globalmente (60 req/min via APP_GUARD)
- **Dead Code Removal**: 6+ arquivos deletados (resolvers, middleware morto, diretórios vazios)
- **Consolidação GetUser**: Decorator `GetTenantContext` removido, todas as referências migradas para `GetUser`
- **TenantFilterGuard B2C Fix**: Lógica corrigida — usuários B2C sem org são bloqueados em rotas protegidas (removida checagem frágil de `params.id`)
- **AuthModule @Global()**: Removido — AuthModule agora exporta apenas JwtStrategy, PassportModule e JwtModule
- **Dockerfile**: `npm audit fix` removido do build
- **ESLint**: Fix do crash removendo `@eslint/eslintrc` (compat flat config)
- **tsconfig**: `strict: true` substitui flags individuais; `strictPropertyInitialization: false` mantido
- **Cleanup**: `@supabase/supabase-js` removido, `movy_db_data/` no `.gitignore`, métodos renomeados para camelCase

### Redesign Arquitetural do Driver Module
O model `Driver` foi redesenhado para eliminar a dependência direta com `Organization`:

**Problema:** A coluna `organizationId` no `Driver` criava um lock 1:1 onde um usuário só podia ser motorista de uma única organização — incompatível com a natureza multi-tenant do SaaS.

**Solução:** Remoção de `organizationId` do schema `Driver`. O vínculo driver→organização agora é feito exclusivamente via `OrganizationMembership` (tabela pivot já existente). O fluxo de onboarding de motorista foi redesenhado:
1. Usuário se auto-registra como motorista (`POST /drivers` — self-service, userId do JWT)
2. Admin busca o motorista por email + CNH (`GET /drivers/lookup` — verificação de identidade)
3. Admin vincula o motorista à org via membership (`POST /memberships` com `roleId=DRIVER`)

**Alterações Técnicas:**
- Migration `remove_org_from_driver` aplicada no PostgreSQL
- `DriverEntity`: removido `organizationId` das props, getters, create() e restore()
- `DriverMapper`: `toPersistence()` agora usa `Omit<PrismaDriver, 'id' | 'organizationId'>`
- `PrismaDriverRepository.findByOrganizationId()`: reimplementado via JOIN Prisma — `where: { user: { userRoles: { some: { organizationId, removedAt: null, role: { name: 'DRIVER' } } } } }`
- Novo método `findByCnh()` no repositório
- Novo `LookupDriverUseCase` com verificação cruzada email + CNH
- `CreateMembershipUseCase` simplificado: removido `DriverNotAssociatedWithOrganizationError`

### Varredura Final + 4 Correções
Após análise completa de 41 arquivos do projeto:
- `@supabase/supabase-js` removido das dependencies (havia persistido após fix anterior)
- `@types/passport-jwt` movido de `dependencies` para `devDependencies`
- `CreateDriverUseCase`: check de duplicata adicionado (`DriverAlreadyExistsError` → HTTP 409)
- `GET /drivers/lookup`: validação de query params `email` e `cnh` (não podem ser vazios, retorna HTTP 400)

**Compilação:** ✅ `npx tsc --noEmit` = 0 erros

---

## 6.5 Implementações (17 Abr 2026)

### Vehicle Module — CRUD Completo
Implementação completa do módulo de veículos seguindo Clean Architecture + DDD:

**Domain Layer:**
- `VehicleEntity` com props tipadas, `create()` (factory com validação), `restore()` (hidratação do banco), getters, `activate()`, `deactivate()`, `isActive()`, `updatePlate()`, `updateMaxCapacity()`, `updateModel()`, `updateType()`
- Value Object `Plate` — validação de placa brasileira (formatos `ABC1234` e Mercosul `ABC1D23`) com `create()`, `restore()`, `equals()`, `toString()`
- Enums: `VehicleType { VAN, BUS, MINIBUS, CAR }`, `VehicleStatus { ACTIVE, INACTIVE }`
- 8 domain errors: `InvalidPlateError`, `PlateAlreadyInUseError`, `VehicleNotFoundError`, `VehicleAccessForbiddenError`, `VehicleInactiveError`, `InvalidMaxCapacityError`, `VehicleCreationFailedError`, `VehicleUpdateFailedError`
- Repository interface: `save`, `findById`, `findByPlate`, `findByOrganizationId`, `update`, `delete`

**Infrastructure Layer:**
- `PrismaVehicleRepository` implementando a interface completa
- `VehicleMapper` com `toDomain()` (hidrata `Plate.restore()`, casts de enum) e `toPersistence()`

**Application Layer:**
- 5 use cases: `CreateVehicleUseCase`, `FindVehicleByIdUseCase`, `FindAllVehiclesByOrganizationUseCase`, `UpdateVehicleUseCase`, `RemoveVehicleUseCase`
- DTOs: `CreateVehicleDto`, `UpdateVehicleDto`, `VehicleResponseDto` com class-validator + decorators Swagger

**Presentation Layer:**
- `VehicleController` com 5 endpoints REST, guards `JwtAuthGuard` + `RolesGuard` + `TenantFilterGuard`, `@Roles(ADMIN)`
- `VehiclePresenter` com `toHTTP()` e `toHTTPList()`

**Endpoints:**
| Método | Rota | Descrição |
|--------|------|----------|
| POST | `/vehicles/organization/:organizationId` | Registrar veículo |
| GET | `/vehicles/organization/:organizationId` | Listar veículos da org |
| GET | `/vehicles/:id` | Buscar veículo por ID |
| PUT | `/vehicles/:id` | Atualizar veículo |
| DELETE | `/vehicles/:id` | Soft delete (status → INACTIVE) |

### IDOR Security Hardening — Vehicle & Driver (OWASP A01)
Auditoria de segurança identificou que endpoints com parâmetro `/:id` (sem `:organizationId` na rota) não validavam se o recurso pertencia à organização do caller. Correção aplicada em dois módulos:

**Vehicle Module:**
- `VehicleAccessForbiddenError` (`code = 'VEHICLE_ACCESS_FORBIDDEN'`) → HTTP 403
- `FindVehicleByIdUseCase`, `UpdateVehicleUseCase`, `RemoveVehicleUseCase` agora recebem `organizationId` e comparam diretamente com `vehicle.organizationId`
- Controller extrai `context.organizationId!` do JWT via `@GetUser()` e passa para os use cases

**Driver Module:**
- `DriverAccessForbiddenError` (`code = 'DRIVER_ACCESS_FORBIDDEN'`) → HTTP 403
- Novo método `belongsToOrganization(driverId, organizationId)` na interface e `PrismaDriverRepository`
  - Query: `driver.count({ where: { id, user: { userRoles: { some: { organizationId, removedAt: null } } } } })`
  - Necessário porque `Driver` não tem `organizationId` direto — vínculo é via `OrganizationMembership`
- `FindDriverByIdUseCase`, `UpdateDriverUseCase`, `RemoveDriverUseCase` verificam ownership via `belongsToOrganization`

**Membership Module:** Confirmado seguro — todas as rotas já incluem `:organizationId` no path, validado pelo `TenantFilterGuard`.

### VehicleInactiveError — Proteção de Soft Delete
`UpdateVehicleUseCase` agora verifica `vehicle.isActive()` antes de aplicar qualquer atualização. Se o veículo estiver com `status === INACTIVE` (soft-deleted), lança `VehicleInactiveError` (`code = 'VEHICLE_INACTIVE_GONE'`) → HTTP 410 Gone.

**Compilação:** ✅ `npx tsc --noEmit` = 0 erros

---

## 6.6 Implementações (21 Abr 2026)

### Trip Module — TripTemplate + TripInstance
Implementação completa do módulo de viagens, cobrindo templates (configuração recorrente) e instâncias (execuções reais).

**TripTemplate — Domain Layer:**
- `TripTemplateEntity` com campos: `departurePoint`, `destination`, `frequency` (array `DayOfWeek[]`), `stops`, preços (`priceOneWay`, `priceReturn`, `priceRoundTrip`), `isPublic`, `isRecurring`, `autoCancelEnabled`, `minRevenue`, `autoCancelOffset`, `status`, `shift`
- Domain Errors: `TripTemplateNotFoundError`, `TripTemplateAccessForbiddenError`, `TripTemplateInactiveError`
- Repository interface + `PrismaTripTemplateRepository` + `TripTemplateMapper`
- 5 use cases: `CreateTripTemplateUseCase`, `FindTripTemplateByIdUseCase`, `FindAllTripTemplatesByOrganizationUseCase`, `UpdateTripTemplateUseCase`, `DeactivateTripTemplateUseCase`

**TripInstance — Domain Layer:**
- `TripInstanceEntity` com `driverId?`, `vehicleId?`, `tripTemplateId`, `organizationId`, `tripStatus` (`SCHEDULED | IN_PROGRESS | COMPLETED | CANCELLED`), `totalCapacity`, `departureTime`, `arrivalEstimate`, `autoCancelAt?`, `forceConfirm`, `minRevenue?`
- Métodos de domínio: `assignDriver(driverId | null)`, `assignVehicle(vehicleId | null)`, `transitionStatus(newStatus)`, `forceConfirmTrip()`
- Domain Errors: `TripInstanceNotFoundError`, `TripInstanceAccessForbiddenError`, `InvalidTripStatusTransitionError`
- Repository interface + `PrismaTripInstanceRepository` + `TripInstanceMapper`
- 7 use cases: `CreateTripInstanceUseCase`, `FindTripInstanceByIdUseCase`, `FindAllTripInstancesByOrganizationUseCase`, `FindTripInstancesByTemplateUseCase`, `TransitionTripInstanceStatusUseCase`, `AssignDriverToTripInstanceUseCase`, `AssignVehicleToTripInstanceUseCase`

**Máquina de Estados — `TripInstance.transitionTo()`**

A entidade `TripInstance` encapsula as regras de transição. Toda mudança de status deve passar pelo método `transitionTo(newStatus)` — nunca alterar `tripStatus` diretamente. Transições marcadas com ⚠️ exigem que `driverId` e `vehicleId` estejam atribuídos (validado por `validateSchedulingPrerequisites()`).

| De \ Para | `SCHEDULED` | `CONFIRMED` | `IN_PROGRESS` | `FINISHED` | `CANCELED` |
|-----------|:-----------:|:-----------:|:-------------:|:----------:|:----------:|
| **`DRAFT`** | ✅⚠️     | ❌         | ❌            | ❌         | ✅        |
| **`SCHEDULED`** | ❌   | ✅⚠️ | ❌  | ❌            | ✅        |
| **`CONFIRMED`** | ✅ (revert)  | ❌  | ✅⚠️         | ❌         | ✅        |
| **`IN_PROGRESS`** | ❌ | ❌          | ❌            | ✅        | ✅         |
| **`FINISHED`** | ❌    | ❌          | ❌            | ❌        | ❌ (terminal) |
| **`CANCELED`** | ❌    | ❌          | ❌            | ❌        | ❌ (terminal) |

> ⚠️ = requer driver + vehicle atribuídos | ✅ (revert) = permite voltar de CONFIRMED para SCHEDULED sem pré-requisitos de atribuição

**Endpoints REST — TripTemplate:**
| Método | Rota | Descrição |
|--------|------|----------|
| POST | `/trip-templates` | Criar template |
| GET | `/trip-templates/organization/:organizationId` | Listar templates da org (paginado) |
| GET | `/trip-templates/:id` | Buscar template por ID |
| PUT | `/trip-templates/:id` | Atualizar template |
| DELETE | `/trip-templates/:id` | Desativar template (soft) |

**Endpoints REST — TripInstance:**
| Método | Rota | Descrição |
|--------|------|----------|
| POST | `/trip-instances` | Criar instância a partir de template |
| GET | `/trip-instances/organization/:organizationId` | Listar instâncias da org (paginado) |
| GET | `/trip-instances/template/:templateId` | Listar instâncias de um template (paginado) |
| GET | `/trip-instances/:id` | Buscar instância por ID |
| PUT | `/trip-instances/:id/status` | Transitar status da viagem |
| PUT | `/trip-instances/:id/driver` | Atribuir/desatribuir motorista |
| PUT | `/trip-instances/:id/vehicle` | Atribuir/desatribuir veículo |

### Bug Fix — FK Violations nas Atribuições de Driver/Vehicle (OWASP A05 — Security Misconfiguration)
Os endpoints `PUT /trip-instances/:id/driver` e `PUT /trip-instances/:id/vehicle` chamavam `tripInstanceRepository.update()` com um `driverId` ou `vehicleId` inexistente, causando violação de FK no Postgres e retornando HTTP 500 para o cliente.

**Correção em `AssignDriverToTripInstanceUseCase`:**
```typescript
if (driverId !== null) {
  const driver = await this.driverRepository.findById(driverId);
  if (!driver) throw new DriverNotFoundError(driverId);
}
instance.assignDriver(driverId);
```
- `DriverRepository` injetado via DI
- `DriverNotFoundError` → HTTP 400

**Correção em `AssignVehicleToTripInstanceUseCase`:**
- Mesma lógica com `VehicleRepository` e `VehicleNotFoundError`

**Ajustes de Módulo:**
- `VehicleModule` passou a exportar `VehicleRepository` (estava faltando o array `exports`)
- `TripModule` importa `DriverModule` e `VehicleModule` para DI dos repositórios de validação

### Organization — `GET /organizations/me` (21 Abr 2026)
- `FindOrganizationByUserUseCase` criado, registrado e exportado no `OrganizationModule`
- Endpoint `GET /organizations/me` adicionado ANTES de `GET /organizations/active` (ordenação crítica para evitar conflito de rotas no NestJS)
- Guards: `RolesGuard` com `@Roles(ADMIN, DRIVER)` — sem `TenantFilterGuard` (o próprio `userId` do token garante o isolamento)

### Membership — `GET /memberships/me/role/:organizationId` (21 Abr 2026)
- `FindRoleByUserIdAndOrganizationIdUseCase` já existia e estava exportado, mas sem rota HTTP
- `RoleResponseDto` criado (`{ id: number, name: RoleName }`) com decorators Swagger
- Endpoint `GET /memberships/me/role/:organizationId` acessível por ADMIN e DRIVER
- `userId` extraído do JWT (`@GetUser()`) — não aceita userId no body para evitar ataque de personificação

**Compilação:** ✅ `npx tsc --noEmit` = 0 erros
---

## 6.7 Implementações (25 Abr 2026)

### Bookings Module — Melhorias (25 Abr 2026)

Após a implementação inicial, o módulo passou por um ciclo de melhorias que expandiu de 7 para 9 use cases e de 50 para 85 testes unitários.

**Novos Use Cases:**

`FindBookingDetailsUseCase` — Retorna detalhe enriquecido do booking, incluindo dados da `TripInstance` (horário de partida, estimativa de chegada, status da viagem, capacidade total e vagas disponíveis). Injeta `BookingRepository` + `TripInstanceRepository`. Acesso: owner do booking OU org member. Throws: `BookingNotFoundError`, `BookingAccessForbiddenError`, `TripInstanceNotFoundError`.

`GetBookingAvailabilityUseCase` — Permite a qualquer JWT autenticado verificar disponibilidade antes de criar uma inscrição. Retorna `BookingAvailabilityResponseDto` com `tripInstanceId`, `tripStatus`, `totalCapacity`, `activeCount`, `availableSlots`, `isBookable`. A flag `isBookable = BOOKABLE_STATUSES.has(tripStatus) && availableSlots > 0` onde `BOOKABLE_STATUSES = new Set(['SCHEDULED', 'CONFIRMED'])`.

**Novos DTOs:**
- `BookingDetailsResponseDto`: extends `BookingResponseDto`, adiciona `tripDepartureTime`, `tripArrivalEstimate`, `tripStatus`, `totalCapacity`, `availableSlots`
- `BookingAvailabilityResponseDto`: `tripInstanceId`, `tripStatus`, `totalCapacity`, `activeCount`, `availableSlots`, `isBookable`

**Melhorias em Use Cases Existentes:**

- `CreateBookingUseCase`: Preço gravado server-side — busca o `TripTemplate` via `tripInstance.tripTemplateId` e seleciona `priceOneWay | priceReturn | priceRoundTrip` com base no `enrollmentType`. Client não envia preço. Verifica capacidade via `countActiveByTripInstance` antes de criar (`TripInstanceFullError` → HTTP 409).
- `CancelBookingUseCase`: Bloqueia cancelamento em trips `IN_PROGRESS` ou `FINISHED` (`BookingCancellationNotAllowedError` → HTTP 400). Bloqueia booking já `INACTIVE` (`BookingAlreadyInactiveError` → HTTP 400). Bloqueia cancelamento dentro de 30 minutos da partida (`BookingCancellationDeadlineError` → HTTP 400).
- `ConfirmPresenceUseCase`: Apenas org members podem confirmar presença. Owner é bloqueado com `BookingAccessForbiddenError`. Booking já `INACTIVE` é bloqueado (`BookingAlreadyInactiveError` → HTTP 400).
- `FindBookingsByTripInstanceUseCase`: Aceita `callerOrganizationId?` como 3º parâmetro. Se não for org member, lança `BookingAccessForbiddenError`. Usuaarios B2C não vêem a lista de passageiros.
- `FindBookingsByUserUseCase`: Aceita `status?: Status` como 3º parâmetro, repassado ao repositório para filtro de ACTIVE/INACTIVE.

**Domain Errors (11 total):**
| Error | Código | HTTP |
|-------|--------|------|
| `BookingNotFoundError` | `BOOKING_NOT_FOUND` | 404 |
| `BookingAccessForbiddenError` | `BOOKING_ACCESS_FORBIDDEN` | 403 |
| `BookingAlreadyExistsError` | `BOOKING_ALREADY_EXISTS_CONFLICT` | 409 |
| `InvalidBookingStopError` | `BOOKING_STOP_BAD_REQUEST` | 400 |
| `BookingCreationFailedError` | `BOOKING_CREATION_FAILED_BAD_REQUEST` | 400 |
| `TripInstanceNotBookableError` | `BOOKING_TRIP_INSTANCE_NOT_BOOKABLE_BAD_REQUEST` | 400 |
| `TripInstanceFullError` | `BOOKING_TRIP_INSTANCE_FULL_CONFLICT` | 409 |
| `BookingCancellationNotAllowedError` | `BOOKING_CANCELLATION_NOT_ALLOWED_BAD_REQUEST` | 400 |
| `TripPriceNotAvailableError` | `BOOKING_PRICE_NOT_AVAILABLE_BAD_REQUEST` | 400 |
| `BookingAlreadyInactiveError` | `BOOKING_ALREADY_INACTIVE_BAD_REQUEST` | 400 |
| `BookingCancellationDeadlineError` | `BOOKING_CANCELLATION_DEADLINE_BAD_REQUEST` | 400 |

**Novos Repositório Methods:**
- `findByUserId(userId, options, status?: Status)` — status opcional para filtro
- `countActiveByTripInstance(tripInstanceId)` — conta apenas status ACTIVE para checar capacidade

**Endpoints REST Finais (9 rotas):**
| Método | Rota | Auth | O que faz |
|--------|------|------|-----------|
| POST | `/bookings` | JWT | Cria inscrição (price server-side, capacity check) |
| GET | `/bookings/user?status=ACTIVE\|INACTIVE` | JWT | Bookings do usuário (filtro por status) |
| GET | `/bookings/availability/:tripInstanceId` | JWT | Verifica vagas disponíveis |
| GET | `/bookings/trip-instance/:id` | JWT + ORG | Passageiros (só org members) |
| GET | `/bookings/organization/:id` | JWT + ADMIN | Lista por org (paginado) |
| GET | `/bookings/:id` | JWT | Detalhe básico (owner ou org) |
| GET | `/bookings/:id/details` | JWT | Detalhe enriquecido com dados da viagem |
| PATCH | `/bookings/:id/cancel` | JWT | Cancela (bloqueia IN_PROGRESS/FINISHED) |
| PATCH | `/bookings/:id/confirm-presence` | JWT + ORG | Confirma presença (só org members) |

**Testes Unitários Adicionados:**
- `find-booking-details.use-case.spec.ts`: 11 testes (NOVO)
- `get-booking-availability.use-case.spec.ts`: 9 testes (NOVO)
- `find-bookings-by-trip-instance.use-case.spec.ts`: reescrito (9 testes)
- `find-bookings-by-user.use-case.spec.ts`: atualizado (8 testes)
- `confirm-presence.use-case.spec.ts`: atualizado (7 testes)

**Total bookings:** 9 suites, 85 testes. **Total projeto (27 Abr):** 34 suites, 252 testes. **Total projeto (28 Abr):** 37 suites, 278 testes (guards: DevGuard, RolesGuard, TenantFilterGuard).

**Compilacao:** ✅ `npx tsc --noEmit` = 0 erros

**Bugs corrigidos (27 Abr 2026):**
- `CancelBookingUseCase`: bloqueia cancelamento de booking já `INACTIVE` (`BookingAlreadyInactiveError`)
- `ConfirmPresenceUseCase`: bloqueia confirmação de presença em booking `INACTIVE` (`BookingAlreadyInactiveError`)

**Domain Layer:**
- `Booking` entity com `create()` (factory de criação) e `restore()` (hidratação), métodos `cancel()` (status → INACTIVE) e `confirmPresence()` (presenceConfirmed → true)
- `EnrollmentType` enum: `ONE_WAY | RETURN | ROUND_TRIP`
- `Money` value object para `recordedPrice` (preço gravado no ato da inscrição, imutável após criação)
- 6 domain errors: `BookingNotFoundError`, `BookingAccessForbiddenError`, `BookingAlreadyExistsError`, `InvalidBookingStopError`, `BookingCreationFailedError`, `TripInstanceNotBookableError`
- `BookingRepository` (abstract class): `save`, `update`, `delete`, `findById`, `findAll`, `findByOrganizationId`, `findByUserId`, `findByTripInstanceId`, `findByUserAndTripInstance`

**Infrastructure Layer:**
- `PrismaBookingRepository`: implementa todos os métodos, queries paginadas via `$transaction([findMany, count])`
- `enrollmentType` (Prisma) é mapeado para o `EnrollmentType` (domínio) via `BookingMapper`
- `findByUserAndTripInstance` filtra `status: 'ACTIVE'`; o banco garante no máximo 1 inscrição ativa por `(userId, tripInstanceId)` via chave única em `activeKey` (múltiplas `INACTIVE` são permitidas)
- `BookingMapper.toDomain()` hidrata `Money.restore(Number(raw.recordedPrice))`; `toPersistence()` extrai `entity.recordedPrice.toNumber()`

**Application Layer:**
- 7 use cases com segregação clara de responsabilidades:

| Use Case | Dependências | Regra de negócio principal |
|----------|-------------|----------------------------|
| `CreateBookingUseCase` | BookingRepo + TripInstanceRepo | Trip deve ser SCHEDULED ou CONFIRMED; sem duplicata ativa; userId/orgId do JWT |
| `CancelBookingUseCase` | BookingRepo + TripInstanceRepo | Bloqueia INACTIVE (`BookingAlreadyInactiveError`); bloqueia trip IN_PROGRESS/FINISHED; bloqueia dentro de 30 min da partida; `booking.cancel()` |
| `ConfirmPresenceUseCase` | BookingRepo | Bloqueia INACTIVE (`BookingAlreadyInactiveError`); apenas org members; owner bloqueado; `booking.confirmPresence()` |
| `FindBookingByIdUseCase` | BookingRepo | Verifica org para isolamento de tenant |
| `FindBookingsByOrganizationUseCase` | BookingRepo | Lista paginada por org |
| `FindBookingsByTripInstanceUseCase` | BookingRepo + TripInstanceRepo | Valida ownership da instância antes de retornar inscritos |
| `FindBookingsByUserUseCase` | BookingRepo | Retorna apenas as inscrições do próprio userId |

**Fluxo `CreateBookingUseCase`:**
```
runInTransaction(Serializable) [
  findById(tripInstanceId) → 404 se não encontrado
  verifica tripStatus (SCHEDULED || CONFIRMED) → 400 se não bookable
  countActiveByTripInstance(tripInstanceId) → 409 se lotado  ← dentro da tx
  findByUserAndTripInstance(userId, tripInstanceId) → 409 se já existe ATIVO
  resolvePrice(tripTemplate, enrollmentType) → 400 se preço não disponível
  booking.save() + payment.save() → atômico
]
```
> Todo o fluxo (incluindo o `countActiveByTripInstance`) está dentro de `runInTransaction` com isolamento `Serializable`. Isso fecha a race condition clássica de sistemas de reservas: duas requisições simultâneas que leram a mesma capacidade disponível conflitam a nível de banco — uma recebe `P2034` e é retentada com a contagem atualizada.

**Endpoints REST:**
| Método | Rota | Descrição |
|--------|------|----------|
| POST | `/bookings` | Inscrever (userId/orgId do JWT) |
| GET | `/bookings/organization/:organizationId` | Inscrições da org (paginado) |
| GET | `/bookings/user` | Inscrições do usuário autenticado (paginado) |
| GET | `/bookings/trip-instance/:tripInstanceId` | Inscritos de uma instância (paginado) |
| GET | `/bookings/:id` | Buscar por ID |
| PATCH | `/bookings/:id/cancel` | Cancelar inscrição |
| PATCH | `/bookings/:id/confirm-presence` | Confirmar presença |

**Testes Unitários — 7 suites, 50 testes:**
- Cobrem todos os fluxos de negócio B2C implementados:
  - Inscrição em viagem SCHEDULED e CONFIRMED
  - Prevenção de inscrição duplicada ativa
  - Isolamento por usuário (cada user só vê as próprias)
  - Cancelamento e status correto (INACTIVE)
  - Reinscrição após cancelamento
  - Bloqueio de viagem não inscritível (DRAFT, CANCELED, IN_PROGRESS)
  - Dono da viagem visualiza todos os inscritos
  - Acesso por `hasOrgAccess || isOwner` (admin da org OU dono do booking)

**Fix Jest `moduleNameMapper` (25 Abr 2026):**
Adicionado `"^test/(.*)$": "<rootDir>/test/$1"` nos dois configs Jest (`test/jest-unit.json` e `package.json`). O VS Code Jest runner usa o config de `package.json` diretamente, causando falha na resolução de imports `test/modules/trip/factories/...` sem esse mapeamento.

**Compilação:** ✅ `npx tsc --noEmit` = 0 erros

---

### Plans Module ✅ COMPLETO (26 Abr 2026)

O módulo de planos gerencia os planos de assinatura disponíveis na plataforma. Writes são restritos a desenvolvedores via `DevGuard`; qualquer usuário autenticado pode listar/consultar planos.

**Entity `PlanEntity`:**
- `id`: inteiro gerado pelo banco (`id = 0` na criação)
- `name`: `PlanName` enum — `FREE | BASIC | PRO | PREMIUM`; campo imutável após criação
- `price`: `Money` value object
- `description`, `isActive`: campo boolean controlado por `deactivate()`
- Métodos: `create()` (factory), `restore()` (hidratação), `update()` (atualiza preço/descrição), `deactivate()`

**Use Cases (5):**
| Use Case | Descrição |
|----------|-----------|
| `CreatePlanUseCase` | Valida unicidade do nome, cria plano via `PlanRepository.save()` |
| `UpdatePlanUseCase` | Busca por ID, atualiza via `plan.update()`, persiste |
| `DeactivatePlanUseCase` | Busca por ID, chama `plan.deactivate()`, persiste |
| `FindPlanByIdUseCase` | Busca com `PlanNotFoundError` se não encontrado |
| `FindAllPlansUseCase` | Listagem paginada |

**Domain Errors:**
| Error | Código | HTTP |
|-------|--------|------|
| `PlanNotFoundError` | `PLAN_NOT_FOUND` | 404 |
| `PlanAlreadyExistsError` | `PLAN_ALREADY_EXISTS` | 409 |
| `PlanCreationFailedError` | `PLAN_CREATION_FAILED_BAD_REQUEST` | 400 |

**Endpoints REST (`/plans`):**
| Método | Rota | Auth | O que faz |
|--------|------|------|-----------|
| `POST` | `/plans` | JWT + @Dev() + DevGuard | Cria plano |
| `PATCH` | `/plans/:id` | JWT + @Dev() + DevGuard | Atualiza plano |
| `PATCH` | `/plans/:id/deactivate` | JWT + @Dev() + DevGuard | Desativa plano |
| `GET` | `/plans` | JWT | Lista todos os planos |
| `GET` | `/plans/:id` | JWT | Busca plano por ID |

`PlansModule` exporta `PlanRepository` — injetável em `SubscriptionsModule`.

**Compilação:** ✅ `npx tsc --noEmit` = 0 erros

---

### Payment Module ✅ COMPLETO + SIMULAÇÃO (26–29 Abr 2026)

O módulo de pagamentos combina **leitura** e **simulação de estado**. A criação de pagamentos é responsabilidade do `CreateBookingUseCase` no módulo Bookings — cada booking cria um registro de pagamento no momento da inscrição. Os endpoints de simulação (`confirm`/`fail`) foram adicionados em 29 Abr 2026 para tornar o fluxo de pagamento demonstrável ponta a ponta sem gateway externo.

**Entity `PaymentEntity`:**
- `id`: UUID gerado via `crypto.randomUUID()` no domínio
- `status`: `PaymentStatus` enum — `PENDING | COMPLETED | FAILED`; status inicial sempre `PENDING`
- `amount`: `Money` value object
- `method`: `MethodPayment` enum — `MONEY | PIX | CREDIT_CARD | DEBIT_CARD`
- `organizationId`, `bookingId`: referências para isolamento de tenant e rastreabilidade
- Métodos de mutação *(adicionados 29 Abr)*: `confirm()` — transita para `COMPLETED`; `fail()` — transita para `FAILED`; ambos atualizam `updatedAt`

**Use Cases (4 — 2 leitura + 2 simulação):**
| Use Case | Descrição |
|----------|-----------|
| `FindPaymentByIdUseCase` | Busca pagamento por ID, valida pertencimento à org |
| `FindPaymentsByOrganizationUseCase` | Listagem paginada dos pagamentos da organização |
| `ConfirmPaymentUseCase` *(29 Abr)* | Transita `PENDING → COMPLETED`; rejeita pagamentos já processados |
| `FailPaymentUseCase` *(29 Abr)* | Transita `PENDING → FAILED`; rejeita pagamentos já processados |

**Repository:** `PaymentRepository` agora inclui método abstrato `update(payment)` *(adicionado 29 Abr)*; implementado em `PrismaPaymentRepository` via `prisma.payment.update`.

**Domain Errors:**
| Error | Código | HTTP |
|-------|--------|------|
| `PaymentNotFoundError` | `PAYMENT_NOT_FOUND` | 404 |
| `PaymentCreationFailedError` | `PAYMENT_CREATION_FAILED_BAD_REQUEST` | 400 |
| `PaymentAlreadyProcessedError` *(29 Abr)* | `PAYMENT_ALREADY_PROCESSED_BAD_REQUEST` | 400 |

**Endpoints REST (`/organizations/:organizationId/payments`):**
| Método | Rota | Auth | O que faz |
|--------|------|------|-----------|
| `GET` | `/organizations/:organizationId/payments/:id` | JWT + ADMIN + TenantFilterGuard | Busca pagamento por ID |
| `GET` | `/organizations/:organizationId/payments` | JWT + ADMIN + TenantFilterGuard | Lista pagamentos da org (paginado) |
| `PATCH` | `/organizations/:organizationId/payments/:id/confirm` | JWT + ADMIN + TenantFilterGuard | Simula confirmação (`PENDING → COMPLETED`) |
| `PATCH` | `/organizations/:organizationId/payments/:id/fail` | JWT + ADMIN + TenantFilterGuard | Simula falha (`PENDING → FAILED`) |

`PaymentModule` exporta `PaymentRepository` — injetável em `BookingsModule`.

**Compilação:** ✅ `npx tsc --noEmit` = 0 erros

---

### Subscriptions Module ✅ COMPLETO + LAZY EXPIRY (26–29 Abr 2026)

O módulo de assinaturas gerencia a relação entre organizações e planos. Cada organização pode ter apenas uma assinatura ativa por vez. A duração é definida pelo campo `durationDays` do plano (padrão 30 dias). Em 29 Abr 2026, expiração lazy e enforcement de limites de plano foram adicionados.

**Entity `SubscriptionEntity`:**
- `id`: UUID gerado via `crypto.randomUUID()` no domínio
- `status`: `SubscriptionStatus` enum — `ACTIVE | PAST_DUE | CANCELED`; status inicial sempre `ACTIVE` *(`PAST_DUE` adicionado 29 Abr)*
- `startDate`, `expiresAt`: calculado pelo `SubscribeToPlanUseCase` (`startDate + plan.durationDays`)
- Métodos: `cancel()` — transita para `CANCELED`; `expire()` — transita para `PAST_DUE`, atualiza `updatedAt` *(adicionado 29 Abr)*
- Getter: `isExpired` — retorna `true` se `expiresAt < new Date()` *(adicionado 29 Abr)*
- `planId`, `organizationId`: vínculos do contrato

**Constante de domínio:** ~~`SUBSCRIPTION_DURATION_DAYS = 30` (definida em `SubscribeToPlanUseCase`)~~ *(removida 27 Abr 2026 — ver seção 6.8)*

**Expiração Lazy (29 Abr 2026):** O helper `resolveActiveSubscription(orgId, repo)` (`src/modules/subscriptions/application/utils/`) centraliza a lógica de busca + verificação de expiração + transição para `PAST_DUE` + persistência. Se a subscription estiver vencida, ela é expirada on-demand e `null` é retornado — sem cron job. Usado por `FindActiveSubscriptionUseCase` e `PlanLimitService`.

**Regras de negócio:**
1. O plano referenciado deve existir e estar com `isActive = true`
2. A organização não pode ter outra assinatura `ACTIVE` no momento da criação (`SubscriptionAlreadyActiveError`)
3. Apenas membros com role `ADMIN` da organização podem criar/cancelar assinaturas
4. Isolamento de tenant via `TenantFilterGuard` — `organizationId` do route param validado contra o JWT
5. Subscriptions `ACTIVE` com `expiresAt` no passado são transicionadas para `PAST_DUE` no momento da leitura *(adicionado 29 Abr)*

**Use Cases (4):**
| Use Case | Descrição |
|----------|-----------|
| `SubscribeToPlanUseCase` | Valida plano ativo + ausência de ACTIVE subscription → cria com `plan.durationDays` dias |
| `CancelSubscriptionUseCase` | Busca subscription por ID, chama `subscription.cancel()`, persiste |
| `FindActiveSubscriptionUseCase` | Retorna assinatura ativa via `resolveActiveSubscription` (lazy expiry incluído) |
| `FindSubscriptionsByOrganizationUseCase` | Histórico paginado de assinaturas da org |

**Serviços (1 — adicionado 29 Abr):**
- `PlanLimitService` — centraliza verificação de limites de plano (vehicles, drivers, trips/mês). Ver seção 6.10.

**Domain Errors:**
| Error | Código | HTTP |
|-------|--------|------|
| `SubscriptionNotFoundError` | `SUBSCRIPTION_NOT_FOUND` | 404 |
| `SubscriptionAlreadyActiveError` | `SUBSCRIPTION_ALREADY_EXISTS` | 409 |
| `SubscriptionCreationFailedError` | `SUBSCRIPTION_CREATION_FAILED_BAD_REQUEST` | 400 |
| `SubscriptionForbiddenError` | `SUBSCRIPTION_ACCESS_FORBIDDEN` | 403 |
| `NoActiveSubscriptionError` *(29 Abr)* | `NO_ACTIVE_SUBSCRIPTION_FORBIDDEN` | 403 |
| `VehicleLimitExceededError` *(29 Abr)* | `VEHICLE_PLAN_LIMIT_FORBIDDEN` | 403 |
| `DriverLimitExceededError` *(29 Abr)* | `DRIVER_PLAN_LIMIT_FORBIDDEN` | 403 |
| `MonthlyTripLimitExceededError` *(29 Abr)* | `MONTHLY_TRIP_PLAN_LIMIT_FORBIDDEN` | 403 |

**Endpoints REST (`/organizations/:organizationId/subscriptions`):**
| Método | Rota | Auth | O que faz |
|--------|------|------|-----------|
| `POST` | `/organizations/:organizationId/subscriptions` | JWT + ADMIN + TenantFilterGuard | Inscreve org em um plano |
| `PATCH` | `/organizations/:organizationId/subscriptions/:id/cancel` | JWT + ADMIN + TenantFilterGuard | Cancela assinatura ativa |
| `GET` | `/organizations/:organizationId/subscriptions/active` | JWT + ADMIN + TenantFilterGuard | Retorna assinatura ativa (com lazy expiry) |
| `GET` | `/organizations/:organizationId/subscriptions` | JWT + ADMIN + TenantFilterGuard | Histórico paginado |

`SubscriptionsModule` exporta `SubscriptionRepository`, `SubscribeToPlanUseCase` e `PlanLimitService`. `SubscriptionsModule` importa `PlansModule` para injetar `PlanRepository`.

**Compilação:** ✅ `npx tsc --noEmit` = 0 erros

---

## 6.8 Implementações (27 Abr 2026)

### durationDays no Plan — Remoção de Constante de Domínio Hardcoded

O `SubscribeToPlanUseCase` possuía a constante `SUBSCRIPTION_DURATION_DAYS = 30` hardcoded no use case. Isso violava DDD: a duração de um plano é uma propriedade **do plano em si**, não do caso de uso.

**Alterações:**
- Schema Prisma: `durationDays Int @default(30)` adicionado ao model `Plan`
- Migration `20260427182603_add_plan_duration_days` aplicada + `prisma generate` executado
- `PlanEntity`: `durationDays: number` adicionado ao estado, construtor, getter, `create()`, `restore()`, `update()`
- `PlanMapper`: `toDomain()` e `toPersistence()` mapeiam o campo
- `CreatePlanDto` / `PlanResponseDto`: campo `durationDays` adicionado com validação `@IsInt() @IsPositive()`
- `PlanPresenter.toHTTP()`: inclui `durationDays`
- `SubscribeToPlanUseCase`: constante removida → `expiresAt.setDate(expiresAt.getDate() + plan.durationDays)`

---

### UnitOfWork + DbContext — Transações com AsyncLocalStorage (sem vazamento)

#### Objetivo

Permitir que um use case execute múltiplas escritas **atomicamente** (ex: criar `Booking` + `PaymentEntity`) sem que a camada de aplicação precise conhecer Prisma (`prisma.$transaction`) e sem alterar assinaturas dos repositórios.

#### Componentes

| Componente | Camada | Papel |
|-----------|--------|-------|
| `UnitOfWork` | Shared Domain (interface) | Expõe `execute(fn)` para rodar um bloco dentro de uma transação |
| `PrismaUnitOfWork` | Shared Infra | Implementa `UnitOfWork` usando `prisma.$transaction(...)` |
| `DbContext` | Shared Infra | Guarda o cliente Prisma ativo via `AsyncLocalStorage` e expõe `dbContext.client` |

#### Como a transação funciona (simples)

```
UseCase
  └─ unitOfWork.execute(async () => {
       await bookingRepository.save(booking)
       await paymentRepository.save(payment)
     })
         ↓
PrismaUnitOfWork
  └─ prisma.$transaction((tx) =>
       dbContext.run(tx, fn))         ← coloca o tx no AsyncLocalStorage
           ↓
DbContext (AsyncLocalStorage)
  └─ client = tx durante a execução do callback
           ↓
Repository
  └─ usa dbContext.client.<model>...  ← usa tx automaticamente
           ↓
Prisma (PostgreSQL)
```

Na prática: fora de transação, `dbContext.client` aponta para o `PrismaService` (cliente raiz). Dentro da transação, aponta para o `tx` criado pelo Prisma.

#### Fluxo completo

`UseCase → UnitOfWork → DbContext → Repository → Prisma`

#### Por que repositórios NÃO iniciam transações

1. **A fronteira transacional é do caso de uso**: é o use case que sabe quais operações precisam ser atômicas (ex: salvar em 2 tabelas).
2. **Evita transações parciais**: se cada repositório abrisse sua própria transação, não haveria garantia de atomicidade entre repositórios diferentes.
3. **Mantém interfaces simples**: repositórios não precisam receber “tx” como parâmetro e não mudam assinaturas.
4. **Infra fica na infra**: repositórios só executam queries; o controle de transação fica centralizado e previsível.

#### Isolamento e retry automático

`PrismaUnitOfWork` abre transações com nível de isolamento **Serializable** e faz até 3 tentativas automáticas em caso de conflito. Isso é necessário porque PostgreSQL com Serializable pode abortar transações concorrentes que conflitam (erro P2034), em vez de bloquear. O retry torna a experiência transparente para o use case.

```typescript
// PrismaUnitOfWork (simplificado)
async execute<T>(fn: () => Promise<T>): Promise<T> {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      return await this.prisma.$transaction(
        (tx) => this.db.run(tx, fn),
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (error) {
      if (attempt < 3 && this.isRetryableTransactionError(error)) continue;
      throw error;
    }
  }
}
```

#### Tratamento de erros do Prisma

| Código Prisma | Causa | Tratamento |
|---------------|-------|-----------|
| **P2002** | Violação de unique constraint (ex: placa duplicada, email duplicado) | Cada repositório captura e relança como erro de domínio específico (ex: `PlateAlreadyInUseError`, `UserEmailAlreadyExistsError`). O `AllExceptionsFilter` converte para HTTP 409 Conflict. |
| **P2034** | Conflito de transação serializable (write-write conflict) | `PrismaUnitOfWork` detecta o erro e reexecuta o callback automaticamente (até 3 tentativas). Se persistir, propaga o erro. |

#### Onde transações são usadas

| Use Case | Módulo | O que é atomizado |
|----------|--------|-------------------|
| `CreateBookingUseCase` | Bookings | `booking.save()` + `payment.save()` — inscrição + pagamento atomicamente |
| `RegisterOrganizationWithAdminUseCase` | Auth | `user.save()` + `organization.save()` + `membership.save()` — onboarding completo |
| `SetupOrganizationForExistingUserUseCase` | Auth | `organization.save()` + `membership.save()` — setup para usuário existente |
| `SubscribeToPlanUseCase` | Subscriptions | `findActive()` + `subscription.save()` — garante 1 ACTIVE por org (race condition) |
| `TransitionTripInstanceStatusUseCase` | Trip | `findById()` + `update()` — protege máquina de estados contra lost update concorrente |
| `CreateTripInstanceUseCase` | Trip | re-valida `template.isActive()` + `instance.save()` dentro do mesmo contexto serializable |

#### Observação (compatibilidade)

O token `TransactionManager` pode existir como compat/alias para `UnitOfWork`, mas o padrão recomendado é usar `UnitOfWork.execute(...)`.

**Compilação:** ✅ `npx tsc --noEmit` = 0 erros. Testes: 37 suites, 278 testes.

---

---

## 6.9 Implementações (28 Abr 2026)

### Análise de Concorrência e Correções — Todos os Módulos (28 Abr 2026)

Foi realizada uma análise completa de race conditions e lost updates em todos os módulos. Auth e Subscriptions já estavam protegidos desde 27 Abr. As correções de código foram necessárias apenas no módulo Trip.

#### Auth Module — Já Protegido

- `RegisterOrganizationWithAdminUseCase`: `user + org + membership` dentro de `TransactionManager.runInTransaction`. Rollback total se qualquer etapa falhar. Sem alteração.
- `SetupOrganizationForExistingUserUseCase`: `org + membership` dentro de `TransactionManager.runInTransaction`. Sem alteração.

#### Membership Module — Sem Necessidade de Transação

`CreateMembershipUseCase` e demais use cases realizam escritas únicas em uma tabela — sem risco de inconsistência entre múltiplas escritas. Sem alteração.

#### Subscriptions Module — Já Protegido

`SubscribeToPlanUseCase`: `findActive() + save()` dentro de `TransactionManager.runInTransaction` com isolamento Serializable — impede que duas requisições simultâneas criem duas assinaturas `ACTIVE` para a mesma organização. Sem alteração.

#### Trip Module — Correções Aplicadas

**`TransitionTripInstanceStatusUseCase` — Lost Update na Máquina de Estados**

**Problema:** Dois requests simultâneos (ex: dois admins) poderiam ambos ler `status = DRAFT`, ambos validar a transição para `SCHEDULED` com sucesso, e gravar resultados conflitantes — violando a máquina de estados silenciosamente.

**Solução:** Todo o corpo do `execute()` foi envolto em `this.unitOfWork.execute(async () => { ... })`. Com isolamento Serializable, apenas um dos dois commits concorrentes é aceito; o outro recebe `P2034` e é retentado com o estado atual — já com a transição do primeiro aplicada.

```typescript
async execute(id, input, organizationId): Promise<TripInstance> {
  return this.unitOfWork.execute(async () => {
    const instance = await this.tripInstanceRepository.findById(id);
    if (!instance) throw new TripInstanceNotFoundError(id);
    if (instance.organizationId !== organizationId)
      throw new TripInstanceAccessForbiddenError(id);
    instance.transitionTo(input.newStatus);
    const updated = await this.tripInstanceRepository.update(instance);
    if (!updated) throw new TripInstanceNotFoundError(id);
    return updated;
  });
}
```

**`CreateTripInstanceUseCase` — Race Condition com DeactivateTripTemplate**

**Problema:** Um `DeactivateTripTemplate` concorrente poderia commitar entre o `findById(template)` externo e o `save(instance)`, resultando em uma `TripInstance` criada a partir de um template inativo.

**Solução:** Validações de fast-fail (template não encontrado, org errada, template inativo) são mantidas **fora** da transação para não desperdiçar locks em falhas óbvias. Dentro da transação, o template é re-lido e `isActive()` é revalidado sob isolamento Serializable, fechando a janela de race condition.

```typescript
async execute(input, organizationId): Promise<TripInstance> {
  // Fast-fail fora da transação (sem lock desperdiçado)
  const template = await this.tripTemplateRepository.findById(input.tripTemplateId);
  if (!template) throw new TripTemplateNotFoundError(input.tripTemplateId);
  if (template.organizationId !== organizationId)
    throw new TripTemplateAccessForbiddenError(input.tripTemplateId);
  if (!template.isActive()) throw new TripTemplateInactiveError(input.tripTemplateId);

  return this.unitOfWork.execute(async () => {
    // Re-leitura dentro da transação — fecha a janela de race condition
    const freshTemplate = await this.tripTemplateRepository.findById(input.tripTemplateId);
    if (!freshTemplate) throw new TripTemplateNotFoundError(input.tripTemplateId);
    if (!freshTemplate.isActive()) throw new TripTemplateInactiveError(input.tripTemplateId);
    // ... build instance a partir do freshTemplate, então save
    return this.tripInstanceRepository.save(instance);
  });
}
```

**`AssignDriverToTripInstance` / `AssignVehicleToTripInstance` — Sem Alteração**

FK constraints com `onDelete: Restrict` já existem no schema Prisma para `driverId` e `vehicleId` na tabela `TripInstance`. Integridade referencial garantida a nível de banco.

**Testes atualizados:**
- `transition-trip-instance-status.use-case.spec.ts` — `UnitOfWork` mock adicionado (transparente: `execute` chama o callback diretamente)
- `create-trip-instance.use-case.spec.ts` — `UnitOfWork` mock adicionado; `tripTemplateRepository.findById` chamado duas vezes (uma fora, uma dentro do `execute`)
- **15/15 testes passando** após as mudanças

---

---

## 6.10 Implementações (29 Abr 2026)

### Mitigação de Defeitos Críticos — Fase 3.7

Três defeitos que tornavam o sistema não-demonstrável ponta a ponta foram corrigidos sem introduzir complexidade desnecessária (sem cron jobs, sem gateway de pagamento real).

---

#### Payment Simulation ✅ (29 Abr 2026)

**Problema:** Todo booking criava um `Payment` com `status: PENDING` que nunca mudava. O fluxo de demonstração terminava sempre com "pagamento pendente".

**Solução:** Dois endpoints `PATCH` de simulação adicionados ao `PaymentController`. Nenhum gateway externo envolvido — apenas transição de status com guard de duplo processamento.

**Novos componentes:**
- `PaymentEntity.confirm()` e `.fail()` — mutam status e atualizam `updatedAt`
- `PaymentAlreadyProcessedError` (`code: PAYMENT_ALREADY_PROCESSED_BAD_REQUEST` → HTTP 400) — impede reprocessamento
- `PaymentRepository.update(payment)` — método abstrato + implementação Prisma via `prisma.payment.update`
- `ConfirmPaymentUseCase` — valida tenant ownership + guard PENDING → chama `payment.confirm()`
- `FailPaymentUseCase` — mesma lógica com `payment.fail()`
- Endpoints `PATCH /organizations/:organizationId/payments/:id/confirm` e `.../fail` (ADMIN + TenantFilter)

---

#### Subscription Lazy Expiration ✅ (29 Abr 2026)

**Problema:** `expiresAt` existia no banco, mas `status` nunca saía de `ACTIVE` para `PAST_DUE`. Organizações com assinatura vencida apareciam como ativas indefinidamente.

**Solução:** Expiração on-demand — verificação ocorre no momento da consulta, sem cron job. Pattern: lê, checa, expira, salva, retorna `null`.

**Novos componentes:**
- `SubscriptionEntity.expire()` — transita para `PAST_DUE`, atualiza `updatedAt`
- `SubscriptionEntity.isExpired` getter — retorna `expiresAt < new Date()`
- `SubscriptionStatus.PAST_DUE` — novo valor no enum
- `resolveActiveSubscription(orgId, repo)` (`src/modules/subscriptions/application/utils/`) — helper que encapsula busca + checagem de expiração + save + retorno; retorna `null` se não há subscription ativa ou se ela expirou
- `FindActiveSubscriptionUseCase` — refatorado para delegar ao helper (lazy expiry automático na leitura)
- `SubscriptionMapper` — `PAST_DUE` resulta em `activeKey = null` (constraint de unicidade respeitada)

---

#### Plan Limits Enforcement ✅ (29 Abr 2026)

**Problema:** `maxVehicles`, `maxDrivers`, `maxMonthlyTrips` existiam no `Plan` mas nenhum use case de criação verificava esses limites.

**Solução:** `PlanLimitService` centralizado em `SubscriptionsModule`. Módulos que precisam de limite injetam o serviço via DI.

**`PlanLimitService`** (`src/modules/subscriptions/application/services/plan-limit.service.ts`):
- Injeta `SubscriptionRepository` + `PlanRepository`
- `assertVehicleLimit(orgId, count)` — lança `VehicleLimitExceededError` se `count >= plan.maxVehicles`
- `assertDriverLimit(orgId, count)` — lança `DriverLimitExceededError` se `count >= plan.maxDrivers`
- `assertMonthlyTripLimit(orgId, count)` — lança `MonthlyTripLimitExceededError` se `count >= plan.maxMonthlyTrips`
- Privado `getActivePlan()` — usa `resolveActiveSubscription` (lazy expiry) → lança `NoActiveSubscriptionError` se sem assinatura ativa

**Novos métodos de contagem nos repositórios:**
- `VehicleRepository.countActiveByOrganizationId(orgId)` — conta veículos com `status: ACTIVE`
- `DriverRepository.countActiveByOrganizationId(orgId)` — conta via JOIN: `driverStatus: ACTIVE` + membership DRIVER ativa
- `TripInstanceRepository.countByOrganizationAndMonth(orgId, start, end)` — conta instâncias criadas no mês calendário atual

**Use cases atualizados:**
- `CreateVehicleUseCase`: `countActiveByOrganizationId` → `assertVehicleLimit` antes de `save()`
- `CreateDriverUseCase`: parâmetro `organizationId?` adicionado; `countActiveByOrganizationId` → `assertDriverLimit` (pulado para usuários B2C)
- `CreateTripInstanceUseCase`: `countByOrganizationAndMonth` (fora da tx) → `assertMonthlyTripLimit` antes do `UnitOfWork`

**Módulos atualizados:** `VehicleModule`, `DriverModule`, `TripModule` agora importam `SubscriptionsModule`. `SubscriptionsModule` exporta `PlanLimitService`.

---

#### Auto-FREE Subscription no Registro ✅ (29 Abr 2026)

**Problema:** Organizações recém-criadas não tinham subscription, o que fazia o `PlanLimitService` lançar `NoActiveSubscriptionError` na primeira tentativa de criar veículo, driver ou viagem.

**Solução:** `RegisterOrganizationWithAdminUseCase` e `SetupOrganizationForExistingUserUseCase` auto-subscrevem ao plano FREE **após** a transação principal (fora do Serializable para evitar transação aninhada). Falha silenciosa: se o plano FREE não existir no banco, um `WARN` é logado e o fluxo continua normalmente — o admin pode assinar manualmente.

**Mudanças:**
- `RegisterOrganizationWithAdminUseCase` — injetado `SubscribeToPlanUseCase` + `PlanRepository`; auto-subscrição FREE pós-transação com `try/catch` não-fatal
- `SetupOrganizationForExistingUserUseCase` — injetado `SubscribeToPlanUseCase` + `PlanRepository`; auto-subscrição FREE pós-transação com `try/catch` não-fatal
- `AuthModule` — importa `SubscriptionsModule` e `PlansModule`
- `prisma/seed.ts` — atualizado para seedar **4 planos** via `upsert` (idempotente):

| Plano   | Preço      | Veículos | Drivers | Trips/mês | Público-alvo |
|---------|------------|----------|---------|-----------|--------------|
| FREE    | R$ 0,00    | 1        | 1       | 30        | Avaliação do sistema (não cobre 1 mês real) |
| BASIC   | R$ 199,90  | 3        | 3       | 200       | Microempresa (receita ~R$22k/mês) |
| PRO     | R$ 499,90  | 10       | 10      | 700       | Operadora média (receita ~R$75k/mês) |
| PREMIUM | R$ 999,90  | 100      | 100     | 9.999 *   | Frota grande (receita ~R$748k/mês) |

> \* `9999` é o sentinel para "ilimitado" — campo `maxMonthlyTrips` é `Int` não-nullable no schema Prisma.
> Precificação baseada na realidade do transporte escolar: 17 alunos × R$20/dia × 22 dias letivos = **R$7.480/mês por veículo**. O SaaS representa ~1% da receita gerada pelo cliente com o sistema.

> **Nota:** O `WARN "[RegisterOrg] FREE plan not found"` aparece nos testes unitários de `register-organization-with-admin.use-case.spec.ts` — o mock retorna `null` para `findByName`, ativando o branch de falha silenciosa. Comportamento correto e esperado.

**Specs de teste atualizados (4 arquivos — total: 37 suites, 280 testes):**
- `register-organization-with-admin.use-case.spec.ts` — mocks de `SubscribeToPlanUseCase` e `PlanRepository` adicionados
- `setup-organization-for-existing-user.use-case.spec.ts` — mocks de `SubscribeToPlanUseCase` e `PlanRepository` adicionados
- `create-driver.use-case.spec.ts` — mocks de `PlanLimitService` e `countActiveByOrganizationId` adicionados
- `create-trip-instance.use-case.spec.ts` — mocks de `PlanLimitService` e `countByOrganizationAndMonth` adicionados
- `create-vehicle.use-case.spec.ts` — mocks de `PlanLimitService` e `countActiveByOrganizationId` adicionados

**Compilação:** ✅ `npx tsc --noEmit` = 0 erros. **Testes:** 37 suites, 280 testes passando.

---

### Role Management & Database Seeding
- ✅ Criado **Role Repository** seguindo padrão de Clean Architecture.
- ✅ Desenvolvido **seed script** (`prisma/seed.ts`) com suporte a `tsx` para execução confiável.
- ✅ Configurado **Docker e docker-compose** para executar seed automaticamente na primeira inicialização.
- ✅ Refatorado componentes de **Shared Module** para padronizar exports de funcionalidades reutilizáveis.
- ✅ Adicionado suporte a **Value Objects** (Email, Telephone) com validações de domínio.
- ✅ Implementado **Validation Errors** para telefone e outros campos sensíveis.

### Estrutura do Seed
O script de seed foi configurado para:
1. Conectar ao banco de dados usando `PrismaPg` adapter.
2. Popular roles iniciais (ADMIN e DRIVER) usando `upsert` para idempotência.
3. Desconectar de forma segura após conclusão.
4. Ser chamado automaticamente no startup do container Docker.

## 7. Próximos Passos

1. ~~**Testes Unitários:** Implementar testes para os 3 use-cases críticos (LoginUseCase, CreateMembershipUseCase, RegisterOrganizationWithAdminUseCase).~~ ✅ **CONCLUÍDO (16 Abr)** — 5 suites, 27 testes passando (Login, RegisterOrg, SetupOrg, CreateMembership, CreateDriver).
2. ~~**Testes Unitários — Trip Module:**~~ ✅ **CONCLUÍDO (21 Abr)** — 11 suites, 90 testes (todos use cases de TripTemplate e TripInstance cobertos; `FindAllTripTemplatesByOrganizationUseCase` pendente).
3. **Testes Unitários (restantes):** Implementar specs para RegisterUseCase, RefreshTokenUseCase e CRUDs de Vehicle/Driver/Plans/Payment/Subscriptions com os novos cenários de `PlanLimitService`.
4. ~~**Módulo de Veículos:** Cadastro e gerenciamento de frotas com CRUD completo.~~ ✅ **CONCLUÍDO (17 Abr)** — CRUD completo + IDOR fix + VehicleInactiveError.
5. ~~**Módulo de Viagens (Templates e Instâncias):** Lógica para criação de viagens recorrentes e instâncias de execução (COMPLEXO).~~ ✅ **CONCLUÍDO (21 Abr)** — 12 endpoints REST, 12 use cases, status machine, FK violation fixes.
6. ~~**Módulo de Bookings**~~ ✅ **CONCLUÍDO (25 Abr)** — 9 use cases, 85 testes, preço server-side, controle de capacidade, org-only confirm, availability check, detalhe enriquecido.
7. ~~**Fase 3 (Monetização) — Plans, Payment, Subscriptions**~~ ✅ **CONCLUÍDO (26 Abr)** — Plans (5 use cases, DevGuard, PlanName enum), Payment (read-only API, criação via Bookings), Subscriptions (4 use cases, 30 dias, ADMIN-only).
8. ~~**Mitigação de Defeitos Críticos (Fase 3.7):** Payment simulation, Subscription lazy expiration, Plan limits enforcement, Auto-FREE subscription.~~ ✅ **CONCLUÍDO (29 Abr)** — 4 defeitos críticos corrigidos; sistema demonstrável ponta a ponta.
9. **CI/CD:** GitHub Actions para build + lint + testes automatizados.
10. **Testes Vehicle + Driver:** Implementar specs para os use cases de Vehicle e Driver (IDOR flows, plan limit paths).

## 8. Conclusão Parcial
O projeto Movy API demonstra uma base sólida e bem estruturada. Em 29 de abril de 2026, as **Fases 1, 2, 3 e 3.7 estão 100% completas** com 13 módulos implementados e o sistema demonstrável ponta a ponta:

- ✅ **User Module**: CRUD completo com autenticação JWT integrada.
- ✅ **Auth Module**: Sistema completo de autenticação com login, registro, refresh tokens JWT, endpoint de registro de organização com admin e endpoint de setup de organização para usuário existente *(atualizado 14 Abr)*. Auto-subscrição FREE ao criar organização *(29 Abr)*.
- ✅ **Organization Module**: CRUD completo com suporte a multi-tenancy, soft delete, decoupling total do Membership module e `GET /organizations/me` para ADMIN e DRIVER *(21 Abr)*.
- ✅ **Driver Module**: CRUD completo com value objects para CNH, error handling robusto, IDOR corrigido com `DriverAccessForbiddenError` + `belongsToOrganization()`, plan limit enforcement via `PlanLimitService` *(redesenhado 15 Abr, IDOR fix 17 Abr, limit 29 Abr)*.
- ✅ **Vehicle Module**: CRUD completo com `Plate` value object, 8 domain errors, 5 use cases, proteção IDOR via `organizationId`, soft delete seguro com `VehicleInactiveError`, plan limit enforcement via `PlanLimitService` *(17 Abr, limit 29 Abr)*.
- ✅ **Membership Module**: CRUD de associações com chave composta, soft delete, paginação, isolamento de tenant, validação de prerequisito Driver, e novo endpoint `GET /me/role/:organizationId` acessível por ADMIN e DRIVER *(21 Abr)*.
- ✅ **Trip Module**: TripTemplate + TripInstance completos — 12 endpoints REST, 12 use cases, status machine SCHEDULED→IN_PROGRESS→COMPLETED/CANCELLED, assign driver/vehicle com validação de FK antes de persistir, plan limit enforcement para `maxMonthlyTrips` via `PlanLimitService` *(21 Abr, limit 29 Abr)*.
- ✅ **Bookings Module**: Inscrições em viagens B2C, controle de acesso `hasOrgAccess || isOwner`, preço server-side, controle de capacidade (`countActiveByTripInstance`), confirmação de presença exclusiva para org members, filtro de status, verificação de disponibilidade (`GetBookingAvailabilityUseCase`), detalhe enriquecido (`FindBookingDetailsUseCase`), 9 use cases, 85 testes unitários *(25 Abr)*.
- ✅ **Plans Module**: 5 use cases (Create, Update, Deactivate, FindById, FindAll), `PlanName` enum (FREE/BASIC/PRO/PREMIUM), `Money` VO, writes protegidos por `DevGuard` + `@Dev()`, `PlanRepository` exportado para `SubscriptionsModule` *(26 Abr)*. Seed com 4 planos (FREE/BASIC/PRO/PREMIUM) *(29 Abr)*.
- ✅ **Payment Module**: 4 use cases (2 leitura + 2 simulação), `PaymentEntity` com `confirm()` e `fail()`, `PaymentAlreadyProcessedError`, `update()` no repositório, 4 endpoints REST (GET×2 + PATCH×2 — confirm/fail simulados) *(26 Abr + 29 Abr)*.
- ✅ **Subscriptions Module**: 4 use cases, assinatura única por org (ACTIVE), duração via `plan.durationDays`, `SubscriptionEntity` com `cancel()`, `expire()`, `isExpired`, `PAST_DUE` status, `resolveActiveSubscription` helper (lazy expiry sem cron), 4 novos domain errors de limit, `PlanLimitService` exportado, ADMIN-only via `TenantFilterGuard` *(26 Abr + 29 Abr)*.
- ✅ Sistema completo de **Role Management** com tipos ADMIN e DRIVER.
- ✅ **Database Seeding** automático na inicialização do Docker. Seed inclui 4 planos (FREE/BASIC/PRO/PREMIUM) e 2 roles (ADMIN/DRIVER).
- ✅ **Shared Module** padronizado para orquestração de componentes globais.
- ✅ **Value Objects** com validações de domínio (Cnpj, Email, Telephone, Address, OrganizationName, Slug, Cnh, CnhCategory, Plate, Money).
- ✅ **Validation Errors** para tratamento de erros específicos do domínio.
- ✅ **Global Exception Handling** com AllExceptionsFilter refatorado (mapeamento por padrão de código) *(atualizado 13 Abr)*.
- ✅ **RBAC Guards**: @Roles, RolesGuard, TenantFilterGuard, DevGuard implementados e aplicados.
- ✅ **JWT Strategy otimizada**: Sem query ao banco por request autenticado *(adicionado 13 Abr)*.
- ✅ **Desacoplamento modular**: Organization ↔ Membership zero coupling via padrão Orchestrator *(14 Abr)*.
- ✅ **Segurança IDOR**: Vehicle e Driver validam ownership em operações por ID; Membership protegido via TenantFilterGuard *(17 Abr)*.
- ✅ **Segurança FK**: Trip module valida existência de Driver e Vehicle antes de persistir atribuições, evitando HTTP 500 por FK violation *(21 Abr)*.
- ✅ **Transações atômicas (UnitOfWork + DbContext)**: `AsyncLocalStorage` propaga o cliente de transação sem alterar assinaturas dos repositórios; Serializable isolation + retry P2034 automático *(27 Abr)*.
- ✅ **Correções de concorrência no Trip Module**: `TransitionTripInstanceStatusUseCase` protegido contra lost update; `CreateTripInstanceUseCase` protegido contra race condition com `DeactivateTripTemplate` via re-leitura do template dentro da transação *(28 Abr)*.
- ✅ **Mitigação de defeitos críticos (Fase 3.7)**: Payment simulation (PENDING→COMPLETED/FAILED), Subscription lazy expiration (PAST_DUE on-demand), Plan Limits Enforcement (`PlanLimitService` + contagem nos repositórios), Auto-FREE subscription no registro *(29 Abr)*.
- ✅ **Testes Unitários**: 37 suites, 280 testes passando com padrão AAA, factories por módulo e injeção manual *(Trip module 21 Abr; Bookings 85 testes 25 Abr; Plans/Subscriptions 27 Abr; Guards 28 Abr; PlanLimitService mocks 29 Abr)*.

A escolha de tecnologias modernas aliada a uma arquitetura robusta (DDD/Clean Architecture) garante que o sistema possa escalar horizontalmente e suportar a complexidade de um ambiente SaaS multi-tenant.

**Progresso atual:** **Fases 1, 2, 3 e 3.7 — 100% COMPLETAS** (✅). 13 módulos implementados — User, Auth, Organization, Driver, Vehicle, Membership, RBAC, Trip, Bookings, Plans, Payment, Subscriptions, Shared. Sistema demonstrável ponta a ponta: registro de org → auto-FREE → criação de recursos (com limite por plano) → booking → pagamento simulado. Próximo: Fase 4 (Testes coverage 80%+, Swagger completo, Docker prod, deploy).

- ✅ **User Module**: CRUD completo com autenticação JWT integrada.
- ✅ **Auth Module**: Sistema completo de autenticação com login, registro, refresh tokens JWT, endpoint de registro de organização com admin e endpoint de setup de organização para usuário existente *(atualizado 14 Abr)*. Auto-subscrição FREE ao criar organização *(29 Abr)*.
- ✅ **Organization Module**: CRUD completo com suporte a multi-tenancy, soft delete, decoupling total do Membership module e `GET /organizations/me` para ADMIN e DRIVER *(21 Abr)*.
- ✅ **Driver Module**: CRUD completo com value objects para CNH, error handling robusto, IDOR corrigido com `DriverAccessForbiddenError` + `belongsToOrganization()`, plan limit enforcement via `PlanLimitService` *(redesenhado 15 Abr, IDOR fix 17 Abr, limit 29 Abr)*.
- ✅ **Vehicle Module**: CRUD completo com `Plate` value object, 8 domain errors, 5 use cases, proteção IDOR via `organizationId`, soft delete seguro com `VehicleInactiveError`, plan limit enforcement via `PlanLimitService` *(17 Abr, limit 29 Abr)*.
- ✅ **Membership Module**: CRUD de associações com chave composta, soft delete, paginação, isolamento de tenant, validação de prerequisito Driver, e novo endpoint `GET /me/role/:organizationId` acessível por ADMIN e DRIVER *(21 Abr)*.
- ✅ **Trip Module**: TripTemplate + TripInstance completos — 12 endpoints REST, 12 use cases, status machine SCHEDULED→IN_PROGRESS→COMPLETED/CANCELLED, assign driver/vehicle com validação de FK antes de persistir, plan limit enforcement para `maxMonthlyTrips` via `PlanLimitService` *(21 Abr, limit 29 Abr)*.
- ✅ **Bookings Module**: Inscrições em viagens B2C, controle de acesso `hasOrgAccess || isOwner`, preço server-side, controle de capacidade (`countActiveByTripInstance`), confirmação de presença exclusiva para org members, filtro de status, verificação de disponibilidade (`GetBookingAvailabilityUseCase`), detalhe enriquecido (`FindBookingDetailsUseCase`), 9 use cases, 85 testes unitários *(25 Abr)*.
- ✅ **Plans Module**: 5 use cases (Create, Update, Deactivate, FindById, FindAll), `PlanName` enum (FREE/BASIC/PRO/PREMIUM), `Money` VO, writes protegidos por `DevGuard` + `@Dev()`, `PlanRepository` exportado para `SubscriptionsModule` *(26 Abr)*. Seed com 4 planos (FREE/BASIC/PRO/PREMIUM) *(29 Abr)*.
- ✅ **Payment Module**: 4 use cases (2 leitura + 2 simulação), `PaymentEntity` com `confirm()` e `fail()`, `PaymentAlreadyProcessedError`, `update()` no repositório, 4 endpoints REST (GET×2 + PATCH×2 — confirm/fail simulados) *(26 Abr + 29 Abr)*.
- ✅ **Subscriptions Module**: 4 use cases, assinatura única por org (ACTIVE), duração via `plan.durationDays`, `SubscriptionEntity` com `cancel()`, `expire()`, `isExpired`, `PAST_DUE` status, `resolveActiveSubscription` helper (lazy expiry sem cron), 4 novos domain errors de limit, `PlanLimitService` exportado, ADMIN-only via `TenantFilterGuard` *(26 Abr + 29 Abr)*.
- ✅ Sistema completo de **Role Management** com tipos ADMIN e DRIVER.
- ✅ **Database Seeding** automático na inicialização do Docker. Seed inclui 4 planos (FREE/BASIC/PRO/PREMIUM) e 2 roles (ADMIN/DRIVER).
- ✅ **Shared Module** padronizado para orquestração de componentes globais.
- ✅ **Value Objects** com validações de domínio (Cnpj, Email, Telephone, Address, OrganizationName, Slug, Cnh, CnhCategory, Plate, Money).
- ✅ **Validation Errors** para tratamento de erros específicos do domínio.
- ✅ **Global Exception Handling** com AllExceptionsFilter refatorado (mapeamento por padrão de código) *(atualizado 13 Abr)*.
- ✅ **RBAC Guards**: @Roles, RolesGuard, TenantFilterGuard, DevGuard implementados e aplicados.
- ✅ **JWT Strategy otimizada**: Sem query ao banco por request autenticado *(adicionado 13 Abr)*.
- ✅ **Desacoplamento modular**: Organization ↔ Membership zero coupling via padrão Orchestrator *(14 Abr)*.
- ✅ **Segurança IDOR**: Vehicle e Driver validam ownership em operações por ID; Membership protegido via TenantFilterGuard *(17 Abr)*.
- ✅ **Segurança FK**: Trip module valida existência de Driver e Vehicle antes de persistir atribuições, evitando HTTP 500 por FK violation *(21 Abr)*.
- ✅ **Transações atômicas (UnitOfWork + DbContext)**: `AsyncLocalStorage` propaga o cliente de transação sem alterar assinaturas dos repositórios; Serializable isolation + retry P2034 automático *(27 Abr)*.
- ✅ **Correções de concorrência no Trip Module**: `TransitionTripInstanceStatusUseCase` protegido contra lost update; `CreateTripInstanceUseCase` protegido contra race condition com `DeactivateTripTemplate` via re-leitura do template dentro da transação *(28 Abr)*.
- ✅ **Mitigação de defeitos críticos (Fase 3.7)**: Payment simulation (PENDING→COMPLETED/FAILED), Subscription lazy expiration (PAST_DUE on-demand), Plan Limits Enforcement (`PlanLimitService` + contagem nos repositórios), Auto-FREE subscription no registro *(29 Abr)*.
- ✅ **Testes Unitários**: 37 suites, 280 testes passando com padrão AAA, factories por módulo e injeção manual *(Trip module 21 Abr; Bookings 85 testes 25 Abr; Plans/Subscriptions 27 Abr; Guards 28 Abr; PlanLimitService mocks 29 Abr)*.

A escolha de tecnologias modernas aliada a uma arquitetura robusta (DDD/Clean Architecture) garante que o sistema possa escalar horizontalmente e suportar a complexidade de um ambiente SaaS multi-tenant.

**Progresso atual:** **Fases 1, 2, 3 e 3.7 — 100% COMPLETAS** (✅). 13 módulos implementados — User, Auth, Organization, Driver, Vehicle, Membership, RBAC, Trip, Bookings, Plans, Payment, Subscriptions, Shared. Sistema demonstrável ponta a ponta: registro de org → auto-FREE → criação de recursos (com limite por plano) → booking → pagamento simulado. Próximo: Fase 4 (Testes coverage 80%+, Swagger completo, Docker prod, deploy).

---

## 9. Apêndice

### 9.1 Comandos Principais
- `npm install`: Instala as dependências do projeto.
- `docker-compose up`: Inicia o ambiente de desenvolvimento com Docker.
- `npx prisma generate`: Gera os clientes Prisma com base no esquema definido.
- `npm run start:dev`: Inicia o servidor em modo de desenvolvimento.
- `npx prisma migrate dev`: Aplica novas migrações ao banco de dados.
- `npx prisma studio`: Interface visual para gerenciamento de dados.
- `npm run build`: Compila o projeto com TypeScript (✅ sem erros)
- `npm run test`: Executa testes unitários (280 testes, 37 suites)
- `npm run test:cov`: Testes com relatório de cobertura

### 9.2 Variáveis de Ambiente Necessárias
```env
DATABASE_URL="postgresql://docker:docker07@postgres:5432/movy?schema=public"
PORT=5700
JWT_SECRET="your_jwt_secret_here"
```

### 9.3 Comandos de Seed
```bash
# Executar seed manualmente
npm run db:seed

# Com Docker (automático)
docker-compose up --build

# Verificar dados no banco
npx prisma studio
```

> O seed é idempotente (usa `upsert`). Popula 2 roles (ADMIN, DRIVER) e 4 planos (FREE, BASIC, PRO, PREMIUM). O plano FREE é necessário para o fluxo de auto-subscrição em `RegisterOrganizationWithAdminUseCase` e `SetupOrganizationForExistingUserUseCase`. Limites calibrados para 2 trips/dia por veículo (padrão transporte escolar/coletivo).

### 9.4 Script de Seed (`prisma/seed.ts`)
O script usa:
- `tsx` para execução TypeScript de forma confiável
- `@prisma/adapter-pg` para conexão com PostgreSQL
- `PrismaPg` adapter para melhor performance
- `upsert` para garantir idempotência nas inserts
