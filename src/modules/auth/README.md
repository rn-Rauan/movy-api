# Módulo de Autenticação (Auth Module)

## Visão Geral

O módulo de autenticação é responsável por gerenciar o login, registro e validação de usuários no sistema Movy API. Implementa JWT (JSON Web Tokens) para autenticação stateless, com suporte a refresh tokens para sessões prolongadas.

## Funcionalidades

- **Login**: Autenticação com email e senha
- **Registro**: Criação de novos usuários com auto-login
- **Refresh Token**: Renovação de tokens de acesso
- **JWT Strategy**: Validação de tokens em requests protegidos
- **Guards**: Proteção de rotas com autenticação obrigatória

## Estrutura do Módulo

```
src/modules/auth/
├── README.md                           # Esta documentação
├── auth.module.ts                      # Módulo principal do NestJS
├── application/                        # Camada de Aplicação
│   ├── dtos/                           # Data Transfer Objects
│   │   ├── index.ts                    # Exportações dos DTOs
│   │   ├── login.dto.ts                # DTO para login
│   │   ├── register.dto.ts             # DTO para registro
│   │   └── token-response.dto.ts       # DTO para resposta de tokens
│   └── use-cases/                      # Casos de Uso
│       ├── index.ts                    # Exportações dos use-cases
│       ├── login.use-case.ts           # Caso de uso: Login
│       ├── register.use-case.ts        # Caso de uso: Registro
│       └── refresh-token.use-case.ts   # Caso de uso: Refresh token
├── infrastructure/                     # Camada de Infraestrutura
│   └── jwt.strategy.ts                 # Estratégia JWT para Passport
└── presentation/                       # Camada de Apresentação
    └── controllers/                    # Controladores HTTP
        └── auth.controller.ts          # Controller REST para auth
```

## Endpoints da API

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/auth/login` | Login com email/senha |
| POST | `/auth/register` | Registrar novo usuário |
| POST | `/auth/refresh` | Renovar token de acesso |

## Como Usar

### Protegendo Rotas

Para proteger uma rota com autenticação, use o `JwtAuthGuard`:

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/shared/guards/jwt.guard';

@Controller('protected')
export class ProtectedController {
  @UseGuards(JwtAuthGuard)
  @Get()
  getProtectedData() {
    return { message: 'This is protected' };
  }
}
```

### Acessando Usuário Autenticado

No controller, você pode acessar o usuário autenticado via `@Req()`:

```typescript
import { Req } from '@nestjs/common';

@UseGuards(JwtAuthGuard)
@Get('profile')
getProfile(@Req() req) {
  return req.user; // { userId: string, email: string }
}
```

## Fluxo de Autenticação

1. **Registro**: Usuário se registra → Recebe tokens de acesso e refresh
2. **Login**: Usuário faz login → Recebe novos tokens
3. **Refresh**: Token expirado → Usa refresh token para obter novo access token
4. **Validação**: Requests incluem `Authorization: Bearer <access_token>`

## Tokens

- **Access Token**: Curta duração (1 hora), usado para acessar recursos
- **Refresh Token**: Longa duração (7 dias), usado para renovar access token
- **Secret**: Configurado via `JWT_SECRET` (fallback: 'your-secret-key')

## Segurança

- Senhas hasheadas com bcrypt
- Tokens assinados com HS256
- Validação de usuários ativos (status !== 'INACTIVE')
- Refresh tokens podem ser invalidados (futuro: armazenamento em DB)

## Dependências

- **@nestjs/jwt**: Geração e validação de JWT
- **@nestjs/passport**: Framework de autenticação
- **passport-jwt**: Estratégia JWT para Passport
- **bcrypt**: Hashing de senhas
- **UserModule**: Dependência para operações de usuário

## Próximos Passos

- Armazenar refresh tokens no banco de dados
- Implementar logout (invalidação de tokens)
- Adicionar rate limiting para tentativas de login
- Suporte a OAuth (Google, etc.)
- Documentação Swagger completa