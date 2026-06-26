# Arquitetura — Movy API

> Referência de padrões arquiteturais do projeto. Para diagramas visuais, veja [ARQUITETURA_VISUAL.md](ARQUITETURA_VISUAL.md).

---

## 1. Visão Geral

A Movy API segue **Clean Architecture + DDD Lite** por módulo. Cada módulo é autocontido: define seu próprio domínio, casos de uso, repositório e controller. O acoplamento entre módulos ocorre apenas via importação explícita de módulos NestJS (`imports: [OutroModule]`), nunca via dependência direta de implementações.

```
src/
├── modules/         ← Módulos de domínio (um diretório por contexto)
├── shared/          ← Infraestrutura global (@Global): guards, filtros, PrismaService, value objects
└── app.module.ts    ← Raiz — registra todos os módulos
```

---

## 2. Estrutura Padrão de Módulo

Todo módulo segue esta estrutura de diretórios:

```
src/modules/<module>/
├── application/
│   ├── dtos/                   # DTOs de entrada/saída (class-validator + Swagger)
│   └── use-cases/              # Casos de uso (um arquivo por caso de uso)
├── domain/
│   ├── entities/               # Entidades de domínio + value objects da entidade
│   ├── errors/                 # Erros de domínio do módulo (<module>.errors.ts)
│   ├── interfaces/             # Interfaces de repositório (contratos abstratos)
│   └── value-objects/          # Value objects reutilizáveis dentro do módulo
├── infrastructure/
│   └── db/
│       ├── mappers/            # Prisma row ↔ domain entity
│       └── repositories/       # Implementações Prisma dos repositórios
├── presentation/
│   ├── controllers/            # Controllers NestJS (roteamento + guards)
│   └── mappers/                # Domain entity → HTTP response (presenter)
└── <module>.module.ts          # Módulo NestJS: providers, imports, exports
```

---

## 3. Camadas e Responsabilidades

### 3.1 Domain (Núcleo)

Independente de framework. Não conhece NestJS, Prisma ou HTTP.

#### Entidade

```typescript
export class UserEntity {
  private constructor(private readonly props: UserProps) {}

  // Factory para criação nova (valida regras)
  static create(props: Omit<UserProps, 'id' | 'createdAt'>): UserEntity { ... }

  // Factory para reconstituição do banco (pula validações)
  static restore(props: UserProps): UserEntity { ... }

  // Getters públicos — sem setters diretos
  get id(): string { return this.props.id; }
  get email(): Email { return this.props.email; }

  // Mutações com nomes de domínio
  deactivate(): void { this.props.status = Status.INACTIVE; }
}
```

#### Value Object

```typescript
export class Email {
  private constructor(private readonly _value: string) {}

  // Valida e lança DomainError se inválido
  static create(email: string): Email { ... }

  // Reconstitui sem validação (confia no banco)
  static restore(email: string): Email { return new Email(email); }

  get value(): string { return this._value; }
}
```

#### Erros de Domínio

```typescript
// Sufixo do code determina o HTTP status (mapeado pelo AllExceptionsFilter)
export class UserNotFoundError extends DomainError {
  constructor(id: string) {
    super(`User ${id} not found`, 'USER_NOT_FOUND'); // → 404
  }
}

export class UserEmailAlreadyExistsError extends DomainError {
  constructor() {
    super('Email already in use', 'USER_EMAIL_ALREADY_EXISTS'); // → 409
  }
}
```

**Mapeamento de sufixos para HTTP:**

| Sufixo do `code` | HTTP Status |
|---|---|
| `_NOT_FOUND` | 404 |
| `_ALREADY_EXISTS` | 409 |
| `INVALID_` ou `_BAD_REQUEST` | 400 |
| `_FORBIDDEN` | 403 |
| `_UNAUTHORIZED` | 401 |

Erros de módulo ficam em `src/modules/<module>/domain/errors/`.  
Erros compartilhados ficam em `src/shared/domain/errors/`.

#### Repositório (Interface)

```typescript
// Abstract class em vez de interface — necessário para injeção de dependência no NestJS
export abstract class UserRepository {
  abstract findById(id: string): Promise<UserEntity | null>;
  abstract save(user: UserEntity): Promise<UserEntity | null>;
  abstract findAll(options: PaginationOptions): Promise<PaginatedResponse<UserEntity>>;
  // ...
}
```

---

### 3.2 Application (Casos de Uso)

Orquestra entidades e repositórios. Não conhece HTTP, NestJS ou Prisma — apenas as interfaces abstratas.

```typescript
@Injectable()
export class CreateUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly hashProvider: HashProvider,
  ) {}

  async execute(dto: CreateUserDto): Promise<UserEntity> {
    const existing = await this.userRepository.findByEmail(dto.email);
    if (existing) throw new UserEmailAlreadyExistsError();

    const user = UserEntity.create({ ... });
    const saved = await this.userRepository.save(user);
    if (!saved) throw new UserCreationFailedError();
    return saved;
  }
}
```

**Regra:** Use cases nunca lançam `HttpException` (400, 404, etc.) — apenas `DomainError`. O `AllExceptionsFilter` faz a conversão.

---

### 3.3 Infrastructure (Implementações)

#### Mapper (Prisma ↔ Domain)

```typescript
export class UserMapper {
  // Prisma model → Domain entity (reconstitui sem validação)
  static toDomain(raw: PrismaUser): UserEntity {
    return UserEntity.restore({
      id: raw.id,
      email: Email.restore(raw.email),
      // ...
    });
  }

  // Domain entity → Prisma create/update data
  static toPersistence(entity: UserEntity): Prisma.UserCreateInput {
    return {
      id: entity.id,
      email: entity.email.value,
      // ...
    };
  }
}
```

#### Repositório Prisma

```typescript
@Injectable()
export class PrismaUserRepository extends UserRepository {
  constructor(private readonly prisma: PrismaService) { super(); }

  async findById(id: string): Promise<UserEntity | null> {
    const raw = await this.prisma.user.findUnique({ where: { id } });
    return raw ? UserMapper.toDomain(raw) : null;
  }
}
```

---

### 3.4 Presentation (Controllers + Presenter)

#### Controller

```typescript
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly createUser: CreateUserUseCase) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(RoleName.ADMIN)
  async create(@Body() dto: CreateUserDto) {
    const user = await this.createUser.execute(dto);
    return UserPresenter.toHTTP(user);
  }
}
```

#### Presenter

```typescript
export class UserPresenter {
  // Domain entity → HTTP response shape
  static toHTTP(entity: UserEntity): UserResponseDto {
    return {
      id: entity.id,
      name: entity.name.value,
      email: entity.email.value,
      // ...
    };
  }

  static toHTTPList(entities: UserEntity[]): UserResponseDto[] {
    return entities.map(UserPresenter.toHTTP);
  }
}
```

**Regra:** Apresentadores são classes com métodos estáticos. Nunca são injetados — apenas chamados diretamente no controller.

---

## 4. SharedModule (`src/shared/`)

Registrado com `@Global()` — disponível em todos os módulos sem precisar ser importado.

| Provedor | Descrição |
|---|---|
| `PrismaService` | Extensão do `PrismaClient` via `@prisma/adapter-pg`. Lê `DATABASE_URL` sem fallback. |
| `BcryptHashProvider` | Hash de senha com 10 salt rounds. Implementa `HashProvider`. |
| `JwtAuthGuard` | Valida JWT, popula `req.context` com `TenantContext`. |
| `RolesGuard` | Verifica `@Roles()` metadata contra `req.context.role`. |
| `TenantFilterGuard` | Garante que `:organizationId` no path bata com o `organizationId` do JWT. |
| `DevGuard` | Permite acesso apenas se `req.context.isDev === true`. |
| `AllExceptionsFilter` | Filtro global — mapeia `DomainError.code` para HTTP status. |
| `LoggingInterceptor` | Log de entrada/saída de requests. |

**Value Objects compartilhados:**
- `Email` — validação de formato de e-mail
- `Money` — valor monetário com precisão decimal
- `Telephone` — validação de número de telefone

---

## 5. Pipeline de Guards

A ordem de aplicação dos guards é declarada no decorator `@UseGuards()`:

```
Request
  → JwtAuthGuard        (sempre presente em rotas protegidas)
  → RolesGuard          (quando há @Roles())
  → TenantFilterGuard   (quando há :organizationId no path)
  → DevGuard            (quando há @Dev())
  → Controller
```

**Combinações comuns:**

```typescript
// Rota de admin com isolamento de tenant
@UseGuards(JwtAuthGuard, TenantFilterGuard, RolesGuard)
@Roles(RoleName.ADMIN)

// Rota de admin sem param de org no path
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleName.ADMIN)

// Rota exclusiva para devs
@UseGuards(JwtAuthGuard, DevGuard)
@Dev()
```

---

## 6. TransactionManager (UnitOfWork)

Operações que envolvem múltiplas escritas atômicas usam o `TransactionManager` via `AsyncLocalStorage`. Isso garante rollback automático pelo Prisma se qualquer etapa falhar.

```typescript
// Padrão em use cases orquestradores (ex: RegisterOrganizationWithAdminUseCase)
await this.transactionManager.runInTransaction(async () => {
  const user = await this.userRepository.save(newUser);
  const org = await this.orgRepository.save(newOrg);
  const membership = await this.membershipRepository.save(newMembership);
  // Se qualquer save falhar → rollback automático de todos
});
```

O `PrismaService` e os repositórios detectam a transação ativa via `AsyncLocalStorage` e usam automaticamente o client transacionado.

---

## 7. Paginação

Todos os endpoints de listagem aceitam `?page=1&limit=10` e retornam `PaginatedResponse<T>`:

```typescript
interface PaginationOptions {
  page: number;
  limit: number;
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
```

---

## 8. Módulo NestJS (Wiring)

```typescript
@Module({
  imports: [SharedModule],         // ou outros módulos exportando repositórios necessários
  providers: [
    CreateUserUseCase,
    FindUserByIdUseCase,
    // ...
    UserRepository,                // token abstrato
    {
      provide: UserRepository,
      useClass: PrismaUserRepository,
    },
  ],
  controllers: [UserController],
  exports: [UserRepository],       // exportar se outros módulos precisarem
})
export class UserModule {}
```

---

## 9. Testes

Testes unitários vivem em `test/modules/<module>/application/use-cases/`. Seguem o padrão AAA com injeção manual de dependências (sem mocks de framework).

```typescript
function makeMocks() {
  return {
    userRepository: {
      findByEmail: jest.fn(),
      save: jest.fn(),
    } as jest.Mocked<UserRepository>,
  };
}

describe('CreateUserUseCase', () => {
  let sut: CreateUserUseCase;
  let mocks: ReturnType<typeof makeMocks>;

  beforeEach(() => {
    mocks = makeMocks();
    sut = new CreateUserUseCase(mocks.userRepository, mocks.hashProvider);
  });

  it('should create a user', async () => {
    mocks.userRepository.findByEmail.mockResolvedValue(null);
    mocks.userRepository.save.mockResolvedValue(makeUser());

    const result = await sut.execute(makeCreateUserDto());

    expect(result).toBeDefined();
  });
});
```

Comando: `npx jest --config test/jest-unit.json`

---

## 10. Convenções de Nomenclatura

| Artefato | Convenção | Exemplo |
|---|---|---|
| Entidade | `<Entity>Entity` | `UserEntity` |
| Value Object | `<Name>` | `Email`, `Cnh` |
| Erro de domínio | `<Description>Error` | `UserNotFoundError` |
| Repositório (abstract) | `<Entity>Repository` | `UserRepository` |
| Repositório (Prisma) | `Prisma<Entity>Repository` | `PrismaUserRepository` |
| Mapper (infra) | `<Entity>Mapper` | `UserMapper` |
| Presenter | `<Entity>Presenter` | `UserPresenter` |
| Use Case | `<Action><Entity>UseCase` | `CreateUserUseCase` |
| DTO de entrada | `<Action><Entity>Dto` | `CreateUserDto` |
| DTO de resposta | `<Entity>ResponseDto` | `UserResponseDto` |
| Controller | `<Entity>Controller` | `UserController` |
| Módulo | `<Entity>Module` | `UserModule` |
