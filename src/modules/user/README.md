# Módulo de Usuário (User Module)

## Visão Geral

O módulo de usuário é responsável por gerenciar as operações relacionadas aos usuários do sistema Movy API. Ele implementa uma arquitetura limpa (Clean Architecture) com separação clara entre camadas de domínio, aplicação, infraestrutura e apresentação.

## Estrutura do Módulo

```
src/modules/user/
├── README.md                           # Esta documentação
├── user.module.ts                      # Módulo principal do NestJS
├── application/                        # Camada de Aplicação
│   ├── dto/                            # Data Transfer Objects
│   │   ├── create-user.dto.ts          # DTO para criação de usuário
│   │   ├── update-user.dto.ts          # DTO para atualização de usuário
│   │   └── user-response.dto.ts        # DTO para resposta de usuário
│   └── use-cases/                      # Casos de Uso
│       ├── create-user.use-case.ts     # Caso de uso: Criar usuário
│       ├── disable-user.use-case.ts    # Caso de uso: Desabilitar usuário
│       ├── find-all-users.use-case.ts  # Caso de uso: Buscar todos os usuários
│       ├── find-user-by-id.use-case.ts # Caso de uso: Buscar usuário por ID
│       └── update-user.use-case.ts     # Caso de uso: Atualizar usuário
├── domain/                             # Camada de Domínio
│   ├── entities/                       # Entidades de Domínio
│   │   ├── index.ts                    # Exportações das entidades
│   │   └── user.entity.ts              # Entidade User
│   ├── errors/                         # Erros de Domínio
│   │   ├── index.ts                    # Exportações dos erros
│   │   └── user.errors.ts              # Erros específicos do usuário
│   ├── value-objects/                  # Value Objects
│   │   ├── email.value-object.ts       # Value Object: Email
│   │   ├── index.ts                    # Exportações dos VOs
│   │   ├── password-hash.value-object.ts # Value Object: Hash da senha
│   │   ├── telephone.value-object.ts   # Value Object: Telefone
│   │   └── user.name.value-object.ts   # Value Object: Nome do usuário
│   └── interfaces/                     # Interfaces de Domínio
│       └── user.repository.ts          # Interface do repositório de usuário
├── infrastructure/                     # Camada de Infraestrutura
│   └── db/                             # Acesso a Dados
│       ├── mappers/                    # Mappers para conversão
│       │   └── user.mapper.ts          # Mapper User (Domínio ↔ Prisma)
│       └── repositories/               # Implementações de Repositórios
│           └── prisma-user.repository.ts # Repositório Prisma para User
└── presentation/                       # Camada de Apresentação
    ├── controllers/                    # Controladores HTTP
    │   └── user.controller.ts          # Controller REST para usuários
    └── mappers/                        # Mappers de Apresentação
        └── user.presenter.ts           # Presenter para respostas HTTP
```

## Modelo de Dados (Baseado no Schema Prisma)

O módulo implementa a entidade `User` conforme definida no schema Prisma:

```prisma
model User {
  id             String       @id @default(uuid())
  name           String       @db.VarChar(255)
  email          String       @unique @db.VarChar(255)
  passwordHash   String
  telephone      String       @db.VarChar(20)
  status         Status       @default(ACTIVE)
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt

  // Relations
  userRoles    OrganizationMembership[] @relation("UserToMembership")
  driver       Driver?                  @relation("DriverUser")
  enrollments  Enrollment[]             @relation("EnrollmentUser")
  auditLogs    AuditLog[]               @relation("AuditLogUser")

  @@index([status])
  @@map("user")
}
```

### Campos da Entidade User

- **id**: Identificador único (UUID)
- **name**: Nome completo do usuário (até 255 caracteres)
- **email**: Email único do usuário (até 255 caracteres)
- **passwordHash**: Hash da senha
- **telephone**: Número de telefone (até 20 caracteres)
- **status**: Status do usuário (ACTIVE/INACTIVE)
- **createdAt**: Data de criação
- **updatedAt**: Data da última atualização

### Value Objects Implementados

- **Email**: Validação de formato de email
- **PasswordHash**: Gerenciamento seguro de hash de senha
- **Telephone**: Validação de formato de telefone
- **UserName**: Validação de nome de usuário

## Funcionalidades Implementadas

### Casos de Uso Disponíveis

1. **CreateUserUseCase**: Criação de novo usuário
2. **FindUserByIdUseCase**: Busca usuário por ID
3. **FindAllUsersUseCase**: Lista todos os usuários
4. **UpdateUserUseCase**: Atualização de dados do usuário
5. **DisableUserUseCase**: Desabilitação de usuário (soft delete via status)

### Endpoints da API

- `POST /users` - Criar usuário
- `GET /users` - Listar todos os usuários
- `GET /users/:id` - Buscar usuário por ID
- `PUT /users/:id` - Atualizar usuário
- `DELETE /users/:id` - Desabilitar usuário

## Avaliação de Completude do Módulo Inicial

### ✅ Pontos Fortes

1. **Arquitetura Limpa**: Implementação correta da Clean Architecture com separação adequada de responsabilidades
2. **CRUD Básico**: Todos os casos de uso essenciais (Create, Read, Update, Delete) estão implementados
3. **Value Objects**: Implementação adequada para validação de dados críticos (email, senha, telefone, nome)
4. **Mappers**: Conversão adequada entre camadas (Domínio ↔ Infraestrutura, Domínio ↔ Apresentação)
5. **DTOs**: Estrutura adequada para entrada e saída de dados
6. **Repositório**: Interface e implementação com Prisma ORM
7. **Controller**: Endpoints REST bem estruturados

### ⚠️ Pontos de Atenção/Possíveis Melhorias

1. **Validações de Domínio**: Verificar se todas as regras de negócio estão implementadas nos Value Objects
2. **Autenticação/Autorização**: O módulo não inclui lógica de login/autenticação (pode estar em outro módulo)
3. **Relações**: As relações com outras entidades (OrganizationMembership, Driver, etc.) não são gerenciadas diretamente neste módulo
4. **Paginação**: O caso de uso `FindAllUsersUseCase` pode precisar de paginação para grandes volumes de dados
5. **Busca Avançada**: Possibilidade de adicionar filtros por status, email, etc.
6. **Testes**: Verificar cobertura de testes unitários e de integração
7. **Logs de Auditoria**: Integração com AuditLog pode ser aprimorada

### 📊 Status de Completude

**Completude Geral: 85%**

- ✅ Estrutura arquitetural: Completa
- ✅ CRUD básico: Completo
- ✅ Value Objects: Completo
- ✅ Mappers e DTOs: Completos
- ✅ Repositório Prisma: Completo
- ✅ Controller REST: Completo
- ⚠️ Validações avançadas: Parcial
- ⚠️ Recursos adicionais (paginação, filtros): Ausente
- ⚠️ Testes: Não verificado

## Próximos Passos Recomendados

1. **Implementar paginação** no `FindAllUsersUseCase`
2. **Adicionar filtros** (por status, data de criação, etc.)
3. **Implementar testes** unitários e de integração
4. **Adicionar validações** mais robustas nos Value Objects
5. **Considerar soft delete** físico vs lógico (atualmente usa status)
6. **Integrar com módulo de autenticação** para login/logout
7. **Adicionar cache** para operações de leitura frequentes

## Dependências

- **NestJS**: Framework principal
- **Prisma**: ORM para acesso ao banco PostgreSQL
- **Class-Validator**: Para validações de DTOs
- **UUID**: Para geração de IDs únicos

## Como Usar

1. Importe o `UserModule` no seu módulo principal
2. Configure as variáveis de ambiente para o banco de dados
3. Execute as migrações do Prisma: `npx prisma migrate dev`
4. A API estará disponível nos endpoints `/users`

---

**Última atualização**: Abril 2026
**Versão**: 1.0.0