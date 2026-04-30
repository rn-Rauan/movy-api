---
name: movy-migration
description: 'Propagate a Prisma schema change safely through all layers of a Movy module: schema, migration, entity, mapper, DTOs, presenter, and test factories. Validates with tsc --noEmit at the end.'
argument-hint: 'description of the change (e.g. "add expiresAt to Vehicle", "remove field X from Driver")'
---

# Movy Migration — Schema Change Propagation

> Propaga uma mudança de schema Prisma por todas as camadas do módulo afetado.
> Conhecimento base: [MOVY_BRAIN.md](../../MOVY_BRAIN.md)

---

## When to Use

- "adiciona o campo `expiresAt` no Vehicle"
- "remove `statusForRecurringTrip` do TripInstance"
- "adiciona enum novo `PaymentMethod` no schema"
- "renomeia o campo X para Y no modelo Z"
- Qualquer mudança no `prisma/schema.prisma` que afeta código TypeScript

---

## Pre-Flight Checklist

- [ ] Argumento recebido descreve claramente o que muda e em qual modelo
- [ ] Identificar o módulo afetado: qual `src/modules/<name>` usa esse modelo Prisma?
- [ ] A mudança é aditiva (novo campo) ou destrutiva (remoção/renome)?
  - Destrutiva → confirmar com o usuário antes de prosseguir
- [ ] Há dados existentes no banco que podem ser afetados?

---

## Procedure

### Passo 1 — Ler o Estado Atual

Ler antes de qualquer mudança:
1. `prisma/schema.prisma` — modelo completo atual
2. `src/modules/<name>/domain/entities/<name>.entity.ts`
3. `src/modules/<name>/infrastructure/db/mappers/<name>.mapper.ts`
4. `src/modules/<name>/application/dtos/create-<name>.dto.ts`
5. `src/modules/<name>/application/dtos/<name>-response.dto.ts`
6. `test/modules/<name>/factories/<name>.factory.ts`

---

### Passo 2 — Atualizar o Schema Prisma

Editar `prisma/schema.prisma`:

```prisma
model <Name> {
  // Adicionar/remover/renomear campo aqui
  newField  String?  // use ? para nullable se o campo pode ser nulo em registros existentes
}
```

**Regras críticas:**
- Novo campo obrigatório em tabela com dados existentes → deve ter `@default(value)` ou ser nullable
- Remoção de campo → verificar se há `onDelete: Restrict` em outra tabela que referencia esse campo
- Novo enum → declarar antes do model que o usa
- `@@unique` → verificar impacto em registros existentes

---

### Passo 3 — Executar Migration

```bash
npx prisma migrate dev --name <descricao-em-kebab-case>
npx prisma generate
```

Verificar que:
- Migration foi criada em `prisma/migrations/`
- `generated/prisma/` foi atualizado (novo tipo disponível)

---

### Passo 4 — Atualizar a Entidade

Editar `src/modules/<name>/domain/entities/<name>.entity.ts`:

```typescript
// 1. Adicionar ao interface de Props
interface <Name>Props {
  newField: string | null  // ou o tipo correto
  // ...demais campos
}

// 2. Adicionar getter público
get newField(): string | null { return this.props.newField }

// 3. Atualizar static create() — incluir novo campo nos parâmetros
static create(props: Omit<<Name>Props, 'id' | 'createdAt' | 'updatedAt'>): <Name>Entity {
  return new <Name>Entity({
    ...props,
    newField: props.newField ?? null,
    // ...
  })
}

// 4. Atualizar static restore() — incluir novo campo
static restore(props: <Name>Props): <Name>Entity {
  return new <Name>Entity(props)
}
```

Se o campo usa Value Object:
```typescript
// Na Props: newField: NewValueObject
// No getter: get newField(): NewValueObject { return this.props.newField }
// No create(): newField: NewValueObject.create(props.rawField)
```

---

### Passo 5 — Atualizar o Mapper

Editar `src/modules/<name>/infrastructure/db/mappers/<name>.mapper.ts`:

```typescript
static toDomain(raw: Prisma<Name>): <Name>Entity {
  return <Name>Entity.restore({
    // ... campos existentes
    newField: raw.newField,  // ← adicionar
  })
}

static toPersistence(entity: <Name>Entity): ... {
  return {
    // ... campos existentes
    newField: entity.newField,  // ← adicionar (ou entity.newField.value_ se for VO)
  }
}
```

---

### Passo 6 — Atualizar os DTOs

**`create-<name>.dto.ts`** — só se o campo é definido pelo cliente:
```typescript
@ApiPropertyOptional({ description: '...' })
@IsOptional()
@IsString()
newField?: string
```

**`<name>-response.dto.ts`** — sempre se o campo é retornado:
```typescript
@ApiProperty({ description: '...', nullable: true })
newField: string | null
```

**`update-<name>.dto.ts`** — geralmente herdado via `PartialType(CreateDto)`, sem mudança manual.

---

### Passo 7 — Atualizar o Presenter

Editar `presentation/mappers/<name>.presenter.ts`:

```typescript
static toHTTP(entity: <Name>Entity): <Name>ResponseDto {
  return {
    // ... campos existentes
    newField: entity.newField,  // ← adicionar
  }
}
```

---

### Passo 8 — Atualizar Factories de Teste

Editar `test/modules/<name>/factories/<name>.factory.ts`:

```typescript
export function make<Name>(overrides: Overrides = {}): <Name>Entity {
  return <Name>Entity.create({
    // ... campos existentes
    newField: overrides.newField ?? 'default-value',  // ← adicionar
  })
}
```

Se o campo usa Value Object, a factory recebe o primitivo e cria o VO internamente.

---

### Passo 9 — Verificar Use Cases Afetados

Verificar se algum use case:
1. Precisa receber o novo campo no DTO (se o cliente deve enviá-lo)
2. Precisa filtrar/buscar por ele (novo método no repositório?)
3. Tem lógica de validação relacionada ao novo campo

---

### Passo 10 — Validação Final

```bash
npx tsc --noEmit
```

**Esperado:** 0 erros TypeScript.

Se houver erros:
- `Property 'newField' does not exist` → mapper, entity ou presenter sem o campo
- `Argument of type 'X' is not assignable to 'Y'` → tipo errado no mapper
- `Object literal may only specify known properties` → DTO ou factory com campo extra

```bash
npx jest --config test/jest-unit.json --testPathPattern="<name>"
```

**Esperado:** todos os testes passam (factories agora incluem o novo campo).

---

## Rollback

Se a migration causar problemas:
```bash
npx prisma migrate reset  # CUIDADO: apaga todos os dados em dev
# OU reverter manualmente o schema e criar migration de rollback
```

---

## Quick Reference

| O que mudou | Arquivos a editar |
|---|---|
| Novo campo simples | schema, entity, mapper, response DTO, presenter, factory |
| Novo campo com Value Object | schema, entity (+ novo VO), mapper, create DTO, response DTO, presenter, factory |
| Novo enum | schema (enum + model), mapper (cast de enum), entity (tipo), DTO, factory |
| Remoção de campo | schema, entity, mapper, DTOs, presenter, factory, use cases que o usavam |
| Renome de campo | Idem remoção + adição, em uma migration só |
