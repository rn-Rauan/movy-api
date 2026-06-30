# Deploy do Movy API com Neon e Render

> Registro tecnico do processo de publicacao do backend do Movy API para testes
> online, usando PostgreSQL gerenciado no Neon e Web Service no Render.
>
> Data do registro: 2026-06-29.

## Objetivo

Publicar a API NestJS do Movy em um ambiente acessivel pela internet para testes
simples de fluxo, sem integrar pagamento real e sem alterar a arquitetura de
dominio do projeto.

O ambiente local original era composto por:

- `docker-compose.yml` subindo PostgreSQL 17 e API no mesmo ambiente local.
- `Dockerfile` responsavel por instalar dependencias, gerar Prisma Client e
  compilar a aplicacao.
- Prisma Migrate como fonte de verdade para o schema do banco.
- Seed inicial obrigatorio para roles e planos base.

O ambiente online ficou dividido em:

- Neon: PostgreSQL gerenciado.
- Render: Web Service publico executando a API NestJS.
- GitHub: fonte do deploy automatico do Render.

## Decisao de hospedagem

Foram avaliadas duas alternativas principais para o banco:

- Supabase: tambem fornece PostgreSQL, mas traz outros servicos acoplados, como
  Auth, APIs geradas e Storage.
- Neon: fornece PostgreSQL gerenciado de forma mais focada no banco.

Para este projeto, o Neon foi escolhido por manter o backend NestJS como unico
responsavel por autenticacao, autorizacao, regras de negocio e fronteiras de
tenant. Isso preserva melhor a proposta de Clean Architecture + DDD Lite do
Movy API.

Para a API, o Render foi escolhido em vez da Vercel porque o backend e uma
aplicacao NestJS tradicional, com servidor HTTP persistente, Prisma e cron jobs
internos via `@nestjs/schedule`. A Vercel e mais adequada para frontend e
functions serverless; neste caso, exigiria adaptacoes para um modelo diferente
de execucao.

No Render, o tipo correto e `Web Service`, pois a API precisa receber requisicoes
HTTP publicas de forma continua.

## Banco de dados no Neon

O banco foi criado no Neon como um PostgreSQL remoto. Depois da criacao, foram
obtidas duas strings de conexao:

```env
# Conexao direta, sem "-pooler": indicada para comandos Prisma CLI e migrations
DATABASE_URL="postgresql://USER:PASSWORD@ep-xxxxx.region.aws.neon.tech/neondb?sslmode=require"

# Conexao com pooler, com "-pooler" no host: indicada para a aplicacao em runtime
DATABASE_URL="postgresql://USER:PASSWORD@ep-xxxxx-pooler.region.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
```

No processo executado, a conexao direta foi usada para aplicar as migrations no
banco remoto, e a conexao com pooler passou a ser usada como `DATABASE_URL` da
API hospedada no Render.

### Aplicacao das migrations

Como o projeto ja possui migrations versionadas em `prisma/migrations`, o banco
online foi criado vazio e recebeu o historico completo via Prisma:

```powershell
$env:DATABASE_URL="postgresql://USER:PASSWORD@ep-xxxxx.region.aws.neon.tech/neondb?sslmode=require"
npx prisma migrate deploy
npm run db:seed
```

O comando `migrate deploy` aplica as migrations pendentes em ambientes de teste,
staging ou producao. O `db:seed` e necessario no Movy porque popula dados base
como roles (`ADMIN`, `DRIVER`) e planos, incluindo o plano `FREE`, usado no fluxo
de cadastro de organizacao.

### Verificacao

A verificacao foi feita conferindo que o banco Neon passou a conter:

- tabela `_prisma_migrations` com historico aplicado;
- tabelas de dominio do schema;
- dados base criados pelo seed.

Nao houve migracao de dados do banco Docker local para o Neon. Para o objetivo
de testes simples de fluxo, o banco online iniciou vazio e consistente com o
schema atual.

## API no Render

No Render foi criado um `Web Service` conectado ao repositorio GitHub do
`movy-api`.

O `docker-compose.yml` nao e utilizado pelo Render. Ele continua sendo apenas o
ambiente local, onde API e PostgreSQL sobem juntos. No deploy online, o banco e
externo, hospedado no Neon, e a API roda isolada no Render.

Arquitetura de execucao:

```text
Cliente HTTP / Frontend
        |
        v
Render Web Service
        |
        v
Movy API NestJS
        |
        v
Neon PostgreSQL
```

### Variaveis de ambiente do Render

As variaveis configuradas no Render seguem o mesmo contrato da aplicacao:

```env
DATABASE_URL="postgresql://USER:PASSWORD@ep-xxxxx-pooler.region.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
JWT_SECRET="valor-forte-e-secreto"
JWT_EXPIRATION="3600"
JWT_REFRESH_EXPIRATION="604800"
DEV_EMAILS="email-de-teste@example.com"
ALLOWED_ORIGINS="https://frontend.example.com,http://localhost:3000"
ENABLE_SWAGGER="false"
```

Observacoes:

- `DATABASE_URL` em runtime deve usar a URL pooled do Neon.
- `JWT_SECRET` nao deve ser versionado.
- `DEV_EMAILS` deve ser usado com cautela, pois concede bypass de algumas
  verificacoes de tenant/role para fluxos de desenvolvimento.
- `ALLOWED_ORIGINS` controla CORS para chamadas feitas por navegadores, mas nao
  deve ser tratado como mecanismo principal de seguranca.
- `ENABLE_SWAGGER=false` evita expor a documentacao OpenAPI publicamente.

O Render injeta uma variavel `PORT` para Web Services. A aplicacao escuta em
`process.env.PORT` e no host `0.0.0.0`, o que e necessario para receber trafego
externo dentro da plataforma.

## Ajustes feitos para producao

Durante o deploy foram encontrados comportamentos diferentes entre o ambiente
local com Docker Compose e o ambiente do Render. Os ajustes abaixo foram feitos
para tornar o startup previsivel em producao.

### Build gera Prisma Client

Como `generated/` nao e versionado, o Prisma Client precisa ser gerado durante
o build:

```json
"build": "prisma generate && nest build"
```

Isso garante que um ambiente limpo do Render consiga compilar a aplicacao sem
depender de arquivos gerados localmente.

### Start usa JavaScript compilado

O comando anterior `npm start` executava `nest start`, adequado para
desenvolvimento, mas pesado para runtime de producao e sujeito a estouro de
memoria em instancia pequena.

O startup de producao passou a usar o arquivo compilado:

```json
"start": "node dist/src/main.js",
"start:prod": "node dist/src/main.js"
```

O caminho correto e `dist/src/main.js` porque a configuracao atual do Nest/TS
emite o codigo compilado preservando `src/` dentro de `dist/`.

### Dockerfile alinhado com producao

O `Dockerfile` ficou responsavel por instalar dependencias, copiar codigo, rodar
o build e iniciar o runtime compilado:

```dockerfile
RUN npm run build

EXPOSE 3001

CMD [ "npm", "run", "start:prod" ]
```

O trecho abaixo permanece como placeholder de build:

```dockerfile
ARG DATABASE_URL=postgresql://placeholder:placeholder@localhost:5432/placeholder
ENV DATABASE_URL=$DATABASE_URL
```

Ele existe para que comandos de build que leem a configuracao do Prisma tenham
uma URL disponivel. Em runtime, a `DATABASE_URL` configurada no painel do Render
sobrescreve esse valor e aponta para o Neon.

## Problemas encontrados e solucoes

### Vulnerabilidades no `npm audit`

Durante a instalacao no Render, o npm informou vulnerabilidades. Nao foi usado
`npm audit fix` no deploy porque esse comando pode alterar lockfile e versoes
durante o build, tornando o deploy nao reprodutivel.

Tambem foi observado que algumas correcoes sugeridas exigiam `--force` e
introduziam breaking changes ou downgrades, por exemplo em dependencias ligadas
a Prisma/Nest. A decisao foi tratar atualizacoes de dependencias em uma tarefa
separada, com build e testes.

### Estouro de memoria com `nest start`

O primeiro deploy executou:

```bash
npm start
```

Como `npm start` apontava para `nest start`, o Render iniciou a aplicacao via
Nest CLI em vez do JavaScript compilado. Em instancia pequena, isso resultou em:

```text
JavaScript heap out of memory
```

Solucao: alterar `start` e `start:prod` para `node dist/src/main.js`.

### `Cannot find module '/movy-api/dist/main'`

Apos mudar para runtime compilado, o caminho inicial usado foi `dist/main`.
Porem, o build real gerava:

```text
dist/src/main.js
```

Solucao: atualizar os scripts para usar `node dist/src/main.js`.

### Swagger publico em `/api`

A rota `/api` exibia a documentacao Swagger publicamente. Embora isso nao seja
uma falha critica quando os endpoints protegidos exigem JWT e guards, expor a
documentacao inteira facilita a descoberta das rotas.

Solucao: registrar Swagger apenas quando:

```env
ENABLE_SWAGGER=true
```

Em producao publica, o valor recomendado e:

```env
ENABLE_SWAGGER=false
```

### Rota raiz com mensagem de desenvolvimento

A rota `GET /` retornava:

```text
Api Initialized
```

Isso foi substituido por uma resposta de health check discreta:

```json
{
  "status": "ok"
}
```

Assim a raiz continua util para verificar se o servico esta vivo, sem expor
mensagem de desenvolvimento.

## Seguranca operacional

As principais decisoes de seguranca no deploy foram:

- usar Neon apenas como banco PostgreSQL, mantendo regras de negocio no backend;
- usar a URL pooled do Neon no runtime da API;
- manter Swagger desativado em producao publica;
- configurar CORS por `ALLOWED_ORIGINS`, sem tratar CORS como barreira de
  seguranca contra clientes nao-browser;
- manter `JWT_SECRET` apenas em variaveis secretas do Render;
- preservar os guards existentes (`JwtAuthGuard`, `RolesGuard`,
  `TenantFilterGuard`, `DevGuard`) como mecanismo real de autorizacao;
- evitar `npm audit fix` automatico no deploy.

## Como testar a API online

Com o Swagger desligado, os testes devem ser feitos por:

- Postman;
- Insomnia;
- frontend autorizado via `ALLOWED_ORIGINS`;
- chamada direta com `curl`.

O Swagger pode ser ligado temporariamente para validacao manual:

```env
ENABLE_SWAGGER=true
```

Depois do teste, deve voltar para:

```env
ENABLE_SWAGGER=false
```

## Comandos de referencia

### Aplicar schema no Neon

```powershell
$env:DATABASE_URL="postgresql://USER:PASSWORD@ep-xxxxx.region.aws.neon.tech/neondb?sslmode=require"
npx prisma migrate deploy
npm run db:seed
```

### Build local equivalente ao Render

```bash
npm install
npm run build
npm run start:prod
```

### Docker local

```bash
docker-compose up --build
```

### Deploy no Render

1. Criar `New Web Service`.
2. Conectar o repositorio GitHub do backend.
3. Configurar variaveis de ambiente.
4. Usar `npm run build` como build.
5. Usar `npm run start:prod` ou `npm start` como start.
6. Conferir a rota raiz:

```http
GET https://movy-api-av8q.onrender.com/
```

Resposta esperada:

```json
{
  "status": "ok"
}
```

## Relacao com o ambiente local

O deploy online nao substitui o ambiente Docker local. Os dois passam a coexistir:

- local: `docker-compose.yml` sobe Postgres + API para desenvolvimento;
- online: Render sobe apenas a API, conectada ao banco Neon.

Isso permite testar fluxos reais pela internet sem perder a previsibilidade do
ambiente local.

## Pontos de evolucao

Melhorias possiveis para proximas iteracoes:

- criar pipeline CI/CD que rode `npx prisma migrate deploy` automaticamente
  quando houver alteracao em `prisma/migrations`;
- usar uma variavel especifica para migrations, como `DIRECT_URL`, mantendo
  `DATABASE_URL` sempre pooled em runtime;
- proteger Swagger com autenticacao em vez de apenas habilitar/desabilitar;
- criar ambiente separado de staging;
- revisar vulnerabilidades do `npm audit` em tarefa propria, com testes e sem
  `--force` automatico.

## Referencias externas

- Neon Prisma guide: https://neon.com/docs/guides/prisma
- Render Web Services: https://render.com/docs/web-services
- Prisma Migrate deploy: https://www.prisma.io/docs/orm/prisma-client/deployment/deploy-database-changes-with-prisma-migrate
