# 📊 Documentação do Banco de Dados

## Visão Geral

A Movy API utiliza **PostgreSQL** como banco de dados relacional, gerenciado através do **Prisma ORM**. O schema está definido em `prisma/schema.prisma`.

---

## 🏗️ Estrutura Principal

### Enums (Tipos)

#### Status
Indica o estado geral de registros:
- `ACTIVE` - Ativo/Funcional
- `INACTIVE` - Inativo/Desabilitado

#### RoleName
Define os papéis (roles) de usuários:
- `ADMIN` - Administrador da organização
- `DRIVER` - Motorista

> **Nota:** Passageiro não é um role explícito. Qualquer usuário autenticado que não possua role de ADMIN ou DRIVER em uma organização é considerado passageiro.

#### RouteType
Tipos de rota para viagens:
- `ONE_WAY` - Ida simples
- `RETURN` - Ida e volta
- `ROUND_TRIP` - Viagem redonda

#### TripStatus
Estados de uma instância de viagem:
- `SCHEDULED` - Agendada
- `CONFIRMED` - Confirmada
- `IN_PROGRESS` - Em andamento
- `FINISHED` - Finalizada
- `CANCELED` - Cancelada

#### PaymentStatus
Estados de pagamentos:
- `PENDING` - Pendente
- `COMPLETED` - Concluído
- `FAILED` - Falhou

#### MethodPayment
Métodos de pagamento disponíveis:
- `MONEY` - Dinheiro
- `PIX` - Pix
- `CREDIT_CARD` - Cartão de crédito
- `DEBIT_CARD` - Cartão de débito

#### Shift e DayOfWeek
- **Shift**: `MORNING`, `AFTERNOON`, `EVENING`
- **DayOfWeek**: `SUNDAY`, `MONDAY`, `TUESDAY`, `WEDNESDAY`, `THURSDAY`, `FRIDAY`, `SATURDAY`

#### PlanName
Planos de assinatura:
- `FREE` - Gratuito
- `BASIC` - Básico
- `STANDARD` - Padrão
- `PREMIUM` - Premium

#### SubscriptionStatus
Estados de assinatura:
- `ACTIVE` - Ativa
- `CANCELED` - Cancelada
- `PAST_DUE` - Vencida

---

## 📋 Tabelas e Relacionamentos

### Plan (Planos)
Armazena informações sobre planos de assinatura.

```sql
id (INT) - Chave primária
name (PlanName) - Nome único do plano
price (DECIMAL) - Preço do plano
maxVehicles (INT) - Número máximo de veículos
maxDrivers (INT) - Número máximo de motoristas
maxMonthlyTrips (INT) - Máximo de viagens por mês
isActive (BOOLEAN) - Se o plano está ativo
createdAt (DATETIME) - Data de criação
updatedAt (DATETIME) - Última atualização
```

**Relações:**
- Um plano pode ter múltiplas assinaturas (`subscriptions`)

**Índices:**
- `isActive` - para filtragens frequentes

---

### Organization (Organizações)
Representa empresas/organizações de transporte.

```sql
id (UUID) - Chave primária
name (VARCHAR) - Nome da organização
cnpj (VARCHAR) - CNPJ (único)
email (VARCHAR) - Email (único)
telephone (VARCHAR) - Telefone
slug (VARCHAR) - URL amigável (único)
status (Status) - ACTIVE | INACTIVE
createdAt (DATETIME) - Data de criação
updatedAt (DATETIME) - Última atualização
```

**Relações:**
- Uma organização pode ter múltiplos usuários (`users`)
- Múltiplos veículos (`vehicles`)
- Múltiplos templates de viagem (`tripTemplates`)
- Múltiplos pagamentos (`payments`)
- Múltiplas inscrições (`enrollments`)
- Múltiplos logs de auditoria (`auditLogs`)
- Múltiplas assinaturas (`subscriptions`)

**Índices:**
- `slug` - para buscas por URL
- `status` - para filtragens

---

### Subscription (Assinaturas)
Relaciona organizações aos planos.

```sql
id (UUID) - Chave primária
organizationId (UUID) - FK Organization
planId (INT) - FK Plan
status (SubscriptionStatus) - ACTIVE | CANCELED | PAST_DUE
startDate (DATETIME) - Data de início
expiresAt (DATETIME) - Data de expiração
createdAt (DATETIME) - Data de criação
updatedAt (DATETIME) - Última atualização
```

**Relações:**
- Cada assinatura pertence a uma organização
- Cada assinatura referencia um plano

**Índices:**
- `organizationId` - para buscar assinaturas de uma org
- `status` - para listar assinaturas ativas

---

### Role (Papéis/Permissões)
Define os papéis disponíveis no sistema.

```sql
id (INT) - Chave primária
name (RoleName) - ADMIN | DRIVER
createdAt (DATETIME) - Data de criação
updatedAt (DATETIME) - Última atualização
```

**Relações:**
- Um papel pode ter múltiplas atribuições (`userRoles`)

---

### User (Usuários)
Armazena informações dos usuários da plataforma.

```sql
id (UUID) - Chave primária
name (VARCHAR) - Nome completo
email (VARCHAR) - Email (único)
passwordHash (VARCHAR) - Hash da senha
telephone (VARCHAR) - Telefone
organizationId (UUID) - FK Organization (nullable)
status (Status) - ACTIVE | INACTIVE
createdAt (DATETIME) - Data de criação
updatedAt (DATETIME) - Última atualização
```

**Relações:**
- Um usuário pode ter múltiplos papéis (`userRoles`)
- Cada usuário pertence a uma organização (opcional)
- Um usuário pode ser um motorista (`driver`)
- Um usuário pode ter múltiplas inscrições (`enrollments`)

**Índices:**
- `organizationId` - para listar usuários de uma org
- `status` - para filtragens

**Notas:**
- `organizationId` é nullable para usuários básicos
- Campo `email` é único globalmente

---

### UserRole (Atribuição de Papéis)
Associa usuários aos seus papéis (relação muitos-para-muitos).

```sql
userId (UUID) - FK User
roleId (INT) - FK Role
assignedAt (DATETIME) - Data da atribuição
```

**Chave Primária:** Composta `(userId, roleId)`

**Relações:**
- Cada registro conecta um usuário a um papel

---

### Driver (Motoristas)
Informações específicas de motoristas.

```sql
userId (UUID) - Chave primária / FK User
cnh (VARCHAR) - Número da CNH (único)
cnhCategory (VARCHAR) - Categoria da CNH (ex: AB, D)
createdAt (DATETIME) - Data de criação
updatedAt (DATETIME) - Última atualização
```

**Relações:**
- Um motorista é um usuário
- Um motorista pode conduzir múltiplas instâncias de viagem (`tripInstances`)

---

### Vehicle (Veículos)
Dados de veículos da frota.

```sql
id (UUID) - Chave primária
plate (VARCHAR) - Placa do veículo (única)
model (VARCHAR) - Modelo/Marca
type (VehicleType) - Tipo: VAN | BUS | MINIBUS | CAR
maxCapacity (INT) - Capacidade máxima
status (Status) - ACTIVE | INACTIVE
organizationId (UUID) - FK Organization
createdAt (DATETIME) - Data de criação
updatedAt (DATETIME) - Última atualização
```

**Relações:**
- Cada veículo pertence a uma organização
- Um veículo pode ser utilizado em múltiplas instâncias de viagem

**Índices:**
- `organizationId` - para listar veículos de uma org
- `status` - para filtragens

---

### TripTemplate (Templates de Viagem)
Define rotas/viagens que se repetem ou são criadas como templates.

```sql
id (UUID) - Chave primária
departurePoint (VARCHAR) - Ponto de partida
destination (VARCHAR) - Ponto de destino
routeType (RouteType) - ONE_WAY | RETURN | ROUND_TRIP
priceOneWay (DECIMAL) - Preço de ida (nullable)
priceReturn (DECIMAL) - Preço de ida e volta (nullable)
priceRoundTrip (DECIMAL) - Preço redondo (nullable)
isRecurring (BOOLEAN) - É uma viagem recorrente
frequency (ARRAY DayOfWeek) - Dias da semana que se repete
shift (Shift) - MORNING | AFTERNOON | EVENING
status (Status) - ACTIVE | INACTIVE
organizationId (UUID) - FK Organization
isPublic (BOOLEAN) - Visível publicamente
createdAt (DATETIME) - Data de criação
updatedAt (DATETIME) - Última atualização
```

**Relações:**
- Cada template pertence a uma organização
- Um template pode ter múltiplas instâncias de viagem

**Índices:**
- `organizationId` - para listar templates de uma org
- `status` - para filtragens
- `isPublic` - para buscar viagens públicas

---

### TripInstance (Instâncias de Viagem)
Uma ocorrência específica de uma viagem.

```sql
id (UUID) - Chave primária
driverId (UUID) - FK Driver
vehicleId (UUID) - FK Vehicle
totalCapacity (INT) - Capacidade total para esta instância
tripStatus (TripStatus) - SCHEDULED | CONFIRMED | IN_PROGRESS | FINISHED | CANCELED
tripTemplateId (UUID) - FK TripTemplate
statusForRecurringTrip (Status) - Nullable, apenas para viagens recorrentes
departureTime (DATETIME) - Hora de partida
arrivalEstimate (DATETIME) - Estimativa de chegada
createdAt (DATETIME) - Data de criação
updatedAt (DATETIME) - Última atualização
```

**Relações:**
- Cada instância tem um motorista
- Cada instância usa um veículo
- Cada instância é baseada em um template
- Uma instância pode ter múltiplas inscrições (`enrollments`)

**Índices:**
- `driverId`, `vehicleId`, `tripTemplateId`, `tripStatus` - para buscas comuns
- `departureTime` - para ordenar viagens

---

### Enrollment (Inscrições/Reservas)
Registro de passageiros em viagens.

```sql
id (UUID) - Chave primária
enrollmentDate (DATETIME) - Data da inscrição
status (Status) - ACTIVE | INACTIVE
presenceConfirmed (BOOLEAN) - Presença confirmada
routeType (RouteType) - ONE_WAY | RETURN | ROUND_TRIP
recordedPrice (DECIMAL) - Preço pago/registrado
userId (UUID) - FK User
tripInstanceId (UUID) - FK TripInstance
boardingPoint (VARCHAR) - Ponto de embarque
organizationId (UUID) - FK Organization
createdAt (DATETIME) - Data de criação
updatedAt (DATETIME) - Última atualização
```

**Relações:**
- Cada inscrição é de um usuário
- Cada inscrição é para uma instância de viagem
- Cada inscrição pertence a uma organização
- Uma inscrição pode ter um pagamento associado

**Índices:**
- Implícitos nas chaves estrangeiras

---

### Payment (Pagamentos)
Informações de pagamentos.

```sql
id (UUID) - Chave primária
amount (DECIMAL) - Valor
status (PaymentStatus) - PENDING | COMPLETED | FAILED
method (MethodPayment) - MONEY | PIX | CREDIT_CARD | DEBIT_CARD
enrollmentId (UUID) - FK Enrollment
organizationId (UUID) - FK Organization
processedAt (DATETIME) - Data do processamento
createdAt (DATETIME) - Data de criação
updatedAt (DATETIME) - Última atualização
```

**Relações:**
- Cada pagamento é relativo a uma inscrição
- Cada pagamento pertence a uma organização

---

### AuditLog (Logs de Auditoria)
Rastreamento de ações importantes no sistema.

```sql
id (UUID) - Chave primária
organizationId (UUID) - FK Organization
userId (UUID) - FK User (quem realizou a ação)
action (VARCHAR) - Ação realizada (ex: CREATE_VEHICLE, UPDATE_DRIVER)
details (JSON) - Contexto opcional: entityType, entityId, changes, ipAddress, etc.
timestamp (DATETIME) - Data da ação
```

**Relações:**
- Cada log referencia um usuário
- Cada log referencia uma organização

---

## 🔄 Relacionamentos Principais

### Hierarquia Organizacional
```
Organization
├── User (membros)
├── Vehicle (frota)
├── TripTemplate (rotas)
├── Enrollment (inscrições)
├── Payment (pagamentos)
├── Subscription (planos)
└── AuditLog (auditoria)
```

### Fluxo de Viagem
```
TripTemplate (define uma rota)
└── TripInstance (ocorrência específica)
    ├── Driver (motorista)
    ├── Vehicle (veículo)
    └── Enrollment[] (passageiros)
        └── Payment (pagamento)
```

### Segurança e Acesso
```
User
├── UserRole[] (papéis)
└── Organization (contexto)
```

---

## 🔧 Operações Comuns

### Criar uma Inscrição
1. Verificar TripInstance disponível
2. Validar capacidade do Vehicle
3. Criar Enrollment record
4. Gerar Payment (opcional)

### Cancelar Viagem
1. Atualizar TripInstance.tripStatus = CANCELED
2. Notificar todos os Enrollments
3. Processar reembolsos se necessário

### Gerar Relatório
1. Usar indexes para filtrar por organizationId
2. Agrupar por data (TripInstance.departureTime)
3. Calcular totais de Payment

---

## 📈 Performance

- **Índices estratégicos** em campos frequentemente consultados
- **Cascade delete** para manter integridade referencial
- **UUID** para IDs de entidades distribuídas
- **Timestamps** (createdAt, updatedAt) em todas as tabelas

---

## 🔐 Segurança

- **Senhas** armazenadas como hash (nunca texto plano)
- **Auditoria** de todas as operações críticas
- **Validações** de CNPJ, email, placa
- **Soft deletes** via status INACTIVE quando apropriado

---

## � Módulo Membership e OrganizationMembership

O módulo `membership` implementa a gestão de associações entre usuários, roles e organizações, utilizando a tabela `OrganizationMembership` como base. Ele segue os princípios de Clean Architecture e DDD, com separação clara de camadas.

### Funcionalidades Principais
- **Criar Associação**: Vincular um usuário a um role dentro de uma organização.
- **Buscar por Chave Composta**: Encontrar associações específicas via `userId`, `roleId` e `organizationId`.
- **Listar por Usuário**: Buscar todas as associações de um usuário (com paginação).
- **Listar por Organização**: Buscar associações de uma organização (com paginação).
- **Remover Associação**: Soft delete via `removedAt` (não remove fisicamente).
- **Restaurar Associação**: Reverter soft delete.

### Estrutura de Dados
- **Chave Composta**: `(userId, roleId, organizationId)` garante unicidade.
- **Soft Delete**: Campo `removedAt` para preservar histórico.
- **Relacionamentos**: Conecta `User`, `Role` e `Organization`.

### Operações CRUD
- **Create**: Valida existência de entidades relacionadas e impede duplicatas.
- **Read**: Buscas otimizadas com paginação.
- **Update**: Apenas para restaurar (soft delete reversível).
- **Delete**: Soft delete para manter integridade.

### Integração com Outros Módulos
- Usado pelo módulo `organization` para gerenciar membros.
- Base para RBAC (Role-Based Access Control) em guards futuros.
- Suporta multi-tenancy: usuários podem ter roles diferentes em organizações distintas.

### Desafios Resolvidos
- **Chave Composta**: Implementada corretamente no Prisma e repositório.
- **Soft Delete**: Lógica de negócio para preservar dados históricos.
- **Paginação**: Implementada em buscas por usuário/organização.
- **Validações**: Erros específicos para associações inexistentes ou duplicadas.

---

## �💾 Comandos Úteis Prisma

```bash
# Criar nova migração após alterar schema
npx prisma migrate dev --name <description>

# Visualizar dados em UI
npx prisma studio

# Fazer reset completo (CUIDADO: apaga dados!)
npx prisma migrate reset

# Validar schema
npx prisma validate

# Gerar Prisma Client
npx prisma generate
```

