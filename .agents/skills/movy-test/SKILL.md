---
name: movy-test
description: 'Generate unit tests for Movy API use cases. Covers factory creation, mock setup, happy path, error paths, and compensation flows. Zero framework mocks — pure manual injection with jest.fn().'
argument-hint: 'use case or module name (e.g. create-vehicle, trip, enrollment)'
---

# Movy Test — Unit Test Generation

> Procedimento para criar testes unitários no padrão do projeto.
> Conhecimento base: [MOVY_BRAIN.md](../../MOVY_BRAIN.md)

---

## When to Use

- "testa o use case de criar veículo"
- "gera testes pro módulo de trip"
- "cria os testes unitários do enrollment"
- Qualquer pedido de teste unitário de use case

---

## Pre-Flight Checklist

Antes de gerar testes, confirmar:

- [ ] Use case já existe em `src/modules/<module>/application/use-cases/`?
- [ ] Entidade do módulo já tem `create()` e `restore()` estáticos?
- [ ] DTOs existem em `src/modules/<module>/application/dtos/`?
- [ ] Domain errors existem em `src/modules/<module>/domain/errors/`?
- [ ] Repository interface existe em `src/modules/<module>/domain/interfaces/`?

---

## Princípios Invioláveis

1. **ZERO framework** — sem `@nestjs/testing`, sem `Test.createTestingModule`, sem Prisma mock
2. **Injeção manual** — SUT é instanciado com `new UseCase(mockRepo, mockService, ...)` direto no `beforeEach`
3. **AAA rigoroso** — Arrange, Act, Assert em todo `it()`
4. **Factory pattern** — `make<Entity>(overrides)` com overrides opcionais
5. **`setupHappyPath()`** — configura todos os mocks pro cenário feliz; testes de erro sobrescrevem o mock relevante
6. **`sut`** — sempre o nome da variável do use case sob teste
7. **`mocks`** — sempre o nome do objeto com os mocks (retorno de `makeMocks()`)
8. **Value Objects reais** — factories de entidade usam VOs instanciados, não strings
9. **DTO factories** — retornam objetos literais com primitivos

---

## Procedure

### Passo 1 — Ler o Use Case

Antes de qualquer coisa, ler o use case completo. Identificar:

- Dependências injetadas (repositórios, serviços)
- DTO de entrada
- Entidade retornada ou DTO de resposta
- Fluxo do `execute()`: validações → criação → persistência → retorno
- Erros lançados e condições de cada um
- Fluxo de compensação/rollback (se houver)

---

### Passo 2 — Estrutura de Pastas

```
test/modules/<module>/
├── factories/
│   ├── <entity>.factory.ts          ← factory da entidade
│   └── create-<entity>.dto.factory.ts  ← factory do DTO (se necessário)
└── application/
    └── use-cases/
        └── <use-case-name>.spec.ts  ← espelha o path em src/
```

- Se `test/modules/<module>/factories/` já existe com factories, **não duplicar** — reusar
- Se `test/shared/factories/` tem algo relevante (ex: `role.factory.ts`), importar

---

### Passo 3 — Entity Factory

```typescript
// test/modules/<module>/factories/<entity>.factory.ts
import { <Entity> } from 'src/modules/<module>/domain/entities';
import { <ValueObject> } from 'src/modules/<module>/domain/entities/value-objects';

type <Entity>Overrides = Partial<{
  id: string;
  organizationId: string;
  // ... campos primitivos que o caller pode querer sobrescrever
}>;

export function make<Entity>(overrides: <Entity>Overrides = {}): <Entity> {
  return <Entity>.create({
    id: overrides.id ?? '<entity>-id-stub',
    organizationId: overrides.organizationId ?? 'org-id-stub',
    // Value Objects instanciados com valores sensatos
    field: <ValueObject>.create(overrides.field ?? 'default-value'),
    // ...
  });
}
```

**Regras da factory:**
- Função nomeada `make<Entity>` (não `create`, não `build`)
- Overrides recebem **primitivos** (string, number) — a factory cria os VOs internamente
- Valores padrão devem ser válidos (passar na validação dos VOs)
- Se a entidade tem `restore()` com campos extras (ex: `assignedAt`, `removedAt`), a factory decide entre `create()` e `restore()` baseado nos overrides

---

### Passo 4 — DTO Factory (quando necessário)

```typescript
// test/modules/<module>/factories/create-<entity>.dto.factory.ts
import { Create<Entity>Dto } from 'src/modules/<module>/application/dtos';

type Create<Entity>DtoOverrides = Partial<Create<Entity>Dto>;

export function makeCreate<Entity>Dto(
  overrides: Create<Entity>DtoOverrides = {},
): Create<Entity>Dto {
  return {
    field: overrides.field ?? 'default-value',
    // ... todos os campos do DTO com defaults válidos
  };
}
```

- Retorna objeto literal, não instância de classe
- Valores primitivos, sem Value Objects

---

### Passo 5 — Spec File

```typescript
// test/modules/<module>/application/use-cases/<use-case-name>.spec.ts
import { <UseCase> } from 'src/modules/<module>/application/use-cases/<use-case-name>.use-case';
import { <RepositoryInterface> } from 'src/modules/<module>/domain/interfaces/<entity>.repository';
import { <DomainError> } from 'src/modules/<module>/domain/errors';
import { make<Entity> } from 'test/modules/<module>/factories/<entity>.factory';

// ─── Mocks ───────────────────────────────────────────────
function makeMocks() {
  const <entity>Repository = {
    // APENAS os métodos chamados pelo use case
    save: jest.fn(),
    findById: jest.fn(),
    // ...
  } as any as jest.Mocked<<RepositoryInterface>>;

  // Repetir para cada dependência injetada
  return { <entity>Repository };
}

// ─── Happy Path Setup ────────────────────────────────────
function setupHappyPath(mocks: ReturnType<typeof makeMocks>) {
  const entity = make<Entity>();

  // Configurar cada mock pro cenário feliz
  mocks.<entity>Repository.findById.mockResolvedValue(null); // ex: não existe duplicata
  mocks.<entity>Repository.save.mockResolvedValue(entity);

  return { entity };
}

// ─── Tests ───────────────────────────────────────────────
describe('<UseCase>', () => {
  let sut: <UseCase>;
  let mocks: ReturnType<typeof makeMocks>;

  beforeEach(() => {
    mocks = makeMocks();
    sut = new <UseCase>(mocks.<entity>Repository);
  });

  describe('happy path', () => {
    it('should <ação principal> and return <resultado>', async () => {
      const { entity } = setupHappyPath(mocks);
      const dto = makeCreate<Entity>Dto();

      const result = await sut.execute(dto, { organizationId: 'org-id-stub' });

      expect(result).toBeDefined();
      expect(mocks.<entity>Repository.save).toHaveBeenCalledTimes(1);
    });

    it('should call dependencies in correct order with correct args', async () => {
      setupHappyPath(mocks);
      const dto = makeCreate<Entity>Dto();

      await sut.execute(dto, { organizationId: 'org-id-stub' });

      // Verificar args de cada chamada
      expect(mocks.<entity>Repository.save).toHaveBeenCalledWith(
        expect.objectContaining({ /* props relevantes */ }),
      );
    });
  });

  describe('error — <condição de erro>', () => {
    it('should throw <DomainError> when <condição>', async () => {
      setupHappyPath(mocks);
      // Sobrescrever apenas o mock que causa o erro
      mocks.<entity>Repository.findById.mockResolvedValue(make<Entity>());
      const dto = makeCreate<Entity>Dto();

      await expect(
        sut.execute(dto, { organizationId: 'org-id-stub' }),
      ).rejects.toThrow(<DomainError>);
    });

    it('should NOT call <step posterior> when <condição de erro>', async () => {
      setupHappyPath(mocks);
      mocks.<entity>Repository.findById.mockResolvedValue(make<Entity>());
      const dto = makeCreate<Entity>Dto();

      await expect(
        sut.execute(dto, { organizationId: 'org-id-stub' }),
      ).rejects.toThrow(<DomainError>);

      expect(mocks.<entity>Repository.save).not.toHaveBeenCalled();
    });
  });
});
```

---

### Passo 6 — Cenários Obrigatórios

Para **qualquer** use case, cobrir no mínimo:

#### Create Use Cases
- [ ] Happy path: cria e retorna entidade
- [ ] Verifica ordem de chamadas e argumentos
- [ ] Duplicata encontrada → lança `AlreadyExistsError`
- [ ] Save retorna null → lança erro (se tratado)
- [ ] Steps posteriores NÃO executam após erro

#### Find Use Cases
- [ ] Happy path: encontra e retorna
- [ ] Não encontrado → lança `NotFoundError`
- [ ] Se multi-tenant: verifica que `organizationId` é passado na query

#### Update Use Cases
- [ ] Happy path: encontra, atualiza, retorna
- [ ] Não encontrado → lança `NotFoundError`
- [ ] Duplicata em campo unique → lança `AlreadyExistsError`

#### Delete/Remove Use Cases
- [ ] Happy path: encontra e deleta/desativa
- [ ] Não encontrado → lança `NotFoundError`

#### Orchestration Use Cases (ex: RegisterOrganizationWithAdmin)
- [ ] Happy path com toda a cadeia
- [ ] Cada falha intermediária → verifica compensação/rollback
- [ ] Verifica que cleanup acontece ANTES do rethrow

---

### Passo 7 — Describe Structure

```typescript
describe('UseCaseName', () => {
  // setup

  describe('happy path — <contexto>', () => {
    it('should <ação> and return <resultado>', ...);
    it('should call <dep> with correct args', ...);
  });

  describe('restore — <contexto>', () => {     // só se aplicável (soft delete)
    it('should restore when <condição>', ...);
  });

  describe('compensation — <contexto>', () => { // só para orquestradores
    it('should rollback <recurso> when <falha>', ...);
  });

  describe('error — <descrição do erro>', () => {
    it('should throw <Error> when <condição>', ...);
    it('should NOT call <step> when <condição>', ...);
  });
});
```

---

### Passo 8 — Validação Final

```bash
npx jest --config test/jest-unit.json --testPathPattern="<module>"
```

Checklist:

- [ ] Todos os testes passam
- [ ] Nenhum import de `@nestjs/testing`
- [ ] Nenhum import de Prisma nos testes
- [ ] SUT instanciado com `new` no `beforeEach`
- [ ] `setupHappyPath()` existe e é reutilizado
- [ ] Factories usam Value Objects reais (não strings raw)
- [ ] DTO factories retornam objetos literais
- [ ] Cada `describe('error — ...')` verifica tanto o throw quanto o side-effect não executado
- [ ] Mocks usam cast `as any as jest.Mocked<T>`

---

## Quick Reference

| O que fazer | Onde fica |
|-------------|-----------|
| Factories existentes | `test/modules/<module>/factories/` |
| Shared factories | `test/shared/factories/` (ex: `role.factory.ts`) |
| Jest config unit | `test/jest-unit.json` |
| Jest config e2e | `test/jest-e2e.json` |
| Path mapping | `src/*` → `<rootDir>/src/*` (no jest e tsconfig) |
| Rodar testes de um módulo | `npx jest --config test/jest-unit.json --testPathPattern="<module>"` |
| Rodar um spec específico | `npx jest --config test/jest-unit.json <path-to-spec>` |

---

## Anti-Patterns — NÃO fazer

- **`Test.createTestingModule()`** — proibido em unit tests
- **`jest.mock('module')`** — preferir injeção manual via construtor
- **Mocks com implementação completa** — só mockar os métodos que o use case chama
- **Strings raw no lugar de Value Objects** — factory de entidade DEVE usar VOs
- **`beforeAll` para setup de mocks** — usar `beforeEach` sempre (isolamento)
- **Testar implementação interna da entidade** — testes são do use case, não da entity
- **Snapshot tests** — não usamos
