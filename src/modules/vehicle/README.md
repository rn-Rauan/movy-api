# Módulo de Veículo (Vehicle Module)

## Visão Geral

O módulo de veículo é responsável por gerenciar a frota de veículos vinculados a uma organização na Movy API. Cada veículo pertence exclusivamente a uma organização e pode ser associado a instâncias de viagem. Implementa Clean Architecture com separação clara entre domínio, aplicação, infraestrutura e apresentação.

## Estrutura do Módulo

```
src/modules/vehicle/
├── README.md                                          # Esta documentação
├── vehicle.module.ts                                  # Módulo principal do NestJS
├── application/                                       # Camada de Aplicação
│   ├── dtos/                                          # Data Transfer Objects
│   │   ├── create-vehicle.dto.ts                      # DTO para criação de veículo
│   │   ├── update-vehicle.dto.ts                      # DTO para atualização de veículo
│   │   ├── vehicle-response.dto.ts                    # DTO para resposta
│   │   └── index.ts                                   # Barrel exports
│   └── use-cases/                                     # Casos de Uso
│       ├── create-vehicle.use-case.ts                 # Caso de uso: Criar veículo
│       ├── find-vehicle-by-id.use-case.ts             # Caso de uso: Buscar por ID
│       ├── find-all-vehicles-by-organization.use-case.ts # Caso de uso: Listar por org
│       ├── update-vehicle.use-case.ts                 # Caso de uso: Atualizar veículo
│       ├── remove-vehicle.use-case.ts                 # Caso de uso: Soft delete
│       └── index.ts                                   # Barrel exports
├── domain/                                            # Camada de Domínio
│   ├── entities/                                      # Entidades de Domínio
│   │   ├── vehicle.entity.ts                          # Entidade Vehicle
│   │   ├── index.ts                                   # Barrel exports
│   │   ├── errors/
│   │   │   ├── vehicle.errors.ts                      # Erros de domínio
│   │   │   └── index.ts                               # Barrel exports
│   │   └── value-objects/
│   │       ├── plate.value-object.ts                  # Value Object: Placa
│   │       └── index.ts                               # Barrel exports
│   └── interfaces/                                    # Interfaces de Domínio
│       ├── vehicle.repository.ts                      # Interface do repositório
│       ├── index.ts                                   # Barrel exports
│       └── enums/
│           ├── vehicle-status.enum.ts                 # Enum: VehicleStatus
│           └── vehicle-type.enum.ts                   # Enum: VehicleType
├── infrastructure/                                    # Camada de Infraestrutura
│   └── db/
│       ├── mappers/
│       │   └── vehicle.mapper.ts                      # Mapper (Domínio ↔ Prisma)
│       └── repositories/
│           └── prisma-vehicle.repository.ts           # Implementação Prisma
└── presentation/                                      # Camada de Apresentação
    ├── controllers/
    │   └── vehicle.controller.ts                      # Controller REST
    └── mappers/
        └── vehicle.presenter.ts                       # Presenter HTTP
```

## Modelo de Dados (Schema Prisma)

```prisma
model Vehicle {
  id             String         @id @default(uuid())
  plate          String         @unique @db.VarChar(10)
  model          String         @db.VarChar(255)
  type           VehicleType
  maxCapacity    Int
  status         Status         @default(ACTIVE)
  organizationId String
  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt

  organization   Organization   @relation("VehicleOrganization", fields: [organizationId], references: [id], onDelete: Cascade)
  tripInstances  TripInstance[] @relation("TripVehicle")

  @@index([organizationId])
  @@index([status])
  @@map("vehicle")
}
```

### Campos da Entidade Vehicle

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | UUID | Identificador único gerado automaticamente |
| `plate` | string (7 chars) | Placa do veículo — formato antigo (`ABC1234`) ou Mercosul (`ABC1D23`) |
| `model` | string | Modelo do veículo (ex: "Sprinter 415") |
| `type` | `VehicleType` | Tipo do veículo: `VAN`, `BUS`, `MINIBUS`, `CAR` |
| `maxCapacity` | int | Capacidade máxima de passageiros (inteiro positivo) |
| `status` | `VehicleStatus` | `ACTIVE` (disponível) ou `INACTIVE` (soft-deleted) |
| `organizationId` | UUID | FK para a organização dona do veículo |
| `createdAt` | DateTime | Data de criação |
| `updatedAt` | DateTime | Data da última atualização |

### Enums

**VehicleType**
- `VAN` — Van
- `BUS` — Ônibus
- `MINIBUS` — Micro-ônibus
- `CAR` — Carro

**VehicleStatus**
- `ACTIVE` — Veículo disponível para uso
- `INACTIVE` — Veículo desativado (soft delete)

## Value Objects

### `Plate`

Encapsula a validação da placa brasileira. Aceita dois formatos:

- **Formato antigo**: `ABC1234` — 3 letras + 4 números
- **Formato Mercosul**: `ABC1D23` — 3 letras + número + letra + 2 números

O valor é sempre normalizado para maiúsculas e sem hífens na persistência.

```typescript
// Criação com validação
const plate = Plate.create('ABC-1234');  // normaliza para "ABC1234"

// Restauração desde a persistência (sem validação)
const plate = Plate.restore('ABC1D23');

// Acesso ao valor
plate.value_  // "ABC1234"
plate.equals(other)  // comparação por valor
plate.toString()  // representação string
```

## Regras de Negócio

1. **Placa única**: a placa de um veículo deve ser única no sistema. `PlateAlreadyInUseError` é lançado ao tentar cadastrar ou atualizar para uma placa já existente.
2. **Capacidade positiva**: `maxCapacity` deve ser um inteiro maior que zero. `InvalidMaxCapacityError` é lançado na violação.
3. **Soft delete via status**: `RemoveVehicleUseCase` define `status = INACTIVE` — o registro não é excluído fisicamente.
4. **Proteção de inativo**: veículos com `status = INACTIVE` não podem ser atualizados. `VehicleInactiveError` é lançado.
5. **Isolamento de tenant**: operações de leitura, atualização e remoção por ID verificam se o veículo pertence à organização do JWT. `VehicleAccessForbiddenError` é lançado em caso de violação (OWASP A01).

## Erros de Domínio

| Classe | `code` | Causa |
|---|---|---|
| `InvalidPlateError` | `INVALID_PLATE` | Placa com formato inválido |
| `PlateAlreadyInUseError` | `PLATE_ALREADY_IN_USE` | Placa já cadastrada no sistema |
| `VehicleNotFoundError` | `VEHICLE_NOT_FOUND` | Veículo não encontrado pelo ID |
| `VehicleAccessForbiddenError` | `VEHICLE_ACCESS_FORBIDDEN` | Veículo pertence a outra organização |
| `VehicleInactiveError` | `VEHICLE_INACTIVE` | Tentativa de atualizar veículo inativo |
| `InvalidMaxCapacityError` | `INVALID_MAX_CAPACITY` | Capacidade máxima inválida |
| `VehicleCreationFailedError` | `VEHICLE_CREATION_FAILED` | Falha na persistência ao criar |
| `VehicleUpdateFailedError` | `VEHICLE_UPDATE_FAILED` | Falha na persistência ao atualizar |

## Casos de Uso

### `CreateVehicleUseCase`
Registra um novo veículo para uma organização.
- Valida unicidade da placa antes de criar
- Lança `PlateAlreadyInUseError` se a placa já estiver em uso
- Lança `VehicleCreationFailedError` em falha de persistência

### `FindVehicleByIdUseCase`
Busca um veículo pelo ID, validando ownership da organização.
- Lança `VehicleNotFoundError` se não existir
- Lança `VehicleAccessForbiddenError` se pertencer a outra org

### `FindAllVehiclesByOrganizationUseCase`
Lista todos os veículos de uma organização com paginação.
- Parâmetros: `organizationId`, `{ page, limit }`
- Retorna `PaginatedResponse<VehicleEntity>`

### `UpdateVehicleUseCase`
Atualiza campos de um veículo existente (todos opcionais).
- Verifica ownership da organização
- Bloqueia atualização se o veículo estiver `INACTIVE`
- Verifica unicidade da nova placa (ignora o próprio veículo)
- Campos atualizáveis: `plate`, `model`, `type`, `maxCapacity`, `status`

### `RemoveVehicleUseCase`
Soft delete: define `status = INACTIVE` no veículo.
- Verifica ownership da organização
- Não remove o registro fisicamente

## Endpoints da API

Todos os endpoints exigem `JwtAuthGuard`. Operações administrativas exigem adicionalmente `RolesGuard` + `TenantFilterGuard` com role `ADMIN`.

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/vehicles/organization/:organizationId` | Registrar novo veículo |
| `GET` | `/vehicles/organization/:organizationId` | Listar veículos da organização (paginado) |
| `GET` | `/vehicles/:id` | Buscar veículo por ID |
| `PUT` | `/vehicles/:id` | Atualizar veículo |
| `DELETE` | `/vehicles/:id` | Desativar veículo (soft delete) |

### Parâmetros de Paginação

`GET /vehicles/organization/:organizationId?page=1&limit=10`

## Segurança

- **Autenticação**: JWT obrigatório em todas as rotas (`JwtAuthGuard`)
- **Autorização**: role `ADMIN` obrigatória para todas as operações
- **Isolamento de tenant**: `TenantFilterGuard` valida que o `organizationId` no param bate com o JWT nas rotas que o expõem. Nas rotas `/:id`, a verificação é feita nos use cases via comparação direta com `context.organizationId`

## Dependências

- **NestJS** — Framework
- **Prisma ORM** — Acesso ao PostgreSQL
- **class-validator / class-transformer** — Validação e transformação de DTOs
- **@nestjs/swagger** — Documentação OpenAPI

---

**Última atualização**: Abril 2026
**Versão**: 1.0.0
