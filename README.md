<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

<h1 align="center">Movy API</h1>

<p align="center">
  <strong> API para um SaaS de gerenciamento de transporte coletivo e gestao de viagens recorrentes</strong>
</p>

<p align="center">
  Construída com <a href="https://nestjs.com/" target="_blank">NestJS</a> e <a href="https://www.prisma.io/" target="_blank">Prisma</a>, usando <a href="https://www.postgresql.org/" target="_blank">PostgreSQL</a> como banco de dados.
</p>

<p align="center">
  <a href="https://github.com/rn-Rauan/movy-api/actions/workflows/ci.yml">
    <img src="https://github.com/rn-Rauan/movy-api/actions/workflows/ci.yml/badge.svg" alt="CI" />
  </a>
</p>

---

## 📋 Descrição

Movy API é uma aplicação backend escalável para gerenciar:
- **Organizações** - Cadastro e gerenciamento de empresas de transporte
- **Usuários e Roles** - Sistema completo de autenticação e autorização
- **Associações de Membros** - Gestão de memberships entre usuários, roles e organizações
- **Veículos** - Cadasto e controle de frotas
- **Rotas/Viagens** - Criação de templates e instâncias de viagens
- **Inscrições** - Gerenciamento de passageiros em viagens
- **Pagamentos** - Sistema de pagamento integrado
- **Planos e Assinaturas** - Gerenciamento de diferentes planos de serviço

Para documentação completa, veja a pasta [docs/](./docs/)

---

## 🚀 Quick Start

### Pré-requisitos
- Node.js (v18+)
- npm ou yarn
- Docker (opcional, para banco de dados)

### Project setup

```bash
$ npm install
```

### Configurar variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/movy"
```

### Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

### Banco de dados

```bash
# Aplicar migrações
$ npx prisma migrate dev

# Abrir Prisma Studio
$ npx prisma studio
```

---

## 🧪 Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
