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
O módulo de autenticação implementa um sistema completo de login, registro e refresh de tokens JWT, seguindo os princípios de Clean Architecture:

**Endpoints REST:**
- **`POST /auth/login`**: Autenticação de usuário com email e senha, retornando access token e refresh token.
- **`POST /auth/register`**: Registro de novo usuário com validação de dados e hashing de senha.
- **`POST /auth/refresh`**: Renovação de access token utilizando refresh token válido.

**Use Cases Implementados:**
1. `LoginUseCase`: Validação de credenciais, geração de tokens JWT e retorno de dados do usuário.
2. `RegisterUseCase`: Criação de novo usuário com validação de email único e hashing de senha.
3. `RefreshTokenUseCase`: Validação de refresh token e geração de novo par de tokens.

**Infraestrutura de Segurança:**
- **JWT Strategy**: Implementação customizada com Passport.js para validação de tokens.
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
- **`GET /organizations/:id`**: Busca de organização específica por ID com validação de existência.
- **`PUT /organizations/:id`**: Atualização de dados da organização (nome, email, telefone, endereço, slug).
- **`DELETE /organizations/:id`**: Desativação da organização via **soft delete** (altera status para `INACTIVE`).

**Use Cases Implementados:**
1. `CreateOrganizationUseCase`: Validação e criação com geração automática de slug.
2. `FindAllOrganizationsUseCase`: Listagem paginada de todas as organizações.
3. `FindAllActiveOrganizationsUseCase`: Listagem paginada apenas de organizações ativas.
4. `FindOrganizationByIdUseCase`: Busca com tratamento de não-encontrado.
5. `UpdateOrganizationUseCase`: Atualização com re-validação de dados.
6. `DisableOrganizationUseCase`: Soft delete com auditoria de timestamp.

**Value Objects e Entidades:**
- **`Cnpj`**: Value Object com validação de CNPJ (formato e dígitos verificadores).
- **`OrganizationName`**: Value Object com regras de tamanho e caracteres.
- **`Slug`**: Value Object para URL-friendly identifier gerado automaticamente.
- **`Address`**: Value Object para endereço da organização.
- **`Email` e `Telephone`**: Value Objects compartilhados com validação de domínio.
- **`Status`**: Type union `ACTIVE | INACTIVE` para rastreamento de estado.

**Camadas de Implementação:**
- **Domínio**: Entidade `Organization` com propriedades imutáveis e setters que validam através de Value Objects.
- **Aplicação**: DTOs (`CreateOrganizationDto`, `UpdateOrganizationDto`, `OrganizationResponseDto`) com validação via class-validator.
- **Infraestrutura**: `PrismaOrganizationRepository` implementando a interface `OrganizationRepository`.
- **Apresentação**: `OrganizationController` com JWT authentication guard global.

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
- **`GET /memberships/:userId/:roleId/:organizationId`**: Buscar por chave composta.
- **`PATCH /memberships/:userId/:roleId/:organizationId/restore`**: Restaurar associação.
- **`DELETE /memberships/:userId/:roleId/:organizationId`**: Remover (soft delete).

**Use Cases Implementados:**
1. `CreateMembershipUseCase`: Validação e criação com prevenção de duplicatas.
2. `FindMembershipByCompositeKeyUseCase`: Busca específica com erro 404.
3. `FindMembershipsByUserUseCase`: Listagem paginada por usuário.
4. `FindMembershipsByOrganizationUseCase`: Listagem paginada por organização.
5. `RemoveMembershipUseCase`: Soft delete via `removedAt`.
6. `RestoreMembershipUseCase`: Reversão de soft delete.

**Entidades e Value Objects:**
- **`Membership`**: Entidade com propriedades imutáveis e métodos `create()`, `remove()`, `restore()`.
- **Erros de Domínio**: `MembershipAlreadyExistsError`, `MembershipNotFoundError`.

**Camadas de Implementação:**
- **Domínio**: Entidade `Membership` com regras de negócio.
- **Aplicação**: DTOs (`CreateMembershipDto`, `MembershipResponseDto`) com validação.
- **Infraestrutura**: `PrismaMembershipRepository` implementando `MembershipRepository`.
- **Apresentação**: `MembershipController` com JWT guard e `MembershipPresenter`.

### 4.6 Infraestrutura de Desenvolvimento
- Configuração de ambiente com Docker e Docker Compose.
- Pipeline de migrações Prisma configurado.
- Sistema global de tratamento de exceções e logs.
- Seed automático integrado ao lifecycle de inicialização do Docker.
- Shared Module padronizado para expor componentes reutilizáveis.

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

## 6. Implementações Recentes (05 Abr 2026)

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

1. **RBAC - Role-Based Access Control:** Implementar guards customizados para restringir acesso de endpoints com base no role do usuário autenticado.
2. **Organização - Membros e Permissões:** Gestão de membros da organização com associação de roles específicos por membro.
3. **Módulo de Veículos:** Cadastro e gerenciamento de frotas com CRUD completo.
4. **Módulo de Motoristas:** Cadastro de motoristas com associação a veículos e rotas.
5. **Módulo de Viagens (Templates e Instâncias):** Lógica para criação de viagens recorrentes e instâncias de execução.
6. **Integração de Pagamentos:** Mock de gateway de pagamento para o MVP.

## 8. Conclusão Parcial
O projeto Movy API demonstra uma base sólida e bem estruturada. Em 05 de abril de 2026, foi implementado com sucesso:

- ✅ **User Module**: CRUD completo com autenticação JWT integrada.
- ✅ **Auth Module**: Sistema completo de autenticação com login, registro e refresh tokens JWT.
- ✅ **Organization Module**: CRUD completo com suporte a multi-tenancy e soft delete.
- ✅ Sistema completo de **Role Management** com tipos ADMIN e DRIVER.
- ✅ **Database Seeding** automático na inicialização do Docker.
- ✅ **Shared Module** padronizado para orquestração de componentes globais.
- ✅ **Value Objects** com validações de domínio (Cnpj, Email, Telephone, Address, OrganizationName, Slug).
- ✅ **Validation Errors** para tratamento de erros específicos do domínio.
- ✅ **Global Exception Handling** com AllExceptionsFilter para tradução de erros de domínio em respostas HTTP.

A escolha de tecnologias modernas aliada a uma arquitetura robusta (DDD/Clean Architecture) garante que o sistema possa escalar horizontalmente e suportar a complexidade de um ambiente SaaS multi-tenant. 

**Progresso atual:** **70% da Fase 1** (User ✅ + Organization ✅ + Roles ✅), com os próximos passos focados em:
1. Implementar RBAC Guards para proteção de endpoints por role.
2. Completar gestão de membros de organização com atribuição de roles.
3. Iniciar desenvolvimento dos módulos de core business (Vehicles, Drivers, Trips).

---

## 9. Apêndice

### 9.1 Comandos Principais
- `npm install`: Instala as dependências do projeto.
- `docker-compose up`: Inicia o ambiente de desenvolvimento com Docker.
- `npx prisma generate`: Gera os clientes Prisma com base no esquema definido.
- `npm run start:dev`: Inicia o servidor em modo de desenvolvimento.
- `npx prisma migrate dev`: Aplica novas migrações ao banco de dados.
- `npx prisma studio`: Interface visual para gerenciamento de dados.

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