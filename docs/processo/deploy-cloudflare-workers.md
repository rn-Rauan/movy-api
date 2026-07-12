# Deploy do Movy Web com Cloudflare Workers

> Registro tecnico do processo de publicacao do frontend do Movy Web usando
> Cloudflare Workers e Wrangler.
>
> Data do registro: 2026-06-29.

## Objetivo

Publicar o cliente web do Movy em uma URL publica para validar os fluxos da
aplicacao consumindo a API hospedada no Render e o banco PostgreSQL no Neon.

O ambiente online ficou dividido em:

- Cloudflare Workers: hospedagem do frontend TanStack Start.
- Render: hospedagem da API NestJS.
- Neon: banco PostgreSQL da API.

Arquitetura de execucao:

```text
Navegador
   |
   v
Cloudflare Worker - Movy Web
   |
   v
Render Web Service - Movy API
   |
   v
Neon PostgreSQL
```

## Decisao de hospedagem

O frontend foi publicado na Cloudflare Workers porque o projeto ja estava
configurado para esse alvo de deploy. O arquivo `wrangler.jsonc` define o Worker
e o preset `@lovable.dev/vite-tanstack-config` inclui o suporte necessario para
gerar os artefatos usados pelo Wrangler.

A Vercel nao foi usada nesta versao porque o build atual do TanStack Start nao
gera uma saida estatica simples com `dist/index.html`. O build gera artefatos
separados em:

```text
dist/client/
dist/server/
```

Por isso, publicar o projeto como uma aplicacao Vite estatica comum resultou em
erro `404: NOT_FOUND`. Para evitar adaptacoes adicionais de runtime, foi mantido
o caminho ja suportado pelo projeto: Cloudflare Workers.

## Configuracao principal

Arquivo:

```text
wrangler.jsonc
```

Configuracao usada:

```json
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "movy-app",
  "compatibility_date": "2025-09-24",
  "compatibility_flags": ["nodejs_compat"],
  "main": "@tanstack/react-start/server-entry"
}
```

URL publicada:

```text
https://movy-app.rn-labs.workers.dev
```

O subdominio `rn-labs.workers.dev` pertence a conta Cloudflare e pode ser
reutilizado por outros Workers da mesma conta.

## Variavel de ambiente

O frontend consome a API por meio da variavel:

```env
VITE_API_URL=https://movy-api-av8q.onrender.com
```

Essa variavel e embutida no bundle durante o build. Portanto, ela precisa estar
correta antes da execucao de:

```bash
npm run build
```

Em desenvolvimento local, o valor pode continuar apontando para a API local:

```env
VITE_API_URL=http://localhost:5701
```

## Processo de deploy

### 1. Configurar `.env`

Criar ou atualizar o arquivo `.env` com a URL publica da API:

```env
VITE_API_URL=https://movy-api-av8q.onrender.com
```

### 2. Gerar build

```bash
npm run build
```

### 3. Autenticar no Cloudflare

```bash
npx wrangler login
```

Esse comando abre o navegador para autorizar a CLI Wrangler na conta Cloudflare.

### 4. Publicar o Worker

```bash
npx wrangler deploy
```

No primeiro deploy foi necessario registrar um subdominio `workers.dev` para a
conta Cloudflare. O subdominio escolhido foi:

```text
rn-labs
```

Ao final, o Wrangler publicou o frontend em:

```text
https://movy-app.rn-labs.workers.dev
```

## Configuracao de CORS na API

A API no Render precisa permitir chamadas feitas pela origem do frontend.

Adicionar a URL do Worker em `ALLOWED_ORIGINS`:

```env
ALLOWED_ORIGINS=https://movy-app.rn-labs.workers.dev
```

Quando houver outras origens, manter todas separadas por virgula:

```env
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,https://movy-app.rn-labs.workers.dev
```

Depois de alterar essa variavel no Render, a API deve ser reiniciada para a nova
configuracao entrar em vigor.

## Verificacao

Depois do deploy, verificar:

1. Acesso a URL publica:

```text
https://movy-app.rn-labs.workers.dev
```

2. Carregamento da landing page.
3. Listagem publica de viagens.
4. Login com usuario de teste.
5. Chamadas para API sem erro de CORS.
6. Fluxos principais:
   - cadastro de usuario;
   - cadastro de empresa;
   - reserva de viagem;
   - painel administrativo;
   - area de motorista, quando aplicavel.

## Observacoes operacionais

- Apos registrar o subdominio `workers.dev`, a propagacao de DNS e SSL pode
  levar alguns minutos.
- O Wrangler pode avisar que `workers_dev` e `preview_urls` foram habilitados
  por padrao. Esses avisos nao bloqueiam o deploy.
- Em uma versao futura, esses valores podem ser declarados explicitamente no
  `wrangler.jsonc`.

## Comandos de referencia

Deploy completo:

```bash
npm install
npm run build
npx wrangler login
npx wrangler deploy
```

Deploy apos login ja realizado:

```bash
npm run build
npx wrangler deploy
```

Verificacoes locais recomendadas:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

## Pontos de evolucao

- adicionar script `deploy` no `package.json`;
- configurar deploy automatico por GitHub Actions ou Cloudflare;
- adicionar dominio proprio, como `app.movy.com.br`;
- criar ambiente separado de staging;
- adicionar testes E2E antes do deploy.

## Referencias externas

- Cloudflare Workers: https://developers.cloudflare.com/workers/
- Wrangler CLI: https://developers.cloudflare.com/workers/wrangler/
- TanStack Start: https://tanstack.com/start
