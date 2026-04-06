# Módulo de Membership (Associações de Membros)

## Visão Geral
O módulo de membership é responsável por gerenciar as associações entre usuários, roles e organizações no sistema Movy API. Ele implementa uma arquitetura limpa (Clean Architecture) com separação clara entre camadas de domínio, aplicação, infraestrutura e apresentação. A tabela central é `OrganizationMembership`, que suporta multi-tenancy e RBAC (Role-Based Access Control).

## Estrutura do Módulo
```
src/modules/membership/
├── README.md                           # Esta documentação
├── membership.module.ts                # Módulo principal do NestJS
├── application/                        # Camada de Aplicação
│   ├── dtos/
│   │   ├── create-membership.dto.ts    # DTO para criação de associação
│   │   └── membership-response.dto.ts  # DTO para resposta de associação
│   └── use-cases/                      # Casos de Uso
│       ├── create-membership.use-case.ts          # Criar associação
│       ├── find-membership-by-composite-key.use-case.ts  # Buscar por chave composta
│       ├── find-memberships-by-user.use-case.ts          # Listar por usuário
│       ├── find-memberships-by-organization.use-case.ts  # Listar por organização
│       ├── remove-membership.use-case.ts         # Remover (soft delete)
│       └── restore-membership.use-case.ts        # Restaurar associação
├── domain/
│   ├── entities/
│   │   ├── index.ts
│   │   ├── membership.entity.ts         # Entidade Membership
│   │   └── errors/
│   │       └── membership.errors.ts     # Erros de domínio
│   └── interfaces/
│       └── membership.repository.ts     # Interface do repositório
├── infrastructure/
│   ├── db/
│   │   ├── mappers/
│   │   │   └── membership.mapper.ts     # Mapper para conversão
│   │   └── repositories/
│   │       └── prisma-membership.repository.ts  # Implementação Prisma
├── presentation/
│   ├── controllers/
│   │   └── membership.controller.ts     # Controlador REST
│   └── mappers/
│       └── membership.presenter.ts      # Presenter para HTTP
```

## Funcionalidades Principais

### Endpoints REST
- **`POST /memberships`**: Criar nova associação (user + role + organization).
- **`GET /memberships/user/:userId`**: Listar associações de um usuário (paginado).
- **`GET /memberships/organization/:organizationId`**: Listar associações de uma organização (paginado).
- **`GET /memberships/:userId/:roleId/:organizationId`**: Buscar associação específica por chave composta.
- **`PATCH /memberships/:userId/:roleId/:organizationId/restore`**: Restaurar associação removida.
- **`DELETE /memberships/:userId/:roleId/:organizationId`**: Remover associação (soft delete).

### Regras de Negócio
- **Chave Composta Única**: Não permite associações duplicadas (mesmo user, role e org).
- **Soft Delete**: Remoções marcam `removedAt` em vez de deletar fisicamente.
- **Validações**: Verifica existência de User, Role e Organization antes de criar.
- **Paginação**: Suportada em listagens para performance.
- **Multi-Tenancy**: Associações isoladas por organização.

## Entidades e Value Objects

### Membership Entity
- **Propriedades**: `userId`, `roleId`, `organizationId`, `assignedAt`, `removedAt`.
- **Métodos**: `create()`, `restore()`, `remove()` (soft delete).
- **Imutabilidade**: Propriedades são readonly após criação.

### Erros de Domínio
- `MembershipAlreadyExistsError`: Tentativa de criar associação duplicada.
- `MembershipNotFoundError`: Associação não encontrada.

## Casos de Uso (Use Cases)

### CreateMembershipUseCase
- Valida entidades relacionadas.
- Impede duplicatas.
- Cria nova associação via repositório.

### FindMembershipByCompositeKeyUseCase
- Busca por `userId`, `roleId`, `organizationId`.
- Lança erro se não encontrada.

### FindMembershipsByUserUseCase
- Lista associações de um usuário com paginação.
- Retorna dados paginados.

### FindMembershipsByOrganizationUseCase
- Lista associações de uma organização com paginação.

### RemoveMembershipUseCase
- Marca `removedAt` (soft delete).
- Atualiza via repositório.

### RestoreMembershipUseCase
- Remove `removedAt` para restaurar.

## Infraestrutura

### PrismaMembershipRepository
- Implementa `MembershipRepository`.
- Usa `PrismaClient` para operações CRUD.
- Mapeia entre domínio e persistência via `MembershipMapper`.

### MembershipMapper
- Converte `Membership` (domínio) ↔ `OrganizationMembership` (Prisma).

## Apresentação

### MembershipController
- Endpoints REST com validação de DTOs.
- Usa `MembershipPresenter` para respostas HTTP.
- Protegido por `JwtAuthGuard`.

### MembershipPresenter
- Converte entidades para `MembershipResponseDto`.

## Integração com Outros Módulos

- **User Module**: Associa usuários a organizações via roles.
- **Organization Module**: Gerencia membros de organizações.
- **Auth Module**: Base para RBAC (futuro).
- **Shared Module**: Usa providers globais (Prisma, Guards).

## Testes
- **Unitários**: Cobertura para use cases e entidades (pendente implementação).
- **Integração**: Testes E2E para endpoints (futuro).

## Dependências
- `@nestjs/common`, `@nestjs/core`
- `prisma` e `@prisma/client`
- `class-validator` para DTOs
- `src/shared/` para componentes globais

## Próximos Passos
- Implementar guards baseados em roles (RBAC).
- Adicionar testes unitários e E2E.
- Integrar com auditoria (AuditLog).