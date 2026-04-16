---
name: movy-module
description: 'Implement a new NestJS module for the Movy API following Clean Architecture + DDD. Use when creating Vehicle, Trip, Enrollment, Payment or any new module. Covers entity, value objects, domain errors, repository interface, Prisma repository, mapper, use cases, DTOs, presenter, controller, and module wiring.'
argument-hint: 'module name (e.g. vehicle, trip, enrollment)'
---

# Movy Module Implementation

> Procedimento completo para criar um módulo novo do zero no padrão do projeto.  
> Conhecimento base completo: [MOVY_BRAIN.md](../../MOVY_BRAIN.md)

---

## When to Use

- "implementa o módulo de veículos"
- "cria o módulo de viagens / trip"
- "adiciona enrollment / booking"
- "cria um novo módulo seguindo o padrão do projeto"
- Qualquer feature nova que precisa de CRUD com Clean Architecture

---

## Pre-Flight Checklist

Antes de começar, confirmar:

- [ ] Model do Prisma já existe em `prisma/schema.prisma`?
- [ ] Enums necessários já existem no schema?
- [ ] O módulo tem `organizationId` (multi-tenant)? → `TenantFilterGuard` nas rotas
- [ ] O módulo é acessado por role específica? → `@Roles()` + `RolesGuard`
- [ ] Precisa de paginação? → usar `PaginationOptions` + `PaginatedResponse` do shared

---

## Procedure

### Passo 1 — Estrutura de pastas

Criar toda a estrutura antes de escrever código:

```
src/modules/<name>/
├── application/
│   ├── dtos/
│   │   ├── create-<name>.dto.ts
│   │   ├── update-<name>.dto.ts
│   │   └── <name>-response.dto.ts
│   └── use-cases/
│       ├── create-<name>.use-case.ts
│       ├── update-<name>.use-case.ts
│       ├── find-<name>-by-id.use-case.ts
│       ├── find-all-<name>s.use-case.ts      ← se necessário
│       └── delete-<name>.use-case.ts
├── domain/
│   ├── entities/
│   │   ├── index.ts
│   │   └── <name>.entity.ts
│   ├── errors/
│   │   ├── index.ts
│   │   └── <name>.errors.ts
│   ├── value-objects/               ← apenas se necessário
│   │   └── <value-object>.value-object.ts
│   └── interfaces/
│       └── <name>.repository.ts
├── infrastructure/
│   └── db/
│       ├── mappers/
│       │   └── <name>.mapper.ts
│       └── repositories/
│           └── prisma-<name>.repository.ts
├── presentation/
│   ├── controllers/
│   │   └── <name>.controller.ts
│   └── mappers/
│       └── <name>.presenter.ts
└── <name>.module.ts
```

---

### Passo 2 — Domain Layer

#### 2a. Entidade

```typescript
// domain/entities/<name>.entity.ts
interface <Name>Props {
  id: string
  organizationId: string
  // ... outros campos (value objects quando necessário)
  createdAt: Date
  updatedAt: Date
}

export class <Name>Entity {
  private readonly props: <Name>Props

  private constructor(props: <Name>Props) {
    this.props = props
  }

  static create(props: Omit<<Name>Props, 'id' | 'createdAt' | 'updatedAt'>): <Name>Entity {
    return new <Name>Entity({
      ...props,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  }

  static restore(props: <Name>Props): <Name>Entity {
    return new <Name>Entity(props)
  }

  // Getters públicos
  get id(): string { return this.props.id }
  get organizationId(): string { return this.props.organizationId }
  // ...
}
```

#### 2b. Domain Errors

```typescript
// domain/errors/<name>.errors.ts
// Sufixos: _NOT_FOUND → 404 | _CONFLICT/_ALREADY_EXISTS → 409 | _BAD_REQUEST → 400 | _FORBIDDEN → 403

export class <Name>NotFoundError extends Error {
  readonly code = '<NAME>_NOT_FOUND'
  constructor(id: string) { super(`<Name> with id ${id} not found`) }
}

export class <Name>AlreadyExistsError extends Error {
  readonly code = '<NAME>_ALREADY_EXISTS'
  constructor(field: string) { super(`<Name> with ${field} already exists`) }
}

export class <Name>ForbiddenError extends Error {
  readonly code = '<NAME>_ACCESS_FORBIDDEN'
  constructor() { super('Access to this <name> is forbidden') }
}
```

#### 2c. Repository Interface

```typescript
// domain/interfaces/<name>.repository.ts
export const <NAME>_REPOSITORY_TOKEN = Symbol('<NAME>_REPOSITORY')

export interface I<Name>Repository {
  save(entity: <Name>Entity): Promise<<Name>Entity | null>
  update(entity: <Name>Entity): Promise<<Name>Entity | null>
  delete(id: string): Promise<void>
  findById(id: string): Promise<<Name>Entity | null>
  findAll(options: PaginationOptions): Promise<PaginatedResponse<<Name>Entity>>
  findByOrganizationId(organizationId: string, options: PaginationOptions): Promise<PaginatedResponse<<Name>Entity>>
}
```

---

### Passo 3 — Infrastructure Layer

#### 3a. Mapper

```typescript
// infrastructure/db/mappers/<name>.mapper.ts
import type { <Name> as Prisma<Name> } from '../../../generated/prisma'

export class <Name>Mapper {
  static toDomain(raw: Prisma<Name>): <Name>Entity {
    return <Name>Entity.restore({
      id: raw.id,
      organizationId: raw.organizationId,
      // hidratar value objects aqui se necessário
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    })
  }

  static toPersistence(entity: <Name>Entity): Omit<Prisma<Name>, 'id'> {
    return {
      organizationId: entity.organizationId,
      // extrair .value_ dos value objects aqui
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    }
  }
}
```

#### 3b. Prisma Repository

```typescript
// infrastructure/db/repositories/prisma-<name>.repository.ts
@Injectable()
export class Prisma<Name>Repository implements I<Name>Repository {
  constructor(private readonly prisma: PrismaService) {}

  async save(entity: <Name>Entity): Promise<<Name>Entity | null> {
    const data = <Name>Mapper.toPersistence(entity)
    const result = await this.prisma.<name>.create({ data: { ...data, id: entity.id } })
    return result ? <Name>Mapper.toDomain(result) : null
  }

  async findByOrganizationId(organizationId: string, options: PaginationOptions): Promise<PaginatedResponse<<Name>Entity>> {
    const { page, limit } = options
    const skip = (page - 1) * limit
    const [items, total] = await this.prisma.$transaction([
      this.prisma.<name>.findMany({ where: { organizationId }, skip, take: limit }),
      this.prisma.<name>.count({ where: { organizationId } }),
    ])
    return { data: items.map(<Name>Mapper.toDomain), total, page, limit, totalPages: Math.ceil(total / limit) }
  }
}
```

---

### Passo 4 — Application Layer

#### 4a. Use Cases (padrão)

```typescript
@Injectable()
export class Create<Name>UseCase {
  constructor(
    @Inject(<NAME>_REPOSITORY_TOKEN)
    private readonly <name>Repository: I<Name>Repository,
  ) {}

  async execute(dto: Create<Name>Dto, context: TenantContextParams): Promise<<Name>ResponseDto> {
    // 1. Validar/criar value objects
    // 2. Checar duplicatas
    // 3. Criar entidade
    const entity = <Name>Entity.create({ ...dto, organizationId: context.organizationId })
    // 4. Salvar
    const saved = await this.<name>Repository.save(entity)
    if (!saved) throw new <Name>CreationFailedError()
    // 5. Retornar
    return <Name>Presenter.toHTTP(saved)
  }
}
```

#### 4b. DTOs

```typescript
// application/dtos/create-<name>.dto.ts
export class Create<Name>Dto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  field: string
}

// application/dtos/<name>-response.dto.ts
export class <Name>ResponseDto {
  @ApiProperty() id: string
  @ApiProperty() organizationId: string
  @ApiProperty() createdAt: Date
}

// application/dtos/update-<name>.dto.ts
export class Update<Name>Dto extends PartialType(Create<Name>Dto) {}
```

---

### Passo 5 — Presentation Layer

#### 5a. Presenter

```typescript
export class <Name>Presenter {
  static toHTTP(entity: <Name>Entity): <Name>ResponseDto {
    return { id: entity.id, organizationId: entity.organizationId, createdAt: entity.createdAt }
  }
  static toHTTPList(entities: <Name>Entity[]): <Name>ResponseDto[] {
    return entities.map(<Name>Presenter.toHTTP)
  }
}
```

#### 5b. Controller

```typescript
@ApiTags('<name>s')
@Controller('<name>s')
@UseGuards(JwtAuthGuard)
export class <Name>Controller {
  constructor(
    private readonly create<Name>: Create<Name>UseCase,
    // ...outros use cases
  ) {}

  @Post('/organizations/:organizationId/<name>s')
  @UseGuards(TenantFilterGuard, RolesGuard)
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: 'Create <name>' })
  async create(
    @Body() dto: Create<Name>Dto,
    @GetUser() ctx: TenantContext,
  ) {
    return this.create<Name>.execute(dto, { organizationId: ctx.organizationId! })
  }

  @Get('/organizations/:organizationId/<name>s')
  @UseGuards(TenantFilterGuard)
  @ApiOperation({ summary: 'List <name>s by organization' })
  async findAll(
    @Param('organizationId') organizationId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) { ... }
}
```

---

### Passo 6 — Module Wiring

```typescript
// <name>.module.ts
@Module({
  imports: [SharedModule],
  controllers: [<Name>Controller],
  providers: [
    { provide: <NAME>_REPOSITORY_TOKEN, useClass: Prisma<Name>Repository },
    Create<Name>UseCase,
    Update<Name>UseCase,
    FindAll<Name>sUseCase,
    Find<Name>ByIdUseCase,
    Delete<Name>UseCase,
  ],
  exports: [<NAME>_REPOSITORY_TOKEN],
})
export class <Name>Module {}
```

Adicionar `<Name>Module` ao `imports` do `AppModule`.

---

### Passo 7 — Validação Final

```bash
npx tsc --noEmit    # zero erros TypeScript obrigatório
```

Checklist antes de considerar o módulo pronto:

- [ ] `npx tsc --noEmit` = 0 erros
- [ ] Todos os domain errors têm sufixo correto (`_NOT_FOUND`, `_BAD_REQUEST`, etc.)
- [ ] `organizationId` nunca vem do body — sempre do JWT (`ctx.organizationId`)
- [ ] `ForbiddenException` do NestJS **não existe** em nenhum use-case
- [ ] Mapper tem `toDomain()` e `toPersistence()`
- [ ] Presenter tem `toHTTP()` e `toHTTPList()` estáticos
- [ ] Controller tem `@UseGuards(JwtAuthGuard)` no nível da classe
- [ ] Rotas com acesso restrito têm `TenantFilterGuard` + `RolesGuard` + `@Roles()`
- [ ] Rotas de listagem global têm `@Dev()`
- [ ] Module adicionado ao `AppModule`
- [ ] Soft delete implementado (se aplicável) — status `INACTIVE` ou campo `removedAt`

---

## Quick Reference

| O que fazer | Onde fica |
|-------------|-----------|
| Tipos paginação | `src/shared/domain/types/index.ts` |
| `TenantContext` interface | `src/shared/infrastructure/types/tenant-context.interface.ts` |
| `@GetUser()` decorator | `src/shared/infrastructure/decorators/get-user.decorator.ts` |
| `AllExceptionsFilter` | `src/shared/presentation/filters/` |
| Guards | `src/shared/infrastructure/guards/` |
| `PrismaService` | via `SharedModule` |
