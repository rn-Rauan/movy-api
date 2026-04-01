# 📊 Progresso do Projeto

> Checklist de desenvolvimento por módulo. Update conforme vai terminando features.

**Última atualização:** 31 Mar 2026

---

## 📈 Resumo Geral

```
Total Módulos: 7
Completo: 1 (14%) - User
Em Progresso: 1 (14%) - Organization  
Pendente: 5 (72%)
```

---

## ✅ FASE 1: Fundação (Mar 2026)

### User Module ✅ COMPLETO
- ✅ CRUD completo (Create, Read, Update, Delete)
- ✅ Soft-delete (status INACTIVE)
- ✅ Testes unitários (80%+)
- ✅ Exception handling
- ✅ DTOs com validação
- ✅ Repositório pattern

**Status:** Produção ✅

---

### Organization Module 🔄 IN PROGRESS (50%)

**Backend (API REST):**
- [ ] POST `/organizations` - Criar org (DTO + Service + Repository)
- [ ] GET `/organizations` - Listar orgs ativas
- [ ] GET `/organizations/:id` - Detalhes da org
- [ ] PUT `/organizations/:id` - Atualizar dados
- [ ] DELETE `/organizations/:id` - Soft-delete (marcar como INACTIVE)
- [ ] Testes unitários (80%+)
- [ ] Swagger docs

**Organization Members (multi-tenant):**
- [ ] POST `/organizations/:id/members` - Adicionar user à org
- [ ] GET `/organizations/:id/members` - Listar membros
- [ ] DELETE `/organizations/:id/members/:userId` - Remover membro
- [ ] Validar permissões (apenas admin)

**Arquivos a criar:**
```
src/modules/organization/
├── application/dtos/
│   ├── create-organization.dto.ts
│   ├── update-organization.dto.ts
│   └── add-member.dto.ts
├── domain/
│   ├── entities/organization.entity.ts
│   ├── errors/organization.errors.ts
│   └── interfaces/organization.repository.ts
├── infrastructure/repositories/
│   └── prisma-organization.repository.ts
├── presentation/controllers/
│   └── organization.controller.ts
└── organization.module.ts
```

**Estimativa:** 2-3 dias

---

## ⏳ FASE 2: Core Features (Abr-Mai 2026)

### Authentication & JWT 📋 PRÓXIMO (~5-7 dias)

**Decisão Necessária:** JWT custom vs Supabase Auth?

**Se JWT Custom:**
- [ ] Criar `auth.module.ts`
- [ ] POST `/auth/login` - Login com email/password
- [ ] POST `/auth/register` - Registrar novo user
- [ ] POST `/auth/refresh` - Refresh token
- [ ] Guard de autenticação (decorator `@Auth()`)
- [ ] Validar token em todas as rotas protegidas
- [ ] Testes de auth flow

**Se Supabase Auth:**
- [ ] Integrar SDK Supabase
- [ ] Guardar user_id do Supabase no BD
- [ ] Validar token Supabase
- [ ] Sincronizar user create/delete com Supabase

**Arquivos:**
```
src/shared/guards/
├── jwt.guard.ts
├── jwt.strategy.ts
└── decorator @Auth()

src/modules/auth/
├── auth.service.ts
├── auth.controller.ts
└── auth.module.ts
```

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

1. **Esta semana (31 Mar - 04 Abr):**
   - [ ] Finalizar Organization module
   - [ ] Coverage de testes ≥80%

2. **Semana 1-2 (07-18 Abr):**
   - [ ] Implementar JWT/Auth
   - [ ] Setup CI/CD básico

3. **Semana 2-3 (21-01 Mai):**
   - [ ] Vehicles module completo
   - [ ] Drivers module completo

4. **Semana 3-4 (04-15 Mai):**
   - [ ] Trips module (o mais complexo)
   - [ ] Testes E2E

5. **Semana 4-5 (18-29 Mai):**
   - [ ] Bookings module
   - [ ] Swagger completo

6. **Semana 5-6 (01-15 Jun):**
   - [ ] Payments + Plans
   - [ ] Testes finais

7. **Semana 6-7 (18+ Jun):**
   - [ ] Polish, documentação
   - [ ] Deploy staging
   - [ ] MVP pronto

---

## 📝 Observações & Decisões

**Blockers Atuais:**
- [ ] Nenhum

**Decisões Técnicas Pendentes:**
- [ ] JWT custom vs Supabase Auth? → **Decisão:**
- [ ] Payment provider: Stripe vs PagSeguro? → **Decisão:** Stripe
- [ ] Cache (Redis)? Não para MVP
- [ ] Message Queue? Não para MVP
- [ ] WebSockets para live tracking? Depois (V2)

**Riscos:**
- Trips module é complexo (auto-geração CRON)
- Payment integration requer testes cuidadosos

---

