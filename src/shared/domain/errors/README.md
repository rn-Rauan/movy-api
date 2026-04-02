# Estrutura de Erros - Clean Architecture & SOLID

## Visão Geral

Este projeto implementa uma hierarquia de erros seguindo princípios de **Clean Architecture** e **SOLID**, separando erros genéricos (compartilhados) de erros específicos de cada módulo.

## Hierarquia de Erros

```
DomainError (Base)
├── ValidationError (Genérico - shared)
│   ├── InvalidEmailError
│   ├── RequiredFieldError
│   └── StringLengthError
└── [Erros específicos do módulo]
    └── UserValidationError (domain/entities/erros)
        ├── InvalidUserNameError
        ├── InvalidUserTelephoneError
        └── InvalidPasswordError
```

## Estrutura de Diretórios

### shared/errors/
Erros **genéricos** que podem ser reutilizados em múltiplos módulos:

```
shared/
└── errors/
    ├── DomainError.ts          # Classe base abstrata
    ├── ValidationError.ts      # Erros genéricos de validação
    └── index.ts               # Exports
```

### modules/[moduleName]/domain/entities/erros/
Erros **específicos** do módulo:

```
modules/user/domain/entities/
├── classUser.ts              # Entidade
├── UserValidator.ts          # Serviço de validação
├── erros/
│   ├── UserErrors.ts         # Erros específicos do User
│   └── index.ts
└── index.ts
```

## Princípios SOLID Aplicados

### 1. Single Responsibility Principle (SRP)
- **UserValidator**: Responsável APENAS por validações
- **User**: Responsável APENAS por representar dados e chamar validações
- **Erros específicos**: Cada erro tem uma responsabilidade única

### 2. Open/Closed Principle (OCP)
- Fácil adicionar novos erros sem modificar existentes
- Novas validações podem ser adicionadas ao UserValidator sem alterar User
- A hierarquia de erros é extensível

### 3. Liskov Substitution Principle (LSP)
- Todos os erros implementam a interface DomainError
- Podem ser tratados uniformemente em catch blocks

### 4. Interface Segregation Principle (ISP)
- ValidationError segregado com informações específicas (`field`)
- Cada erro expõe apenas dados relevantes

### 5. Dependency Inversion Principle (DIP)
- User depende da abstração `UserValidator`
- UserValidator pode ser injetado (útil para testes)

## Como Usar

### Criando uma Entidade com Validações

```typescript
import { User, UserValidator } from 'src/modules/user/domain/entities';

// Com injeção de dependência (recomendado para testes)
const validator = new UserValidator();
const user = new User({
  id: '123',
  name: 'João Silva',
  email: 'joao@example.com',
  passwordHash: 'hashed_password_123456',
  telephone: '(11) 99999-8888',
  organizationId: null,
  status: 'active',
  createdAt: new Date(),
  updatedAt: new Date(),
}, validator);

// Ou deixar a entidade criar seu próprio validador
const user = new User({ ...props });
```

### Validando Campos Individuais

```typescript
try {
  user.setName('João');
} catch (error) {
  if (error instanceof InvalidUserNameError) {
    console.error('Nome inválido:', error.message);
  }
}
```

### Tratando Erros Genéricos

```typescript
try {
  user.setEmail('invalid-email');
} catch (error) {
  if (error instanceof InvalidEmailError) {
    console.error('Email inválido no campo:', error.field);
    console.error('Código:', error.code);
  }
}
```

### Tratando Qualquer DomainError

```typescript
import { DomainError } from 'src/shared/errors';

try {
  // operações com user
} catch (error) {
  if (error instanceof DomainError) {
    console.error('Erro de domínio:', error.toJSON());
  }
}
```

## Quando Criar Erro em Shared vs Módulo

### ✅ Coloque em `shared/errors/` se:
- O erro pode ocorrer em 2+ módulos diferentes
- É uma validação comum (email, tamanho de string, etc)
- Não é específico de uma entidade

### ✅ Coloque em `modules/[nome]/domain/entities/erros/` se:
- O erro é específico de uma entidade (ex: InvalidUserNameError)
- Nunca será usado por outro módulo
- É parte da lógica de negócio da entidade

## Estrutura de Erros Customizados

### Criando um Novo Erro Genérico (shared)

```typescript
// shared/errors/ValidationError.ts
export class PositiveNumberError extends ValidationError {
  code = 'POSITIVE_NUMBER_REQUIRED';

  constructor(fieldName: string) {
    super(`Field "${fieldName}" must be a positive number`, fieldName);
  }
}
```

### Criando um Novo Erro Específico (módulo)

```typescript
// modules/user/domain/entities/erros/UserErrors.ts
export class UserAlreadyExistsError extends UserValidationError {
  code = 'USER_ALREADY_EXISTS';

  constructor(email: string) {
    super(`User with email "${email}" already exists`);
  }
}
```

## Response HTTP com Erros

As entidades de erro implementam `toJSON()` para fácil serialização em respostas HTTP:

```typescript
catch (error) {
  if (error instanceof DomainError) {
    return res.status(400).json({
      error: error.toJSON(),
      timestamp: new Date().toISOString(),
    });
  }
}
```

Resposta:
```json
{
  "error": {
    "name": "InvalidEmailError",
    "code": "INVALID_EMAIL",
    "message": "Email \"invalid\" is invalid",
    "field": "email"
  },
  "timestamp": "2026-03-25T10:00:00Z"
}
```

## Testing

UserValidator é facilmente testável:

```typescript
describe('UserValidator', () => {
  let validator: UserValidator;

  beforeEach(() => {
    validator = new UserValidator();
  });

  it('should throw InvalidEmailError on invalid email', () => {
    expect(() => validator.validateEmail('invalid')).toThrow(InvalidEmailError);
  });
});
```

## Padrões a Evitar

❌ **Não faça:**
```typescript
// Validações inline na entidade
class User {
  setName(name: string) {
    if (name.length < 3) throw new Error('Invalid'); // Genérico
  }
}

// Erros genéricos demais
throw new Error('Validation error'); // Sem informações úteis
```

✅ **Faça:**
```typescript
// Use serviço de validação
class UserValidator {
  validateName(name: string) {
    if (name.length < 3) {
      throw new StringLengthError('name', 3); // Específico e reutilizável
    }
  }
}
```
