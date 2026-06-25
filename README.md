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
| Prisma ORM | v7 (`@prisma/adapter-pg`) | Acesso ao banco, migrações |
| PostgreSQL | 17 | Banco de dados relacional |
| JWT + Passport | — | Autenticação com payload enriquecido |
| Bcrypt | v6 | Hash de senhas (10 salt rounds) |
| @nestjs/throttler | v6 | Rate limiting global (60 req/min/IP) |
| @nestjs/schedule | v6 | Cron jobs (geração e auto-cancelamento de viagens) |
| @nestjs/swagger | v11 | Especificação OpenAPI em `/api` |
| Jest | v30 | Testes unitários |
| Docker | — | Ambiente de desenvolvimento |

---

## Módulos Implementados

13 módulos de domínio, todos seguindo a estrutura Clean Architecture + DDD por módulo.

| Módulo | Concern | Descrição |
|---|---|---|
| `auth` | Identidade | Login, registro, refresh token, verificação de email, reset de senha, setup de organização (JWT enriched payload) |
| `user` | Identidade | CRUD com soft delete (`status = INACTIVE`) e paginação |
| `organization` | Identidade | CRUD multi-tenant com value objects e slug |
| `membership` | Identidade | Associação usuário ↔ role ↔ organização, soft delete (`removedAt`), isolamento de tenant |
| `driver` | Frota | Perfil self-service, CNH com value objects, limite por plano |
| `vehicle` | Frota | Gestão de frota, placa única, limite por plano |
| `trip` | Viagens | Templates → instâncias de viagens recorrentes + 2 cron jobs |
| `scheduling` | Viagens | `TripSchedulingConfig` por organização que dirige a geração de instâncias |
| `bookings` | Viagens | Reservas de passageiros contra instâncias de viagem (controle de vagas) |
| `plans` | Billing | Catálogo de planos (FREE, etc.) com limites de recursos |
| `subscriptions` | Billing | Assinaturas, `PlanLimitService`, expiração lazy on-read |
| `payment` | Billing | Confirmação/falha de pagamentos (simulado) |
| `plan-usage` | Billing | Consulta de uso de recursos vs. limites do plano |

Infraestrutura transversal vive em [`src/shared/`](./src/shared) (`@Global`): guards (`JwtAuthGuard`, `RolesGuard`, `TenantFilterGuard`, `DevGuard`), exception filter global, value objects (`Email`, `Money`, `Telephone`), `PrismaService` e `BcryptHashProvider`.

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
  → RolesGuard        (valida @Roles() contra req.context.role; isDev faz bypass)
  → TenantFilterGuard (valida isolamento multi-tenant via :organizationId)
  → DevGuard          (valida @Dev() contra req.context.isDev)
  → Controller
```

Detalhes de arquitetura, decisões de design e segurança estão em [`docs/`](./docs) (ver seção [Documentação](#documentação)).

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
- Subir o banco PostgreSQL 17 (porta `5705`)
- Construir e iniciar a API NestJS (porta `5700`)
- Executar as migrations automaticamente (`prisma migrate deploy`)
- Popular o banco com o seed inicial (roles `ADMIN` e `DRIVER` + plano `FREE`)

A API estará disponível em **`http://localhost:5700`**.
Documentação Swagger em **`http://localhost:5700/api`**.

---

### Setup manual (desenvolvimento local)

#### Pré-requisitos

- Node.js v22 LTS
- Docker (para PostgreSQL)

#### Instalação

```bash
npm install
```

#### Variáveis de ambiente

Copie `.env.example` para `.env` e ajuste. As variáveis principais:

| Variável | Obrigatória | Notas |
|---|---|---|
| `DATABASE_URL` | ✅ | String de conexão PostgreSQL |
| `JWT_SECRET` | ✅ | Lança erro no boot se ausente |
| `PORT` | ❌ | Padrão 3001 |
| `JWT_EXPIRATION` | ❌ | Segundos; padrão 3600 (1h) |
| `JWT_REFRESH_EXPIRATION` | ❌ | Segundos; padrão 604800 (7d) |
| `ALLOWED_ORIGINS` | ❌ | Origens CORS permitidas (separadas por vírgula) |
| `DEV_EMAILS` | ❌ | Emails que ignoram checagens de org/role (`@Dev()`) |
| `DISABLE_CRON` | ❌ | `true` desliga os cron jobs (útil em dev/testes) |

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

# Um único arquivo de spec
npx jest --config test/jest-unit.json <caminho>

# E2E
npm run test:e2e
```

Cobertura atual: **458 testes unitários em 57 suites**, cobrindo os casos de uso de todos os módulos.

Padrão adotado: `makeMocks()` + `setupHappyPath()` + `sut` + AAA, com factories por módulo e injeção manual de dependências (zero mocks de framework — sem `Test.createTestingModule`).

---

## Outros comandos

```bash
npm run build           # Compila TypeScript (0 erros com strict: true)
npm run lint            # ESLint + Prettier fix
npx tsc --noEmit        # Verificação de tipos sem compilar
npx prisma studio       # GUI do banco de dados
```

---

## Documentação

A pasta [`docs/`](./docs) tem um índice que define a **fonte da verdade de cada assunto**:

- [`docs/README.md`](./docs/README.md) — **comece aqui**: índice da documentação
- [`docs/arquitetura/ARCHITECTURE.md`](./docs/arquitetura/ARCHITECTURE.md) — padrões arquiteturais (+ [`ARCHITECTURAL-DECISIONS.md`](./docs/arquitetura/ARCHITECTURAL-DECISIONS.md))
- [`docs/modelagem/DATA-MODEL.md`](./docs/modelagem/DATA-MODEL.md) — esquema e relacionamentos (fonte definitiva: `prisma/schema.prisma`)
- [`docs/arquitetura/SECURITY.md`](./docs/arquitetura/SECURITY.md) — IDOR, multi-tenant, composição de guards
- [`docs/api/ERROR-CATALOG.md`](./docs/api/ERROR-CATALOG.md) — códigos de erro de domínio → status HTTP
- [`docs/api/API.md`](./docs/api/API.md) — contrato da API consumido pelo cliente

---

## Licença

Proprietário (`UNLICENSED`). Todos os direitos reservados. Ver [`LICENSE`](./LICENSE).
