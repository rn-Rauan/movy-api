<p align="center">
  <img src="https://nestjs.com/img/logo-small.svg" width="80" alt="NestJS" />
</p>

<h1 align="center">Movy API</h1>

<p align="center">
  Backend de um SaaS multi-tenant para gerenciamento de transporte coletivo e viagens recorrentes.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/nestjs-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" alt="NestJS" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white" alt="Prisma" />
  <img src="https://img.shields.io/badge/postgresql-4169e1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
</p>

---

## Sobre

Movy API é uma plataforma backend SaaS voltada para organizações de transporte coletivo. Ela permite que empresas gerenciem motoristas, frotas, rotas recorrentes e passageiros de forma centralizada, com isolamento completo de dados entre tenants.

A arquitetura foi construída com **Clean Architecture + DDD Lite** por módulo, garantindo que as regras de negócio sejam independentes de frameworks e facilmente testáveis.

---

## Stack

| Tecnologia | Versão | Papel |
|---|---|---|
| NestJS | v11 | Framework principal |
| TypeScript | 5.7 (`strict: true`) | Linguagem |
| Prisma ORM | v7 | Acesso ao banco, migrações |
| PostgreSQL | 17 | Banco de dados relacional |
| JWT + Passport | — | Autenticação com payload enriquecido |
| Bcrypt | v6 | Hash de senhas |
| @nestjs/throttler | v6 | Rate limiting global (60 req/min) |
| Jest | v30 | Testes unitários |
| Docker | — | Ambiente de desenvolvimento |

---

## Módulos Implementados

| Módulo | Status | Descrição |
|---|---|---|
| `auth` | ✅ | Login, registro, refresh token, setup de organização, JWT enriched payload |
| `user` | ✅ | CRUD com soft delete e paginação |
| `organization` | ✅ | CRUD multi-tenant com value objects e slug |
| `membership` | ✅ | Associação usuário ↔ role ↔ organização, soft delete, isolamento de tenant |
| `driver` | ✅ | Perfil self-service, CNH com value objects, lookup por email+CNH |
| `rbac` | ✅ | Guards: `JwtAuthGuard`, `RolesGuard`, `TenantFilterGuard`, `DevGuard` |
| `shared` | ✅ | Exception filter global, interceptors, value objects, domain errors |
| `vehicle` | ⏳ | Gestão de frotas |
| `trip` | ⏳ | Templates e instâncias de viagens recorrentes |
| `booking` | ⏳ | Inscrições/reservas de passageiros |
| `payment` | ⏳ | Integração de pagamentos |

---

## Arquitetura

Cada módulo segue a estrutura:

```
src/modules/<module>/
├── application/
│   ├── dtos/           # DTOs de entrada/saída com class-validator
│   └── use-cases/      # Casos de uso (lógica de aplicação)
├── domain/
│   ├── entities/       # Entidades e value objects
│   ├── errors/         # Erros de domínio (mapeados para HTTP pelo AllExceptionsFilter)
│   └── interfaces/     # Interfaces de repositório
├── infrastructure/
│   └── db/
│       ├── mappers/    # Conversão domínio ↔ Prisma
│       └── repositories/
└── presentation/
    ├── controllers/
    └── mappers/        # Presenter (toHTTP)
```

**Pipeline de autenticação/autorização:**
```
Request
  → JwtAuthGuard      (valida JWT, popula req.context com userId, organizationId, role, isDev)
  → RolesGuard        (valida @Roles() contra req.context.role)
  → TenantFilterGuard (valida isolamento multi-tenant)
  → DevGuard          (valida @Dev() contra req.context.isDev)
  → Controller
```

---

## Setup

### Executando com Docker (recomendado)

> Pré-requisito: apenas [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado.

**1. Copie o arquivo de variáveis de ambiente:**

```bash
cp .env.example .env
```

> No Windows (cmd/PowerShell):
> ```powershell
> copy .env.example .env
> ```

**2. Suba a aplicação:**

```bash
# Primeira vez (ou após mudanças no código): usa --build para construir a imagem
docker-compose up --build

# Nas próximas vezes (imagem já construída):
docker-compose up
```

Isso irá:
- Subir o banco PostgreSQL 17
- Construir e iniciar a API NestJS
- Executar as migrations automaticamente (`prisma migrate deploy`)
- Popular o banco com o seed inicial (roles `ADMIN` e `DRIVER`)

A API estará disponível em **`http://localhost:5700`**.  
Documentação Swagger em **`http://localhost:5700/api`**.

---

### Setup manual (desenvolvimento local)

#### Pré-requisitos

- Node.js v18+
- Docker (para PostgreSQL)

#### Instalação

```bash
npm install
```

#### Variáveis de ambiente

```env
DATABASE_URL="postgresql://docker:docker07@localhost:5705/movy?schema=public"
PORT=3001
JWT_SECRET="your_jwt_secret_here"
DEV_EMAILS="dev@example.com"   # emails com acesso a endpoints @Dev()
```

#### Banco de dados com Docker

```bash
# Sobe apenas o banco PostgreSQL
docker-compose up postgres
```

#### Migrations e seed manual

```bash
npx prisma migrate dev
npm run db:seed
```

#### Servidor de desenvolvimento

```bash
npm run start:dev
```

A API estará disponível em `http://localhost:3001`. Documentação Swagger em `http://localhost:3001/api`.

---

## Testes

```bash
# Testes unitários (config dedicada com moduleNameMapper para aliases src/)
npx jest --config test/jest-unit.json

# Com watch
npx jest --config test/jest-unit.json --watch

# E2E
npm run test:e2e
```

Cobertura atual: **5 suites, 27 testes unitários** nos use cases críticos (`LoginUseCase`, `RegisterOrganizationWithAdminUseCase`, `SetupOrganizationForExistingUserUseCase`, `CreateMembershipUseCase`, `CreateDriverUseCase`).

Padrão adotado: `makeMocks()` + `setupHappyPath()` + `sut` + AAA, com factories por módulo e injeção manual de dependências.

---

## Outros comandos

```bash
npm run build           # Compila TypeScript (0 erros com strict: true)
npm run lint            # ESLint + Prettier fix
npx prisma studio       # GUI do banco de dados
npx tsc --noEmit        # Verificação de tipos sem compilar
```

---

## Documentação

A pasta [`docs/`](./docs/) contém:

- [`DOCUMENTACAO_TECNICA.md`](./docs/DOCUMENTACAO_TECNICA.md) — Arquitetura, decisões técnicas e módulos implementados
- [`ROADMAP.md`](./docs/ROADMAP.md) — Fases do projeto e progresso
- [`PROGRESS.md`](./docs/PROGRESS.md) — Checklist detalhado por módulo
- [`DATABASE.md`](./docs/DATABASE.md) — Schema e modelagem de dados
- [`AUTHORIZATION_GUIDE_UPDATED.md`](./docs/AUTHORIZATION_GUIDE_UPDATED.md) — Guia de RBAC e guards

---

## Licença

Proprietário. Todos os direitos reservados.
