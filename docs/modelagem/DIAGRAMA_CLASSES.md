# Diagrama de Classes — Modelo de Domínio (Movy API)

Modelo de domínio extraído das **entidades de domínio** (`src/modules/<módulo>/domain/entities/`)
e dos **Value Objects**. Reflete o estado do código em **04 Jun 2026**.

Para legibilidade em documento impresso/LaTeX, o modelo é apresentado em **um mapa panorâmico**
(Fig. 1, só entidades e relações) seguido de **figuras de detalhe por contexto delimitado**
(Figs. 2–7, com atributos, métodos e Value Objects). O **DER relacional** (tabelas/colunas) é
gerado à parte pelo Prisma e não é duplicado aqui.

> **Convenções.** Métodos estáticos `create()`/`restore()` seguem o padrão Factory/DDD: `create`
> valida invariantes; `restore` reidrata da persistência sem validar. Value Objects são imutáveis
> e expõem o valor via getter `value_` (exceto `CnhCategories`, que expõe `values`). `$` marca
> método estático. Por concisão, listam-se apenas os métodos de comportamento mais relevantes.

---

## Fig. 1 — Mapa geral de entidades

Visão panorâmica: caixas sem atributos, apenas as associações e multiplicidades. Os detalhes de
cada grupo estão nas figuras seguintes.

```mermaid
classDiagram
    direction LR

    class User
    class Organization
    class Role
    class Membership
    class DriverEntity
    class VehicleEntity
    class TripTemplate
    class TripInstance
    class TripSchedulingConfig
    class Booking
    class PaymentEntity
    class PlanEntity
    class SubscriptionEntity
    class PasswordResetToken
    class EmailVerificationToken

    User "1" -- "0..1" DriverEntity : perfil
    User "1" -- "0..*" Membership
    Organization "1" -- "0..*" Membership
    Role "1" -- "0..*" Membership
    User "1" -- "0..*" PasswordResetToken
    User "1" -- "0..*" EmailVerificationToken

    Organization "1" -- "0..*" VehicleEntity
    Organization "1" -- "0..*" TripTemplate
    Organization "1" -- "0..*" TripInstance
    Organization "1" -- "0..1" TripSchedulingConfig
    TripTemplate "1" -- "0..*" TripInstance : gera
    DriverEntity "0..1" -- "0..*" TripInstance : atribuído
    VehicleEntity "0..1" -- "0..*" TripInstance : atribuído

    TripInstance "1" -- "0..*" Booking
    User "1" -- "0..*" Booking : passageiro
    Booking "1" -- "0..1" PaymentEntity
    Organization "1" -- "0..*" PaymentEntity

    Organization "1" -- "0..*" SubscriptionEntity
    PlanEntity "1" -- "0..*" SubscriptionEntity
```

---

## Fig. 2 — Contexto: Usuário & Autenticação

```mermaid
classDiagram
    direction TB

    class User {
        +string id
        +UserName name
        +Email email
        +PasswordHash passwordHash
        +Telephone telephone
        +Status status
        +Date emailVerifiedAt
        +create(props)$ User
        +restore(props)$ User
        +markEmailVerified()
        +setStatus(status)
    }
    class PasswordResetToken {
        +string id
        +string userId
        +string tokenHash
        +Date expiresAt
        +Date usedAt
        +create(userId)$ PasswordResetToken
        +isValid() bool
        +markUsed()
    }
    class EmailVerificationToken {
        +string id
        +string userId
        +string tokenHash
        +Date expiresAt
        +Date usedAt
        +create(userId)$ EmailVerificationToken
        +isValid() bool
        +markUsed()
    }
    class UserName {
        +create(v)$ UserName
        +value_ string
    }
    class PasswordHash {
        +create(v)$ PasswordHash
        +value_ string
    }
    class Email {
        +create(v)$ Email
        +value_ string
    }
    class Telephone {
        +create(v)$ Telephone
        +value_ string
    }
    class Status {
        <<enumeration>>
        ACTIVE
        INACTIVE
    }

    User *-- UserName
    User *-- PasswordHash
    User *-- Email
    User *-- Telephone
    User --> Status
    User "1" -- "0..*" PasswordResetToken
    User "1" -- "0..*" EmailVerificationToken
```

> Tokens de reset de senha (TTL 1h) e verificação de e-mail (TTL 24h) compartilham o mesmo modelo:
> apenas o **hash SHA-256** é persistido; o token bruto (`rawToken`) só existe em memória logo após
> `create()`.

---

## Fig. 3 — Contexto: Organização, Associação & RBAC

```mermaid
classDiagram
    direction TB

    class Organization {
        +string id
        +OrganizationName name
        +Cnpj cnpj
        +Email email
        +Telephone telephone
        +Slug slug
        +Address address
        +Status status
        +create(props)$ Organization
        +restore(props)$ Organization
        +setStatus(status)
    }
    class Membership {
        +string userId
        +int roleId
        +string organizationId
        +Date assignedAt
        +Date removedAt
        +create(props)$ Membership
        +remove()
        +restoreMembership()
    }
    class Role {
        +int id
        +RoleName name
        +create(props)$ Role
    }
    class OrganizationName {
        +create(v)$ OrganizationName
        +value_ string
    }
    class Cnpj {
        +create(v)$ Cnpj
        +value_ string
    }
    class Slug {
        +create(v)$ Slug
        +value_ string
    }
    class Address {
        +create(v)$ Address
        +value_ string
    }
    class RoleName {
        <<enumeration>>
        ADMIN
        DRIVER
    }

    Organization *-- OrganizationName
    Organization *-- Cnpj
    Organization *-- Slug
    Organization *-- Address
    Role --> RoleName
    Organization "1" -- "0..*" Membership
    Role "1" -- "0..*" Membership
```

> `Membership` é a tabela-pivô que materializa o N:N entre `User` e `Organization`, carregando o
> `Role` — fonte de verdade do RBAC. Chave composta `(userId, roleId, organizationId)`; soft delete
> via `removedAt`. `Organization` também usa os VOs compartilhados `Email`/`Telephone` (Fig. 2).

---

## Fig. 4 — Contexto: Frota (Motorista & Veículo)

```mermaid
classDiagram
    direction TB

    class DriverEntity {
        +string id
        +string userId
        +Cnh cnh
        +CnhCategories cnhCategories
        +Date cnhExpiresAt
        +DriverStatus driverStatus
        +create(props)$ DriverEntity
        +restore(props)$ DriverEntity
        +activate()
        +deactivate()
        +suspend()
        +updateCnh(cnh, cats, exp)
        +isExpired() bool
    }
    class VehicleEntity {
        +string id
        +Plate plate
        +string model
        +VehicleType type
        +int maxCapacity
        +string organizationId
        +VehicleStatus status
        +create(props)$ VehicleEntity
        +restore(props)$ VehicleEntity
        +activate()
        +deactivate()
        +updateMaxCapacity(n)
    }
    class Cnh {
        +create(v)$ Cnh
        +value_ string
    }
    class CnhCategories {
        +create(vals)$ CnhCategories
        +values List~CnhCategoryType~
        +has(c) bool
    }
    class Plate {
        +create(v)$ Plate
        +value_ string
    }
    class DriverStatus {
        <<enumeration>>
        ACTIVE
        INACTIVE
        SUSPENDED
    }
    class VehicleStatus {
        <<enumeration>>
        ACTIVE
        INACTIVE
    }
    class VehicleType {
        <<enumeration>>
        VAN
        BUS
        MINIBUS
        CAR
    }

    DriverEntity *-- Cnh
    DriverEntity *-- CnhCategories
    DriverEntity --> DriverStatus
    VehicleEntity *-- Plate
    VehicleEntity --> VehicleStatus
    VehicleEntity --> VehicleType
```

> `DriverEntity` é **global** (ligado a um `User` por `userId` único, sem `organizationId`): o vínculo
> com organizações é feito via `Membership` com `Role = DRIVER`, permitindo o mesmo motorista em
> várias organizações.

---

## Fig. 5 — Contexto: Viagens (Template, Instância & Agendamento)

```mermaid
classDiagram
    direction TB

    class TripTemplate {
        +string id
        +string organizationId
        +string departurePoint
        +string destination
        +List~DayOfWeek~ frequency
        +List~string~ stops
        +string departureTimeOfDay
        +string arrivalTimeOfDay
        +int defaultCapacity
        +string defaultDriverId
        +string defaultVehicleId
        +Money priceOneWay
        +Money priceReturn
        +Money priceRoundTrip
        +Money minRevenue
        +bool isPublic
        +bool isRecurring
        +bool autoCancelEnabled
        +int autoCancelOffset
        +Shift shift
        +Status status
        +create(props)$ TripTemplate
        +activate()
        +deactivate()
        +updatePricing(prices)
        +setRecurrence(on, freq)
        +setAutoCancel(on, min, off)
    }
    class TripInstance {
        +string id
        +string organizationId
        +string tripTemplateId
        +string driverId
        +string vehicleId
        +TripStatus tripStatus
        +Money minRevenue
        +Date autoCancelAt
        +bool forceConfirm
        +int totalCapacity
        +bool isPublic
        +Date departureTime
        +Date arrivalEstimate
        +create(props)$ TripInstance
        +transitionTo(status)
        +assignDriver(id)
        +assignVehicle(id)
    }
    class TripSchedulingConfig {
        +string id
        +string organizationId
        +int daysAhead
        +bool enabled
        +create(input)$ TripSchedulingConfig
        +updateDaysAhead(n)
        +setEnabled(b)
    }
    class TripStatus {
        <<enumeration>>
        DRAFT
        SCHEDULED
        CONFIRMED
        IN_PROGRESS
        FINISHED
        CANCELED
    }
    class DayOfWeek {
        <<enumeration>>
        SUNDAY..SATURDAY
    }
    class Shift {
        <<enumeration>>
        MORNING
        AFTERNOON
        EVENING
    }

    TripTemplate "1" -- "0..*" TripInstance : gera
    TripTemplate --> Shift
    TripTemplate --> DayOfWeek
    TripInstance --> TripStatus
    TripTemplate ..> Money : usa
    TripInstance ..> Money : usa
```

> `TripTemplate` (modelo de rota recorrente) gera `TripInstance` (execução datada), que carrega um
> *snapshot* de capacidade e preço. A máquina de estados de `TripInstance.transitionTo()` impede
> transições inválidas e exige motorista + veículo para agendar/confirmar. `TripSchedulingConfig`
> (1:0..1 com `Organization`) controla a janela `daysAhead` dos crons de geração e auto-cancel.

---

## Fig. 6 — Contexto: Reservas & Pagamentos

```mermaid
classDiagram
    direction TB

    class Booking {
        +string id
        +string organizationId
        +string userId
        +string tripInstanceId
        +Date enrollmentDate
        +Status status
        +bool presenceConfirmed
        +EnrollmentType enrollmentType
        +Money recordedPrice
        +string boardingStop
        +string alightingStop
        +MethodPayment paymentMethod
        +create(props)$ Booking
        +confirmPresence()
        +cancel()
    }
    class PaymentEntity {
        +string id
        +string organizationId
        +string enrollmentId
        +MethodPayment method
        +Money amount
        +PaymentStatus status
        +string tripInstanceId
        +Date tripDepartureTime
        +create(props)$ PaymentEntity
        +confirm()
        +fail()
    }
    class Money {
        +create(v)$ Money
        +value_ number
        +add(o) Money
        +subtract(o) Money
    }
    class EnrollmentType {
        <<enumeration>>
        ONE_WAY
        RETURN
        ROUND_TRIP
    }
    class MethodPayment {
        <<enumeration>>
        MONEY
        PIX
        CREDIT_CARD
        DEBIT_CARD
    }
    class PaymentStatus {
        <<enumeration>>
        PENDING
        COMPLETED
        FAILED
    }

    Booking "1" -- "0..1" PaymentEntity : enrollmentId único
    Booking *-- Money
    PaymentEntity *-- Money
    Booking --> EnrollmentType
    Booking --> MethodPayment
    PaymentEntity --> MethodPayment
    PaymentEntity --> PaymentStatus
```

> `Booking` mapeia para a tabela `enrollment`; o invariante "no máximo 1 inscrição ATIVA por
> `(userId, tripInstanceId)`" é garantido por chave única `activeKey` no banco. `recordedPrice` é um
> *snapshot* do preço no momento da reserva. Em `PaymentEntity`, `tripInstanceId`/`tripDepartureTime`
> são *snapshots* de leitura (não persistidos), derivados via `enrollment → tripInstance`.

---

## Fig. 7 — Contexto: Assinaturas & Planos (Billing)

```mermaid
classDiagram
    direction TB

    class PlanEntity {
        +int id
        +PlanName name
        +Money price
        +int maxVehicles
        +int maxDrivers
        +int maxMonthlyTrips
        +int durationDays
        +bool isActive
        +create(props)$ PlanEntity
        +update(props)
        +deactivate()
    }
    class SubscriptionEntity {
        +string id
        +string organizationId
        +int planId
        +SubscriptionStatus status
        +Date startDate
        +Date expiresAt
        +create(props)$ SubscriptionEntity
        +cancel()
        +changePlan(planId, days)
        +expire()
        +isExpired() bool
    }
    class Money {
        +create(v)$ Money
        +value_ number
    }
    class PlanName {
        <<enumeration>>
        FREE
        BASIC
        PRO
        PREMIUM
    }
    class SubscriptionStatus {
        <<enumeration>>
        ACTIVE
        CANCELED
        PAST_DUE
    }

    PlanEntity "1" -- "0..*" SubscriptionEntity
    PlanEntity *-- Money
    PlanEntity --> PlanName
    SubscriptionEntity --> SubscriptionStatus
```

> Uma `Organization` tem no máximo uma `SubscriptionEntity` ACTIVE por vez. A janela
> `[startDate, expiresAt)` define o período de cobrança usado pelo `PlanLimitService` para contar a
> cota de viagens (`maxMonthlyTrips`). Expiração é *lazy* (transição para `PAST_DUE` na leitura, sem
> cron).

---

## Tabela de relacionamentos

| Origem | Destino | Multiplicidade | Natureza / restrição |
|---|---|---|---|
| User | DriverEntity | 1 — 0..1 | `Driver.userId` **único**: um perfil de motorista por usuário (global) |
| User | Membership | 1 — 0..* | Associação do usuário a organizações/roles |
| Organization | Membership | 1 — 0..* | Memberships da organização (soft delete via `removedAt`) |
| Role | Membership | 1 — 0..* | Chave composta `(userId, roleId, organizationId)` |
| User | PasswordResetToken | 1 — 0..* | One-shot, TTL 1h, só hash persistido |
| User | EmailVerificationToken | 1 — 0..* | One-shot, TTL 24h, só hash persistido |
| Organization | VehicleEntity | 1 — 0..* | Frota (tenant scope) |
| Organization | TripTemplate | 1 — 0..* | Modelos de rota |
| Organization | TripInstance | 1 — 0..* | Execuções de viagem |
| Organization | TripSchedulingConfig | 1 — 0..1 | `organizationId` único |
| TripTemplate | TripInstance | 1 — 0..* | Padrão template → instância |
| DriverEntity | TripInstance | 0..1 — 0..* | Atribuição opcional (`driverId` nulo até agendar) |
| VehicleEntity | TripInstance | 0..1 — 0..* | Atribuição opcional (`vehicleId` nulo até agendar) |
| TripInstance | Booking | 1 — 0..* | Inscrições (tabela `enrollment`) |
| User | Booking | 1 — 0..* | Passageiro da reserva |
| Booking | PaymentEntity | 1 — 0..1 | `Payment.enrollmentId` **único** |
| Organization | PaymentEntity | 1 — 0..* | Pagamentos (tenant scope) |
| Organization | SubscriptionEntity | 1 — 0..* | Uma ACTIVE por vez |
| PlanEntity | SubscriptionEntity | 1 — 0..* | Limites aplicados via `PlanLimitService` |

---

## Dicas de renderização para LaTeX

1. **Exporte cada figura como vetor (SVG/PDF), não PNG.** Com o `@mermaid-js/mermaid-cli`:
   ```bash
   npx -y @mermaid-js/mermaid-cli -i docs/DIAGRAMA_CLASSES.md -o build/diagrama.pdf
   ```
   (gera um PDF/SVG por bloco ```mermaid```). Inclua com `\includegraphics[width=\linewidth]{...}`.
2. **Figuras largas** (Fig. 5 é a maior): use `\begin{sidewaysfigure}` (pacote `rotating`) para
   girar 90°, ou `\resizebox{\textwidth}{!}{...}` se inserir como TikZ/SVG.
3. **Aumente a fonte do diagrama** na exportação para sobreviver à redução de escala:
   `-i ... --cssFile` ou um `config.json` com `{"themeVariables":{"fontSize":"18px"}}` via
   `-c config.json`.
4. **Uma figura por página/contexto** mantém tudo legível em coluna única; o leitor consulta a
   Fig. 1 como índice visual e mergulha nas demais conforme o capítulo.
