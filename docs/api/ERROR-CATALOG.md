# Catálogo de Erros — Movy API

> Referência consolidada dos **erros de domínio** (`DomainError`) e do status HTTP que cada
> um produz. Fonte de verdade do mecanismo: [`AllExceptionsFilter`](../../src/shared/presentation/exceptions/all-exceptions.filter.ts)
> e a base [`DomainError`](../../src/shared/domain/errors/domain.error.ts).

## Como o status HTTP é derivado

Todo erro de domínio estende `DomainError` e expõe um `code` string. O filtro global
`AllExceptionsFilter` infere o status HTTP a partir do **sufixo/prefixo do `code`**, nesta
ordem de precedência:

| Regra no `code` | HTTP |
|---|---|
| termina em `_NOT_FOUND` | `404 Not Found` |
| termina em `_ALREADY_EXISTS`, `_CONFLICT` ou `_IN_USE` | `409 Conflict` |
| começa com `INVALID_`/`INACTIVE_`/`EXPIRED_` **ou** termina em `_BAD_REQUEST`/`_INACTIVE` | `400 Bad Request` |
| termina em `_FORBIDDEN` | `403 Forbidden` |
| termina em `_UNAUTHORIZED` | `401 Unauthorized` |
| **nenhuma das anteriores** (ex.: `_CREATION_FAILED`) | `500 Internal Server Error` |

Forma da resposta de erro (sempre):

```json
{
  "statusCode": 409,
  "timestamp": "2026-06-22T12:00:00.000Z",
  "path": "/organizations/:id/drivers",
  "message": "Mensagem legível do erro",
  "error": "DRIVER_CNH_ALREADY_EXISTS"
}
```

O campo `error` é o `code` do erro de domínio — clientes devem programar contra ele, não
contra a `message` (que é livre).

---

## Erros 500 intencionais

Os erros de **falha de persistência** retornam **500 deliberadamente**
(`DRIVER_CREATION_FAILED`, `DRIVER_UPDATE_FAILED`, `VEHICLE_CREATION_FAILED`,
`VEHICLE_UPDATE_FAILED`, `TRIP_TEMPLATE_CREATION_FAILED`) — representam um erro interno
inesperado ao salvar, não um erro do cliente.

> **Histórico:** anteriormente os sufixos `_CONFLICT`/`_IN_USE` e os estados
> `INACTIVE_`/`_INACTIVE`/`EXPIRED_` não eram tratados pelo filtro e caíam para 500. O filtro
> foi corrigido para mapeá-los a 409/400, eliminando a divergência entre o JSDoc e o
> comportamento em execução.

---

## Catálogo por módulo

> Status na coluna **HTTP** é o **comportamento real atual** do `AllExceptionsFilter`.

### auth

| Código | HTTP | Quando |
|---|---|---|
| `CREDENTIALS_UNAUTHORIZED` | 401 | Email/senha inválidos no login |
| `REFRESH_TOKEN_UNAUTHORIZED` | 401 | Refresh token inválido/expirado/revogado |
| `ACCOUNT_INACTIVE_UNAUTHORIZED` | 401 | Conta desativada tenta autenticar |
| `INVALID_OR_EXPIRED_VERIFICATION_TOKEN_BAD_REQUEST` | 400 | Token de verificação de email inválido |
| `INVALID_OR_EXPIRED_RESET_TOKEN_BAD_REQUEST` | 400 | Token de reset de senha inválido |

### user

| Código | HTTP | Quando |
|---|---|---|
| `USER_NOT_FOUND` | 404 | Usuário inexistente |
| `USER_EMAIL_ALREADY_EXISTS` | 409 | Email já cadastrado |
| `INACTIVE_USER` | 400 | Operação sobre usuário já inativo |
| `INVALID_USER_NAME` | 400 | Nome inválido (value object) |
| `INVALID_USER_TELEPHONE` | 400 | Telefone inválido (value object) |
| `INVALID_PASSWORD` | 400 | Senha fora das regras |

### organization

| Código | HTTP | Quando |
|---|---|---|
| `ORGANIZATION_NOT_FOUND` | 404 | Organização inexistente |
| `ORGANIZATION_ALREADY_EXISTS` | 409 | CNPJ já cadastrado |
| `ORGANIZATION_EMAIL_ALREADY_EXISTS` | 409 | Email da org já cadastrado |
| `ORGANIZATION_SLUG_ALREADY_EXISTS` | 409 | Slug já em uso |
| `ORGANIZATION_ACCESS_FORBIDDEN` | 403 | Acesso cross-tenant negado |
| `INACTIVE_ORGANIZATION` | 400 | Operação sobre org inativa |
| `INVALID_ORGANIZATION_NAME` | 400 | Nome inválido |
| `INVALID_CNPJ` | 400 | CNPJ inválido (value object) |
| `INVALID_SLUG` | 400 | Slug inválido |
| `INVALID_ADDRESS` | 400 | Endereço inválido |

### membership

| Código | HTTP | Quando |
|---|---|---|
| `MEMBERSHIP_NOT_FOUND` | 404 | Vínculo inexistente |
| `MEMBERSHIP_ALREADY_EXISTS` | 409 | Vínculo usuário↔org já existe |
| `USER_FOR_MEMBERSHIP_NOT_FOUND` | 404 | Usuário do vínculo não encontrado |
| `MEMBERSHIP_MISSING_IDENTIFIER_BAD_REQUEST` | 400 | Identificador ausente na requisição |

### driver

| Código | HTTP | Quando |
|---|---|---|
| `DRIVER_PROFILE_NOT_FOUND` | 404 | Perfil de motorista inexistente |
| `DRIVER_PROFILE_NOT_FOUND_BAD_REQUEST` | 400 | Perfil ausente em contexto de requisição |
| `DRIVER_NOT_FOUND_BAD_REQUEST` | 400 | Motorista não encontrado (validação) |
| `DRIVER_NOT_FOUND_FOR_MEMBERSHIP_BAD_REQUEST` | 400 | Motorista não vinculado |
| `DRIVER_CNH_ALREADY_EXISTS` | 409 | CNH já cadastrada |
| `DRIVER_ALREADY_EXISTS_CONFLICT` | 409 | Motorista já existe |
| `DRIVER_ACCESS_FORBIDDEN` | 403 | Acesso cross-tenant negado |
| `DRIVER_INACTIVE_FORBIDDEN` | 403 | Motorista inativo |
| `DRIVER_PLAN_LIMIT_FORBIDDEN` | 403 | Limite de motoristas do plano atingido |
| `DRIVER_TRIP_STATUS_TRANSITION_FORBIDDEN` | 403 | Transição de status não permitida ao motorista |
| `EXPIRED_CNH` | 400 | CNH expirada |
| `INVALID_CNH` | 400 | CNH inválida (value object) |
| `INVALID_CNH_EXPIRATION` | 400 | Validade de CNH inválida |
| `INVALID_CNH_CATEGORIES_BAD_REQUEST` | 400 | Categorias de CNH inválidas |
| `INVALID_PARTIAL_CNH_UPDATE_BAD_REQUEST` | 400 | Update parcial de CNH inválido |
| `INVALID_DRIVER_STATUS` | 400 | Status de motorista inválido |
| `DRIVER_CREATION_FAILED` | 500 | Falha de persistência (intencional) |
| `DRIVER_UPDATE_FAILED` | 500 | Falha de persistência (intencional) |

### vehicle

| Código | HTTP | Quando |
|---|---|---|
| `VEHICLE_NOT_FOUND` | 404 | Veículo inexistente |
| `PLATE_ALREADY_IN_USE` | 409 | Placa já em uso |
| `VEHICLE_ACCESS_FORBIDDEN` | 403 | Acesso cross-tenant negado |
| `VEHICLE_PLAN_LIMIT_FORBIDDEN` | 403 | Limite de veículos do plano atingido |
| `VEHICLE_INACTIVE` | 400 | Update de veículo inativo |
| `INVALID_PLATE` | 400 | Placa inválida (value object) |
| `INVALID_MAX_CAPACITY` | 400 | Capacidade inválida |
| `VEHICLE_CREATION_FAILED` | 500 | Falha de persistência (intencional) |
| `VEHICLE_UPDATE_FAILED` | 500 | Falha de persistência (intencional) |

### trip (templates + instâncias)

| Código | HTTP | Quando |
|---|---|---|
| `TRIP_TEMPLATE_NOT_FOUND` | 404 | Template inexistente |
| `TRIP_INSTANCE_NOT_FOUND` | 404 | Instância inexistente |
| `TRIP_TEMPLATE_ACCESS_FORBIDDEN` | 403 | Acesso cross-tenant ao template |
| `TRIP_INSTANCE_ACCESS_FORBIDDEN` | 403 | Acesso cross-tenant à instância |
| `TRIP_NOT_ASSIGNED_TO_DRIVER_FORBIDDEN` | 403 | Motorista não é o responsável |
| `TRIP_TEMPLATE_INACTIVE` | 400 | Template inativo |
| `MONTHLY_TRIP_PLAN_LIMIT_FORBIDDEN` | 403 | Limite mensal de viagens do plano atingido |
| `TRIP_TEMPLATE_NOT_RECURRING_BAD_REQUEST` | 400 | Geração manual em template não-recorrente |
| `TRIP_INSTANCE_STATUS_TRANSITION_BAD_REQUEST` | 400 | Transição de status inválida |
| `TRIP_INSTANCE_CAPACITY_BAD_REQUEST` | 400 | Capacidade inválida na instância |
| `TRIP_INSTANCE_TIMES_BAD_REQUEST` | 400 | Horários inconsistentes |
| `TRIP_INSTANCE_REQUIRED_FIELD_BAD_REQUEST` | 400 | Campo obrigatório ausente |
| `TRIP_INSTANCE_AUTO_CANCEL_BAD_REQUEST` | 400 | Estado inválido para auto-cancelamento |
| `INVALID_TRIP_FREQUENCY` | 400 | Frequência inválida |
| `INVALID_TRIP_ROUTE_POINTS` | 400 | Pontos de rota inválidos |
| `INVALID_TRIP_STOPS` | 400 | Paradas inválidas |
| `INVALID_TRIP_TIME_OF_DAY_FORMAT` | 400 | Formato de hora inválido |
| `INVALID_TRIP_TIME_OF_DAY_ORDER` | 400 | Ordem de horários inválida |
| `INVALID_TRIP_PRICE_CONFIGURATION` | 400 | Configuração de preço inválida |
| `INVALID_TRIP_AUTO_CANCEL_CONFIGURATION` | 400 | Configuração de auto-cancelamento inválida |
| `INVALID_TRIP_TEMPLATE_DEFAULT_CAPACITY` | 400 | Capacidade padrão inválida |
| `INVALID_TRIP_TEMPLATE_MISSING_CAPACITY` | 400 | Capacidade ausente |
| `INVALID_TRIP_TEMPLATE_MISSING_SCHEDULE` | 400 | Agenda ausente |
| `TRIP_TEMPLATE_CREATION_FAILED` | 500 | Falha de persistência (intencional) |
| `TRIP_INSTANCE_CREATION_FAILED_BAD_REQUEST` | 400 | Falha de criação de instância (validação) |

### scheduling

| Código | HTTP | Quando |
|---|---|---|
| `TRIP_SCHEDULING_CONFIG_NOT_FOUND` | 404 | Config de agendamento inexistente |
| `INVALID_SCHEDULING_DAYS_AHEAD` | 400 | Janela de dias à frente inválida |

### bookings

| Código | HTTP | Quando |
|---|---|---|
| `BOOKING_NOT_FOUND` | 404 | Reserva inexistente |
| `BOOKING_ALREADY_EXISTS_CONFLICT` | 409 | Reserva duplicada |
| `BOOKING_TRIP_INSTANCE_FULL_CONFLICT` | 409 | Instância sem vagas |
| `BOOKING_ACCESS_FORBIDDEN` | 403 | Acesso cross-tenant à reserva |
| `BOOKING_ALREADY_INACTIVE_BAD_REQUEST` | 400 | Reserva já cancelada |
| `BOOKING_CANCEL_WINDOW_CLOSED_BAD_REQUEST` | 400 | Fora da janela de cancelamento |
| `BOOKING_CREATION_FAILED_BAD_REQUEST` | 400 | Falha de criação (validação) |
| `BOOKING_PRICE_NOT_AVAILABLE_BAD_REQUEST` | 400 | Preço indisponível para a instância |
| `BOOKING_STOP_BAD_REQUEST` | 400 | Parada inválida |
| `BOOKING_TRIP_INSTANCE_NOT_BOOKABLE_BAD_REQUEST` | 400 | Instância não reservável (status) |
| `BOOKING_TRIP_TERMINAL_BAD_REQUEST` | 400 | Viagem em estado terminal |

### plans

| Código | HTTP | Quando |
|---|---|---|
| `PLAN_NOT_FOUND` | 404 | Plano inexistente |
| `PLAN_ALREADY_EXISTS` | 409 | Plano com mesmo nome já existe |
| `PLAN_CREATION_FAILED_BAD_REQUEST` | 400 | Falha de criação (validação) |

### subscriptions

| Código | HTTP | Quando |
|---|---|---|
| `SUBSCRIPTION_NOT_FOUND` | 404 | Assinatura inexistente |
| `SUBSCRIPTION_ALREADY_EXISTS` | 409 | Assinatura ativa já existe |
| `SUBSCRIPTION_ACCESS_FORBIDDEN` | 403 | Acesso cross-tenant |
| `NO_ACTIVE_SUBSCRIPTION_FORBIDDEN` | 403 | Org sem assinatura ativa |
| `SUBSCRIPTION_NOT_ACTIVE_BAD_REQUEST` | 400 | Assinatura não ativa |
| `SUBSCRIPTION_CREATION_FAILED_BAD_REQUEST` | 400 | Falha de criação (validação) |

### payment

| Código | HTTP | Quando |
|---|---|---|
| `PAYMENT_NOT_FOUND` | 404 | Pagamento inexistente |
| `PAYMENT_NOT_ASSIGNED_TO_DRIVER_FORBIDDEN` | 403 | Pagamento não pertence ao motorista |
| `PAYMENT_ALREADY_PROCESSED_BAD_REQUEST` | 400 | Pagamento já confirmado/falhado (só `PENDING` processa) |
| `PAYMENT_CREATION_FAILED_BAD_REQUEST` | 400 | Falha de criação (validação) |

---

## Erros de validação de borda (não-domínio)

Erros de `class-validator` nos DTOs são lançados como `BadRequestException` (NestJS) antes de
chegar aos casos de uso, retornando **400** com a lista de violações em `message`. Não usam
`code` de domínio. O rate limiting (`@nestjs/throttler`, 60 req/min/IP) retorna **429**.
