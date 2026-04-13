# 📊 Progresso do Projeto

> Checklist de desenvolvimento por módulo. Update conforme vai terminando features.

**Última atualização:** 13 Abr 2026 (23:59)

---

## 📈 Resumo Geral

```
Total Módulos: 7
Completo: 7 (100%) - User, Organization, Role Management, Membership, Driver, RBAC Guards, Auth (registro com org)
Em Progresso: 0
Pendente: 0
```

---

## ✅ FASE 1: Fundação (Mar 2026)

### Role Management ✅ COMPLETO (05 Abr 2026)
- ✅ Entity Role (ADMIN, DRIVER)
- ✅ Role Repository pattern
- ✅ Role Mapper (Entity ↔ DTO)
- ✅ Database seeding script
- ✅ Seed automático no Docker
- ✅ Value Objects com validações
- ✅ Validation Errors para domínio

**Status:** Funcional e integrado ao SharedModule

---

### Shared Module ✅ COMPLETO (05 Abr 2026)
- ✅ Module padronizado para exports
- ✅ Orchestração de componentes globais (PrismaModule, Guards, Interceptors, Filters)
- ✅ Database seeding integration
- ✅ Value Objects centralizados (Email, Telephone)
- ✅ Domain Errors e Validation Errors
- ✅ JWT Guard compartilhado
- ✅ Logging Interceptor global
- ✅ Exception Filter global

**Arquivos criados:**
```
src/shared/
├── shared.module.ts ✅
├── index.ts ✅
├── domain/
│   ├── types/index.ts ✅
│   ├── errors/validation.error.ts ✅
│   └── entities/value-objects/ ✅
└── (outros componentes já existentes)
```

**Status:** Padrão estabelecido para reutilização em outros módulos

---

### Membership Module ✅ COMPLETO (05 Abr 2026)
- ✅ Entity Membership com chave composta (userId, roleId, organizationId)
- ✅ Repository pattern com PrismaMembershipRepository
- ✅ Mapper para conversão domínio ↔ persistência
- ✅ Use Cases: Create, FindByCompositeKey, FindByUser, FindByOrganization, Remove, Restore
- ✅ Controller REST com endpoints CRUD (POST, GET, DELETE, PATCH)
- ✅ DTOs com validação (CreateMembershipDto, MembershipResponseDto)
- ✅ Soft delete via removedAt
- ✅ Paginação em listagens
- ✅ Tratamento de erros específicos (MembershipAlreadyExistsError, MembershipNotFoundError)
- ✅ Presenter para respostas HTTP
- ✅ Integração com SharedModule (Prisma, Guards)
- [ ] Testes unitários (0% - pendente)

**Arquivos criados:**
```
src/modules/membership/
├── membership.module.ts ✅
├── application/dtos/ ✅
├── application/use-cases/ ✅
├── domain/entities/ ✅
├── domain/errors/ ✅
├── domain/interfaces/ ✅
├── infrastructure/db/mappers/ ✅
├── infrastructure/db/repositories/ ✅
├── presentation/controllers/ ✅
├── presentation/mappers/ ✅
└── README.md ✅
```

**Status:** Funcional e integrado, pronto para RBAC. Testes pendentes.

---

### Driver Module ✅ COMPLETO (11 Abr 2026)
- ✅ Entity DriverEntity com Value Objects (Cnh, CnhCategory)
- ✅ Value Objects com validação completa
  - Cnh: Validação de 9-12 caracteres alfanuméricos
  - CnhCategory: Enum A-E com validação
- ✅ DriverMapper com hidratação de value objects
- ✅ Domain Errors (9+ tipos de erro específicos, incluindo DriverCreationFailedError e DriverUpdateFailedError — refatorado 13 Abr)
- ✅ Repository pattern (IDriverRepository, PrismaDriverRepository — refatorado 13 Abr)
- ✅ Use Cases (6 total): Create, Update, FindById, FindByUserId, FindByOrganization, Remove (error handling aprimorado — 13 Abr)
- ✅ DTOs com @ApiProperty decorators (create, update, response)
- ✅ Controller com endpoints REST (POST, GET, PUT, DELETE)
- ✅ Presenter com métodos estáticos (toHTTP, toHTTPList)
- ✅ RBAC Guards: RolesGuard, TenantFilterGuard nos endpoints
- ✅ Paginação via PaginationOptions + PaginatedResponse
- ✅ Soft-delete com status enum (ACTIVE, INACTIVE, SUSPENDED)
- ✅ 100% alinhado com User Module architecture
- ✅ Schema Prisma com DriverStatus enum
- ✅ Compilação sem erros TypeScript ✅
- ❌ Testes unitários (0% - pendente)

**Arquivos implementados:**
```
src/modules/driver/
├── application/dto/ ✅ (create-driver, update-driver, driver-response)
├── application/use-cases/ ✅ (6 use cases)
├── domain/
│   ├── entities/driver.entity.ts ✅
│   ├── errors/driver.errors.ts ✅ (9 error types)
│   ├── value-objects/ ✅ (cnh, cnh-category)
│   └── interfaces/driver.repository.interface.ts ✅
├── infrastructure/
│   ├── db/mappers/driver.mapper.ts ✅
│   └── db/repositories/prisma-driver.repository.ts ✅
├── presentation/
│   ├── controllers/driver.controller.ts ✅
│   └── mappers/driver.presenter.ts ✅
├── driver.module.ts ✅
└── README.md ✅
```

**Alinhamento com User Module:**
- ✅ save() retorna Promise<DriverEntity | null>
- ✅ update() retorna Promise<DriverEntity | null>
- ✅ delete() em vez de remove()
- ✅ findByOrganizationId() usa PaginationOptions
- ✅ Retorno PaginatedResponse<DriverEntity>
- ✅ Value Objects com validação de domínio
- ✅ Mapper com toDomain/toPersistence
- ✅ Presenter com métodos estáticos
- ✅ DTOs com Swagger documentation

**Refactor (13 Abr 2026):**
- Use cases reescritos com error handling mais preciso e tipagem aprimorada
- `PrismaDriverRepository` reestruturado para melhor consistência
- Novos tipos de erro adicionados ao `driver.errors.ts`
- Compilação TypeScript ✅ sem erros

**Status:** Funcional e 100% alinhado com User Module. Compilação ✅

---

### User Module ✅ COMPLETO (CRUD + Infraestrutura)
- ✅ CRUD completo (Create, Read, Update, Delete)
- ✅ Soft-delete (status INACTIVE)
- ❌ Testes unitários (0% - pendente implementação)
- ✅ Exception handling
- ✅ DTOs com validação
- ✅ Repositório pattern

**Status:** Funcional, mas testes pendentes

---

### Organization Module ✅ CRUD COMPLETO (05 Abr 2026) | 🔄 Members Pendente

**Backend (API REST) - CRUD ✅ COMPLETO:**
- [x] POST `/organizations` - Criar org (DTO + Service + Repository) ✅
- [x] GET `/organizations` - Listar todas orgs (paginado) ✅
- [x] GET `/organizations/active` - Listar apenas ativas (paginado) ✅
- [x] GET `/organizations/:id` - Detalhes da org ✅
- [x] PUT `/organizations/:id` - Atualizar dados ✅
- [x] DELETE `/organizations/:id` - Soft-delete (marcar como INACTIVE) ✅
- [x] CRUD Use Cases (6 total) ✅
- [x] Value Objects com validações ✅
- [x] Exception Handling específico ✅
- [ ] Testes unitários (0% - pendente)
- [ ] Swagger docs integrado (já está com @ApiTags e decorators)

**Use Cases Implementados (6 total):**
- ✅ CreateOrganizationUseCase - Validação e criação com slug auto-gerado (atualizado: aceita `userId` e cria membership ADMIN automaticamente — 12 Abr)
- ✅ FindAllOrganizationsUseCase - Listagem paginada
- ✅ FindAllActiveOrganizationsUseCase - Listagem paginada (apenas ativas)
- ✅ FindOrganizationByIdUseCase - Busca com tratamento 404
- ✅ UpdateOrganizationUseCase - Atualização com re-validação
- ✅ DisableOrganizationUseCase - Soft delete com timestamp

**Value Objects Implementados (5 total):**
- ✅ Cnpj - Validação de CNPJ com dígitos verificadores
- ✅ OrganizationName - Validação de tamanho mínimo/máximo
- ✅ Slug - Gerado automaticamente e URL-friendly
- ✅ Address - Endereço da organização
- ✅ Email, Telephone - Compartilhados do SharedModule

**Organization Members (multi-tenant com Roles) - PRÓXIMO:**
- [ ] Integrar Membership Module com Organization Module
- [ ] Guards customizados baseados em Role (RBAC)
- [ ] POST `/organizations/:id/members` - Adicionar membro com role
- [ ] GET `/organizations/:id/members` - Listar membros
- [ ] PUT `/organizations/:id/members/:userId` - Atualizar role
- [ ] DELETE `/organizations/:id/members/:userId` - Remover membro
- [ ] Validar permissões (apenas admin gerencia membros)

**Arquivos criados:**
```
src/modules/organization/
├── application/dtos/
│   ├── create-organization.dto.ts ✅
│   ├── update-organization.dto.ts ✅
│   └── organization-response.dto.ts ✅
├── domain/
│   ├── entities/
│   │   ├── index.ts ✅
│   │   └── organization.entity.ts ✅
│   ├── errors/
│   │   ├── index.ts ✅
│   │   └── organization.errors.ts ✅
│   ├── value-objects/
│   │   ├── address.value-object.ts ✅
│   │   ├── cnpj.value-object.ts ✅
│   │   ├── index.ts ✅
│   │   ├── organization-name.value-object.ts ✅
│   │   └── slug.value-object.ts ✅
│   └── interfaces/
│       └── organization.repository.ts ✅
├── infrastructure/
│   └── db/
│       ├── mappers/
│       │   └── organization.mapper.ts ✅
│       └── repositories/
│           └── prisma-organization.repository.ts ✅
├── presentation/
│   ├── controllers/
│   │   └── organization.controller.ts ✅
│   └── mappers/
│       └── organization.mapper.ts ✅
└── organization.module.ts ✅
```

**Status CRUD:** ✅ FUNCIONAL E COMPLETO (05 Abr 2026)

**Estimativa (Members + RBAC):** 2-3 dias

---

## ⏳ FASE 2: Core Features (Abr-Mai 2026)

### Authentication & JWT ✅ COMPLETO (13 Abr 2026)

**Backend (API REST):**
- [x] POST `/auth/login` - Login com email/password
- [x] POST `/auth/register` - Registrar novo user
- [x] POST `/auth/refresh` - Refresh token
- [x] POST `/auth/register-organization` - Registro de organização + admin em uma chamada ✅ (12 Abr)
- [x] JWT Strategy + Passport
- [x] JWT Strategy otimizado - sem query ao banco em cada request ✅ (13 Abr)
- [x] JwtAuthGuard para proteger rotas
- [x] Swagger docs ✅ (05 Abr 2026)
- [ ] Testes unitários (80%+)
- [ ] Logout (invalidação de tokens)

**Novo Use Case - RegisterOrganizationWithAdminUseCase (12 Abr 2026):**
- Orquestra criação de usuário + organização + login automático em um único fluxo
- `RegisterOrganizationWithAdminDto`: DTO unificado (dados do admin + dados da org)
- `CreateOrganizationUseCase` atualizado para aceitar `userId` e criar membership ADMIN automaticamente

**Otimização JWT Strategy (13 Abr 2026):**
- Removida query ao banco (`userRepository.findById`) a cada requisição autenticada
- Strategy agora confia no payload do JWT (enriquecido em login/refresh)
- Melhoria de performance em rotas autenticadas

**Arquivos criados/modificados:**
```
src/modules/auth/
├── auth.module.ts ✅ (atualizado)
├── application/dtos/
│   ├── login.dto.ts ✅
│   ├── register.dto.ts ✅
│   ├── token-response.dto.ts ✅
│   └── register-organization.dto.ts ✅ (novo - 12 Abr)
├── application/use-cases/
│   ├── login.use-case.ts ✅
│   ├── register.use-case.ts ✅
│   ├── refresh-token.use-case.ts ✅
│   └── register-organization-with-admin.use-case.ts ✅ (novo - 12 Abr)
├── infrastructure/
│   └── jwt.strategy.ts ✅ (refatorado - sem DB query - 13 Abr)
├── presentation/controllers/
│   └── auth.controller.ts ✅ (atualizado - novo endpoint)
└── README.md ✅

src/shared/guards/
└── jwt.guard.ts ✅
```

**Status:** ✅ COMPLETO e validado em 13 Abr 2026

---

### RBAC Guards & Authorization ✅ COMPLETO (11 Abr 2026)

**O Problema Identificado:**
O middleware `TenantContextMiddleware` rodava ANTES do `JwtAuthGuard` no pipeline do NestJS, portanto `req.user` ainda não existia e o contexto não era populado. Guards que dependiam de `req.context` falhavam com erro 400.

**Solução Implementada:**
Integração da população de `req.context` diretamente no `JwtAuthGuard`, garantindo que esteja disponível para todos os guards subsequentes.

**Pipeline NestJS Corrigido:**
```
Request → JwtAuthGuard (valida JWT, popula req.user e req.context)
        → RolesGuard / TenantFilterGuard / DevGuard (leem req.context)
        → Controller
```

**Componentes Implementados:**
- ✅ `@Dev()` decorator - Marca rotas como exclusivas para devs
- ✅ `DevGuard` - Bloqueia acesso de não-devs em rotas `@Dev()`
- ✅ `TenantContext` interface - Centralizada em `types/tenant-context.interface.ts` (fonte única de verdade)
- ✅ `JwtAuthGuard` refatorado - Popula `req.context` após validação do JWT
- ✅ `RolesGuard` refatorado - Import atualizado, bypass implícito para devs
- ✅ `TenantFilterGuard` refatorado - Import atualizado
- ✅ Removido `TenantContextMiddleware` do `AppModule` (não era capaz de funcionar no pipeline)
- ✅ Removido `TenantContextInterceptor` do `SharedModule` (substituído por lógica no `JwtAuthGuard`)
- ✅ User Controller - Aplicado `@Dev()` em rotas de acesso global
- ✅ Organization Controller - Aplicado `@Dev()` em rotas de acesso global (12 Abr)

**Três Responsabilidades Distintas:**
1. **TenantFilterGuard**: "Você pertence a essa organização?" (isolamento multi-tenant)
2. **RolesGuard**: "Você tem permissão para fazer isso dentro da sua org?" (autorização por role)
3. **DevGuard**: "Você é desenvolvedor?" (acesso a endpoints internos/debug)

**Arquivos Criados/Modificados:**
```
src/shared/
├── infrastructure/
│   ├── decorators/
│   │   ├── dev.decorator.ts ✅ (novo)
│   │   └── get-user.decorator.ts ✅ (novo - 12 Abr)
│   ├── guards/
│   │   ├── jwt.guard.ts ✅ (refatorado - agora popula req.context)
│   │   ├── roles.guard.ts ✅ (import atualizado)
│   │   ├── tenant-filter.guard.ts ✅ (import atualizado)
│   │   └── dev.guard.ts ✅ (novo)
│   └── types/
│       └── tenant-context.interface.ts ✅ (novo - interface centralizada)
└── presentation/
    ├── interceptors/
    │   └── tenant-context.interceptor.ts ✅ (marcado @deprecated)
    └── exceptions/
        └── all-exceptions.filter.ts ✅ (refatorado - mapeamento por padrão de código - 13 Abr)

src/modules/user/presentation/controllers/
└── user.controller.ts ✅ (aplicado @Dev() em rotas de acesso global)

src/modules/organization/presentation/controllers/
└── organization.controller.ts ✅ (aplicado @Dev() em rotas de acesso global - 12 Abr)
```

**Compilação:** ✅ TypeScript sem erros (13 Abr 2026)
**Validação:** ✅ Testado em produção - req.context populando corretamente

**Status:** ✅ FUNCIONAL E OPERACIONAL

---

### Vehicles Module 📋 PRÓXIMO (~4-5 dias)

**CRUD de Veículos:**
- [ ] POST `/organizations/:id/vehicles` - Registrar novo veículo
  - Campos: placa, marca, modelo, ano, capacidade, status
- [ ] GET `/organizations/:id/vehicles` - Listar veículos da org
- [ ] GET `/vehicles/:id` - Detalhes veículo
- [ ] PUT `/vehicles/:id` - Editar veículo
- [ ] DELETE `/vehicles/:id` - Soft-delete veículo
- [ ] Validar que vehicle pertence à org (multi-tenant)

**Status do Veículo:**
- [ ] Status enum: ATIVO, EM_MANUTENCAO, INATIVO
- [ ] PUT `/vehicles/:id/status` - Mudar status
- [ ] Histórico de mudanças de status

**Manutenção (básico):**
- [ ] POST `/vehicles/:id/maintenance` - Registrar manutenção
- [ ] GET `/vehicles/:id/maintenance` - Histórico
- [ ] Campo: data, tipo, custo (opcional)

**Arquivos:**
```
src/modules/vehicle/
├── application/dtos/
│   ├── create-vehicle.dto.ts
│   ├── update-vehicle.dto.ts
│   └── maintenance.dto.ts
├── domain/
│   ├── entities/vehicle.entity.ts
│   ├── errors/vehicle.errors.ts
│   └── interfaces/vehicle.repository.ts
├── infrastructure/repositories/
│   └── prisma-vehicle.repository.ts
├── presentation/controllers/
│   └── vehicle.controller.ts
└── vehicle.module.ts
```

---

### Drivers Module 📋 (~3-4 dias)

**CRUD de Motoristas:**
- [ ] POST `/drivers` - Registrar novo driver
  - Campos: nome, email, phone, CNH, status, user_id (link com User)
- [ ] GET `/drivers` - Listar drivers
- [ ] GET `/drivers/:id` - Detalhes motorista
- [ ] PUT `/drivers/:id` - Editar dados motorista
- [ ] DELETE `/drivers/:id` - Soft-delete motorista
- [ ] Filtrar por organização (multi-tenant)

**Associação Vehicle + Driver:**
- [ ] Tabela junction: `driver_vehicle` (um driver pode ter múltiplos veículos)
- [ ] PUT `/drivers/:id/vehicles` - Atualizar veículos do driver
- [ ] GET `/drivers/:id/vehicles` - Listar veículos do driver

**Status:**
- [ ] Enum: ATIVO, EM_FOLGA, INDISPONIVEL
- [ ] Histórico de status changes

**Arquivos:**
```
src/modules/driver/
├── application/dtos/
│   ├── create-driver.dto.ts
│   ├── update-driver.dto.ts
│   └── assign-vehicle.dto.ts
├── domain/
│   ├── entities/driver.entity.ts
│   ├── errors/driver.errors.ts
│   └── interfaces/driver.repository.ts
├── infrastructure/repositories/
│   └── prisma-driver.repository.ts
├── presentation/controllers/
│   └── driver.controller.ts
└── driver.module.ts
```

---

### Trips Module 📋 (~8-10 dias - COMPLEXO)

**Templates de Viagem (recorrência):**
- [ ] POST `/trips/templates` - Criar template
  - Campos: nome, rota, horário saída, horário chegada, dias_semana, capacidade
- [ ] GET `/trips/templates` - Listar templates
- [ ] PUT `/trips/templates/:id` - Editar template
- [ ] DELETE `/trips/templates/:id` - Deletar template

**Viagens Instâncias (execuções específicas):**
- [ ] GET `/trips/instances` - Listar viagens futuras
- [ ] GET `/trips/instances/:id` - Detalhes viagem específica
- [ ] PUT `/trips/instances/:id/status` - Mudar status (agendada, em_andamento, finalizada, cancelada)

**Auto-geração (CRON Job):**
- [ ] Criar job que gera automaticamente viagens quando necessário
  - Ex: Todo dia 23:00 gerar próximas viagens dos próximos 7 dias
- [ ] Implementar com `@nestjs/schedule`

**Cancelamento/Mudanças:**
- [ ] PUT `/trips/instances/:id/cancel` - Cancelar viagem
- [ ] Notificar passageiros inscritos

**Arquivos:**
```
src/modules/trip/
├── application/dtos/
│   ├── create-trip-template.dto.ts
│   ├── update-trip-template.dto.ts
│   └── trip-instance.dto.ts
├── domain/
│   ├── entities/
│   │   ├── trip-template.entity.ts
│   │   └── trip-instance.entity.ts
│   ├── errors/trip.errors.ts
│   └── interfaces/
│       ├── trip-template.repository.ts
│       └── trip-instance.repository.ts
├── infrastructure/
│   ├── repositories/
│   │   ├── prisma-trip-template.repository.ts
│   │   └── prisma-trip-instance.repository.ts
│   └── jobs/
│       └── generate-trips.job.ts
├── presentation/controllers/
│   ├── trip-template.controller.ts
│   └── trip-instance.controller.ts
└── trip.module.ts
```

---

### Bookings Module 📋 (~5-7 dias)

**Inscrição em Viagens:**
- [ ] POST `/bookings` - Inscrever passageiro em viagem
  - Validar: capacidade disponível, user ativo, trip disponível
- [ ] GET `/bookings` - Minhas inscrições
- [ ] GET `/trips/:id/bookings` - Passageiros da viagem
- [ ] DELETE `/bookings/:id` - Cancelar inscrição

**Validações:**
- [ ] Não permitir inscrição duplicada (mesmo user, mesma viagem)
- [ ] Validar capacidade: não deixar inscrever se lotado
- [ ] Soft-delete: marcar como CANCELLED (não deletar)

**Sistema de Fila (opcional - adicionár depois):**
- [ ] Quando lotado, adicionar em waitlist
- [ ] Liberar vagas quando alguém cancela (promover da fila)

**Arquivos:**
```
src/modules/booking/
├── application/dtos/
│   └── create-booking.dto.ts
├── domain/
│   ├── entities/booking.entity.ts
│   ├── errors/booking.errors.ts
│   └── interfaces/booking.repository.ts
├── infrastructure/repositories/
│   └── prisma-booking.repository.ts
├── presentation/controllers/
│   └── booking.controller.ts
└── booking.module.ts
```

---

## 💰 FASE 3: Monetização (Mai-Jun 2026)

### Payments Module 📋 (~7-10 dias)

**Integração com Stripe (recomendado):**
- [ ] Criar conta Stripe
- [ ] POST `/payments/checkout` - Gerar session de pagamento
- [ ] Webhook de confirmação de pagamento
- [ ] Salvar histórico de transações

**Alternativa:** PagSeguro ou Mercado Pago

**Arquivos:**
```
src/modules/payment/
├── infrastructure/
│   └── providers/
│       ├── stripe.provider.ts
│       └── payment.adapter.ts
├── domain/
│   └── entities/payment.entity.ts
├── application/services/
│   └── payment.service.ts
└── payment.module.ts
```

---

### Plans & Billing 📋 (~3-5 dias)

**Planos:**
- [ ] FREE: básico, limite de trips/mês
- [ ] PRO: sem limites, suporte prioritário
- [ ] ENTERPRISE: customizado

**Campos:**
- [ ] price, max_trips_month, features, duration_days

**Faturamento:**
- [ ] POST `/billing/invoice` - Gerar invoice
- [ ] GET `/billing/invoices` - Histórico
- [ ] Incluir payment_id da transação

---

## 🔧 FASE 4: Qualidade & DevOps (Contínuo)

### Testing 📋
- [ ] Unit tests (target: 80%+)
  - [ ] User module: ✅ Feito
  - [ ] Organization module: ⏳ Next
  - [ ] Vehicles module: ⏳
  - [ ] Drivers module: ⏳
  - [ ] Trips module: ⏳ (complexo)
  - [ ] Bookings module: ⏳
  - [ ] Payments module: ⏳

- [ ] Integration tests (E2E)
  - [ ] Auth flow completo
  - [ ] Trip booking flow
  - [ ] Payment webhook

**Comando:** `npm run test:cov`

---

### CI/CD 📋
- [ ] GitHub Actions workflow
  - [ ] Build step
  - [ ] Lint step
  - [ ] Test step
  - [ ] Coverage check (≥80%)
- [ ] Deploy automático em staging
- [ ] Notificações de falha

**Arquivo:** `.github/workflows/ci.yml`

---

### Documentation 📋
- [ ] Swagger/OpenAPI (incremento por módulo)
  - [ ] User endpoints: ✅
  - [ ] Organization endpoints: ⏳
  - [ ] etc...
- [ ] README com setup
- [ ] DOCUMENTACAO_TECNICA.md atualizado
- [ ] Exemplos de curl por endpoint

---

### Deployment 📋
- [ ] Docker image otimizada
- [ ] Docker compose com postgres
- [ ] Environment variables documentadas
- [ ] Health check endpoint

---

## 📝 Próximos Passos (Ordem)

1. **Esta semana (05-07 Abr):** 
   - [ ] Implementar Organization members associação com roles
   - [ ] Guards de permissão baseados em Role (RBAC)
   - [ ] Coverage de testes ≥80%

2. **Semana 1-2 (08-20 Abr):**
   - [ ] Implementar Vehicles CRUD
   - [ ] Implementar Drivers CRUD
   - [ ] Setup CI/CD com GitHub Actions

3. **Semana 2-3 (21-01 Mai):**
   - [ ] Trip Templates module
   - [ ] Trip Instances auto-generation com CRON

4. **Semana 3-4 (04-15 Mai):**
   - [ ] Bookings module completo
   - [ ] Testes E2E

5. **Semana 4-5 (18-29 Mai):**
   - [ ] Integração de Pagamentos (Stripe)
   - [ ] Plans (Free/Pro/Enterprise)

6. **Semana 5-6 (01-15 Jun):**
   - [ ] Swagger completo
   - [ ] Documentação TCC

7. **Semana 6-7 (18+ Jun):**
   - [ ] Polish, testes finais
   - [ ] Deploy staging/production
   - [ ] **MVP PRONTO**

---

## 📝 Observações & Decisões

**Blockers Atuais:**
- [x] Database seeding automático → RESOLVIDO (05 Abr)
- [ ] Nenhum blocker técnico identificado

**Decisões Técnicas Implementadas:**
- ✅ **Role-Based Access Control (RBAC):** Implementado Role Entity com upsert para garantir integridade
- ✅ **Database Seeding:** Usando `tsx` + Docker entrypoint para seed automático
- ✅ **Shared Module Pattern:** Padronizado para orquestração de componentes globais
- ✅ **Value Objects:** Telefone e Email com validações de domínio

**Decisões Técnicas Pendentes:**
- [ ] JWT custom vs Supabase Auth? → **Decisão:** Custom (já implementado)
- [ ] Payment provider: Stripe vs PagSeguro? → **Decisão:** Stripe
- [ ] Cache (Redis)? Não para MVP
- [ ] Message Queue? Não para MVP
- [ ] WebSockets para live tracking? Depois (V2)

**Riscos:**
- Trips module é complexo (auto-geração CRON)
- Payment integration requer testes cuidadosos

---

