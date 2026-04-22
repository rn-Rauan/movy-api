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
4. `RegisterOrganizationWithAdminUseCase`: Orquestra criação de usuário + organização + membership ADMIN + login automático com compensação em 2 estágios (rollback de usuário em caso de falha na org ou membership) *(atualizado 14 Abr 2026)*.
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
O `CreateOrganizationUseCase` anteriormente importava `MembershipRepository` e `RoleRepository` para criar automaticamente a membership ADMIN. Isso violava o Princípio da Responsabilidade Única (SRP) e criava acoplamento circular entre módulos. A solução adotada foi o padrão **Orchestrator** no `RegisterOrganizationWithAdminUseCase` (módulo Auth), que coordena a sequência User → Org → Membership com mecanismo de compensação (rollback) em caso de falhas parciais. O `OrganizationModule` agora importa apenas o `SharedModule`, com zero dependência do `MembershipModule`.

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

**Suites de Teste (23 suites, 148 testes):**

| Use Case | Testes | Cenários Cobertos |
|----------|--------|--------------------|
| `LoginUseCase` | 5 | Happy path (tokens + user info), orquestração de chamadas, user not found, user inactive, senha incorreta |
| `RegisterOrganizationWithAdminUseCase` | 5 | Happy path, orquestração User→Org→Membership, compensação (org fail), compensação (membership fail), role not found |
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

**Factories Implementadas (15 total):**

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
└── shared/factories/ (role)
```

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
O `CreateOrganizationUseCase` violava o SRP ao importar `MembershipRepository` e `RoleRepository`. A responsabilidade de orquestração foi transferida para o `RegisterOrganizationWithAdminUseCase` (módulo Auth), que coordena a sequência User → Org → Membership com mecanismo de compensação (rollback de usuário em caso de falha na org ou membership). O `OrganizationModule` agora importa apenas o `SharedModule`.

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

## 6.1 Implementações Anteriores (05 Abr 2026)

### Role Management & Database Seeding
- ✅ Implementado sistema de **Role Entity** com tipos pré-definidos (ADMIN, DRIVER).
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
3. **Testes Unitários (restantes):** Implementar specs para RegisterUseCase, RefreshTokenUseCase e CRUDs de User/Organization/Vehicle/Driver.
3. ~~**Módulo de Veículos:** Cadastro e gerenciamento de frotas com CRUD completo.~~ ✅ **CONCLUÍDO (17 Abr)** — CRUD completo + IDOR fix + VehicleInactiveError.
4. ~~**Módulo de Viagens (Templates e Instâncias):** Lógica para criação de viagens recorrentes e instâncias de execução (COMPLEXO).~~ ✅ **CONCLUÍDO (21 Abr)** — 12 endpoints REST, 12 use cases, status machine, FK violation fixes.
5. **Módulo de Bookings:** Inscrições/reservas com validação de capacidade e conflitos.
6. **Integração de Pagamentos:** Mock de gateway de pagamento para o MVP.
7. **CI/CD:** GitHub Actions para build + lint + testes automatizados.
8. **Testes Vehicle + Driver:** Implementar specs para os use cases de Vehicle e Driver (IDOR flows).

## 8. Conclusão Parcial
O projeto Movy API demonstra uma base sólida e bem estruturada. Em 21 de abril de 2026, a **Fase 1 está 100% completa** e a **Fase 2 está em andamento avançado** com Vehicle e Trip modules completos:

- ✅ **User Module**: CRUD completo com autenticação JWT integrada.
- ✅ **Auth Module**: Sistema completo de autenticação com login, registro, refresh tokens JWT, endpoint de registro de organização com admin e endpoint de setup de organização para usuário existente *(atualizado 14 Abr)*.
- ✅ **Organization Module**: CRUD completo com suporte a multi-tenancy, soft delete, decoupling total do Membership module e `GET /organizations/me` para ADMIN e DRIVER *(21 Abr)*.
- ✅ **Driver Module**: CRUD completo com value objects para CNH, error handling robusto, IDOR corrigido com `DriverAccessForbiddenError` + `belongsToOrganization()` *(redesenhado 15 Abr, IDOR fix 17 Abr)*.
- ✅ **Vehicle Module**: CRUD completo com `Plate` value object, 8 domain errors, 5 use cases, proteção IDOR via `organizationId`, soft delete seguro com `VehicleInactiveError` *(17 Abr)*.
- ✅ **Membership Module**: CRUD de associações com chave composta, soft delete, paginação, isolamento de tenant, validação de prerequisito Driver, e novo endpoint `GET /me/role/:organizationId` acessível por ADMIN e DRIVER *(21 Abr)*.
- ✅ **Trip Module**: TripTemplate + TripInstance completos — 12 endpoints REST, 12 use cases, status machine SCHEDULED→IN_PROGRESS→COMPLETED/CANCELLED, assign driver/vehicle com validação de FK antes de persistir *(21 Abr)*.
- ✅ Sistema completo de **Role Management** com tipos ADMIN e DRIVER.
- ✅ **Database Seeding** automático na inicialização do Docker.
- ✅ **Shared Module** padronizado para orquestração de componentes globais.
- ✅ **Value Objects** com validações de domínio (Cnpj, Email, Telephone, Address, OrganizationName, Slug, Cnh, CnhCategory, Plate).
- ✅ **Validation Errors** para tratamento de erros específicos do domínio.
- ✅ **Global Exception Handling** com AllExceptionsFilter refatorado (mapeamento por padrão de código) *(atualizado 13 Abr)*.
- ✅ **RBAC Guards**: @Roles, RolesGuard, TenantFilterGuard, DevGuard implementados e aplicados.
- ✅ **JWT Strategy otimizada**: Sem query ao banco por request autenticado *(adicionado 13 Abr)*.
- ✅ **Desacoplamento modular**: Organization ↔ Membership zero coupling via padrão Orchestrator *(14 Abr)*.
- ✅ **Segurança IDOR**: Vehicle e Driver validam ownership em operações por ID; Membership protegido via TenantFilterGuard *(17 Abr)*.
- ✅ **Segurança FK**: Trip module valida existência de Driver e Vehicle antes de persistir atribuições, evitando HTTP 500 por FK violation *(21 Abr)*.
- ✅ **Testes Unitários**: 23 suites, 148 testes passando com padrão AAA, factories por módulo e injeção manual *(Trip module adicionado 21 Abr; Vehicle/User/Organization adicionados)*.

A escolha de tecnologias modernas aliada a uma arquitetura robusta (DDD/Clean Architecture) garante que o sistema possa escalar horizontalmente e suportar a complexidade de um ambiente SaaS multi-tenant.

**Progresso atual:** **Fase 1 100% COMPLETA** (✅). **Fase 2 em andamento** — Vehicle Module (17 Abr) e Trip Module (21 Abr) completos. Próximo: Bookings Module.

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
- `npm run test`: Executa testes unitários (148 testes, 23 suites)
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

### 9.4 Script de Seed (`prisma/seed.ts`)
O script usa:
- `tsx` para execução TypeScript de forma confiável
- `@prisma/adapter-pg` para conexão com PostgreSQL
- `PrismaPg` adapter para melhor performance
- `upsert` para garantir idempotência nas inserts