# Onboarding — Movy API

> Setup local do zero até servidor rodando.

---

## Pré-requisitos

| Ferramenta | Versão mínima | Para quê |
|---|---|---|
| Node.js | 18+ | Runtime |
| npm | 9+ | Gerenciador de pacotes |
| Docker + Docker Compose | qualquer recente | PostgreSQL local |
| Git | qualquer | Clone do repo |

---

## 1. Clone e Instalação

```bash
git clone <repo-url>
cd movy-api
npm install
```

---

## 2. Variáveis de Ambiente

Crie um arquivo `.env` na raiz com:

```env
# Banco de dados
DATABASE_URL="postgresql://movy_user:movy_pass@localhost:5705/movy_db"

# JWT (obrigatório — o servidor não inicia sem isso)
JWT_SECRET="sua-chave-secreta-aqui-minimo-32-chars"

# Opcionais
PORT=3001
JWT_EXPIRATION=3600        # access token em segundos (padrão: 1h)
JWT_REFRESH_EXPIRATION=604800  # refresh token em segundos (padrão: 7d)
DEV_EMAILS=dev@local,admin@dev  # emails com bypass total de auth (só dev local)
```

> `JWT_SECRET` ausente → servidor lança exceção no startup e não sobe.

---

## 3. Subir o Banco de Dados

```bash
# Só o PostgreSQL (recomendado para dev)
docker-compose up postgres -d

# Stack completa (API na porta 5700 + DB na porta 5705)
docker-compose up --build
```

O PostgreSQL fica em `localhost:5705` com as credenciais do `docker-compose.yml`.

---

## 4. Migrations e Seed

```bash
# Aplicar migrations (cria as tabelas)
npx prisma migrate dev

# Seed obrigatório — cria os roles (ADMIN, DRIVER) e planos (FREE, BASIC, PRO, PREMIUM)
npm run db:seed
```

> O seed é necessário para que o fluxo `POST /auth/register-organization` funcione corretamente (auto-assinatura no plano FREE).

---

## 5. Rodar o Servidor

```bash
# Modo desenvolvimento com watch (recomendado)
npm run start:dev

# Modo debug + watch
npm run start:debug
```

O servidor sobe em `http://localhost:3001` (ou na `PORT` definida no `.env`).

**Swagger UI disponível em:** `http://localhost:3001/api`

---

## 6. Rodar Testes

```bash
# Testes unitários (use sempre este comando)
npx jest --config test/jest-unit.json

# Watch mode (para TDD)
npx jest --config test/jest-unit.json --watch

# Arquivo específico
npx jest --config test/jest-unit.json test/modules/auth/application/use-cases/login.use-case.spec.ts

# Testes E2E (requer banco rodando)
npm run test:e2e
```

> `npm test` (sem config) usa o jest padrão sem aliases — **não funciona** para testes unitários. Use sempre `jest-unit.json`.

---

## 7. Outros Comandos Úteis

```bash
# Type check sem compilar
npx tsc --noEmit

# Build de produção
npm run build

# Lint + Prettier fix
npm run lint

# Prettier apenas
npm run format

# Prisma Studio (GUI para o banco)
npx prisma studio

# Gerar tipos Prisma após mudar o schema
npx prisma generate
```

---

## 8. Fluxo de Primeira Execução

Sequência completa do zero:

```bash
# 1. Instalar deps
npm install

# 2. Criar .env com DATABASE_URL e JWT_SECRET

# 3. Subir banco
docker-compose up postgres -d

# 4. Criar tabelas
npx prisma migrate dev

# 5. Popular roles e planos
npm run db:seed

# 6. Subir servidor
npm run start:dev

# 7. Acessar Swagger
# http://localhost:3001/api

# 8. Testar: criar org com admin
# POST /auth/register-organization
```

---

## 9. Estrutura do Projeto

```
movy-api/
├── src/
│   ├── app.module.ts           # Módulo raiz — registra tudo
│   ├── main.ts                 # Bootstrap NestJS
│   ├── modules/                # Módulos de domínio
│   │   ├── auth/
│   │   ├── bookings/
│   │   ├── driver/
│   │   ├── membership/
│   │   ├── organization/
│   │   ├── plans/
│   │   ├── subscriptions/
│   │   ├── trip/
│   │   ├── user/
│   │   └── vehicle/
│   └── shared/                 # Infraestrutura global (@Global)
│       ├── guards/
│       ├── filters/
│       ├── interceptors/
│       ├── domain/
│       │   ├── errors/
│       │   └── value-objects/  # Email, Money, Telephone
│       └── shared.module.ts
├── prisma/
│   ├── schema.prisma           # Schema do banco
│   ├── seed.ts                 # Seed: roles + planos
│   └── migrations/             # Histórico de migrations
├── generated/
│   └── prisma/                 # Client Prisma gerado (não editar)
├── test/
│   ├── jest-unit.json          # Config Jest para testes unitários
│   ├── modules/                # Specs por módulo
│   └── shared/factories/       # Factories compartilhadas
├── docs/                       # Documentação do projeto
├── .env                        # Não commitado — criar localmente
├── docker-compose.yml
└── tsconfig.json
```

---

## 10. Dicas

- **Aliases de import**: o projeto usa `src/` como alias. Em vez de `../../../shared/...`, use `src/shared/...`. Configurado no `tsconfig.json` e no `test/jest-unit.json`.
- **Prisma gerado em `generated/prisma/`**: não é o path padrão do Prisma. O `tsconfig.json` tem alias `generated/` para isso.
- **`onDelete: Restrict` em viagens**: não é possível deletar drivers ou veículos com instâncias de viagem associadas — operação retorna erro do banco.
- **DEV_EMAILS**: lista de e-mails separados por vírgula que recebem `isDev: true` no JWT. Esses usuários têm bypass total de autenticação/autorização — **nunca use em produção**.
