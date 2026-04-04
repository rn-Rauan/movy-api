# Módulo de Organização (Organization Module)

## Visão Geral

O módulo de organização é responsável por gerenciar as operações relacionadas às organizações do sistema Movy API. Ele implementa uma arquitetura limpa (Clean Architecture) com separação clara entre camadas de domínio, aplicação, infraestrutura e apresentação. As organizações representam entidades como empresas ou instituições que podem ter usuários associados.

## Funcionalidades

- **CRUD Completo**: Criar, listar, buscar por ID, atualizar e desabilitar organizações
- **Soft-Delete**: Organizações são marcadas como INACTIVE ao invés de serem excluídas
- **Validações de Domínio**: CNPJ único, nome válido, endereço obrigatório
- **Value Objects**: CNPJ, Nome da Organização, Slug, Endereço
- **Integração com Usuários**: Base para funcionalidades de membros (futuro)

## Estrutura do Módulo

```
src/modules/organization/
├── README.md                           # Esta documentação
├── organization.module.ts              # Módulo principal do NestJS
├── application/                        # Camada de Aplicação
│   ├── dtos/                           # Data Transfer Objects
│   │   ├── create-organization.dto.ts  # DTO para criação de organização
│   │   ├── organization-response.dto.ts # DTO para resposta de organização
│   │   └── update-organization.dto.ts  # DTO para atualização de organização
│   └── use-cases/                      # Casos de Uso
│       ├── create-organization.use-case.ts     # Caso de uso: Criar organização
│       ├── disable-organization.use-case.ts    # Caso de uso: Desabilitar organização
│       ├── find-all-active-organizations.use-case.ts # Caso de uso: Buscar organizações ativas
│       ├── find-all-organizations.use-case.ts  # Caso de uso: Buscar todas as organizações
│       ├── find-organization-by-id.use-case.ts # Caso de uso: Buscar organização por ID
│       └── update-organization.use-case.ts     # Caso de uso: Atualizar organização
├── domain/                             # Camada de Domínio
│   ├── entities/                       # Entidades de Domínio
│   │   ├── index.ts                    # Exportações das entidades
│   │   └── organization.entity.ts      # Entidade Organization
│   ├── errors/                         # Erros de Domínio
│   │   ├── index.ts                    # Exportações dos erros
│   │   └── organization.errors.ts      # Erros específicos da organização
│   ├── value-objects/                  # Value Objects
│   │   ├── address.value-object.ts     # Value Object: Endereço
│   │   ├── cnpj.value-object.ts        # Value Object: CNPJ
│   │   ├── index.ts                    # Exportações dos VOs
│   │   ├── organization-name.value-object.ts # Value Object: Nome da organização
│   │   └── slug.value-object.ts        # Value Object: Slug
│   └── interfaces/                     # Interfaces de Domínio
│       └── organization.repository.ts  # Interface do repositório de organização
├── infrastructure/                     # Camada de Infraestrutura
│   └── db/                             # Acesso a Dados
│       ├── mappers/                    # Mappers para conversão
│       │   └── organization.mapper.ts  # Mapper Organization (Domínio ↔ Prisma)
│       └── repositories/               # Implementações de Repositórios
│           └── prisma-organization.repository.ts # Repositório Prisma para Organization
└── presentation/                       # Camada de Apresentação
    ├── controllers/                    # Controladores HTTP
    │   └── organization.controller.ts  # Controller REST para organizações
    └── mappers/                        # Mappers de Apresentação
        └── organization.mapper.ts      # Presenter para respostas HTTP
```

## Endpoints da API

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/organizations` | Criar nova organização |
| GET | `/organizations` | Listar organizações ativas |
| GET | `/organizations/:id` | Buscar organização por ID |
| PUT | `/organizations/:id` | Atualizar organização |
| DELETE | `/organizations/:id` | Desabilitar organização (soft-delete) |

## Regras de Negócio

- **CNPJ Único**: Não é possível criar duas organizações com o mesmo CNPJ
- **Soft-Delete**: Organizações desabilitadas mantêm seus dados mas ficam invisíveis nas listagens ativas
- **Validações**: Nome, CNPJ e endereço são obrigatórios e seguem formatos específicos
- **Slug**: Gerado automaticamente a partir do nome da organização

## Dependências

- **Prisma**: Para acesso ao banco de dados PostgreSQL
- **NestJS**: Framework principal
- **Shared Module**: Value objects compartilhados (Email, Telephone)

## Próximos Passos

- Implementar testes unitários (80%+ cobertura)
- Adicionar funcionalidades de membros (associar usuários às organizações)
- Implementar permissões (apenas admins podem gerenciar organizações)
- Adicionar documentação Swagger