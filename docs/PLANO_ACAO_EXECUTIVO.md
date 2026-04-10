# 🎯 PLANO DE AÇÃO EXECUTIVO - SaaS Multi-Tenant RBAC
## Roadmap Detalhado com Timeline e Prioridades

**Projeto**: Movy API - Transformação para SaaS Enterprise  
**Duração Total**: 10-12 dias  
**Data Início**: Imediato  
**Objetivo Principal**: Implementar isolamento de dados 100% seguro

---

## 📊 VISÃO GERAL DO PROJETO

```
┌──────────────────────────────────────────────────────────────┐
│                     SPRINT PLAN (2 SEMANAS)                  │
├──────────────────────────────────────────────────────────────┤
│ SEMANA 1: Fundações + Segurança de Base                      │
│  ├─ Dia 1-2: Migrations + JWT Enriquecido (2 dias)          │
│  ├─ Dia 3: Middleware + Guards (1 dia)                      │
│  ├─ Dia 4: Testes Unitários de Isolamento (1 dia)           │
│  └─ Dia 5: QA / Validação (1 dia)                           │
│                                                               │
│ SEMANA 2: Refatoração de Rotas + E2E                        │
│  ├─ Dia 6-8: Refatorar Controllers (3 dias)                │
│  ├─ Dia 9: Refatorar Repositories (1 dia)                  │
│  ├─ Dia 10: Testes E2E Completos (1 dia)                  │
│  └─ Dia 11-12: Revisão + Documentação (2 dias)            │
│                                                               │
│ TOTAL: ~80-100 horas de desenvolvimento                      │
└──────────────────────────────────────────────────────────────┘
```

---

## 🔴 FASE 1: FUNDAÇÕES (DIAS 1-5)

### **DIA 1-2: MIGRATIONS E SCHEMA (2 dias - 16 horas)**

#### Objetivos
- ✅ Adicionar `organizationId` a `Driver` (FK obrigatório)
- ✅ Adicionar `organizationId` redundante a `TripInstance` (FK obrigatório)
- ✅ Criar índices compostos para queries rápidas
- ✅ Validar dados existentes (backfill organizationId via relacionamentos)

#### Tarefas

| # | Tarefa | Responsável | Duração | Status | Nota |
|---|--------|-------------|---------|--------|------|
| 1.1 | Criar arquivo de migration Prisma | Dev | 1h | 📋 | `prisma/migrations/[date]_add_tenant_critical/` |
| 1.2 | Escrever SQL para Driver.organizationId | Dev | 2h | 📋 | Usar schema.prisma como reference |
| 1.3 | Escrever SQL para TripInstance.organizationId | Dev | 2h | 📋 | Adicionar índice composto |
| 1.4 | Adicionar índices para performance | Dev | 1h | 📋 | `idx_vehicle_org_id`, `idx_trip_org_id` |
| 1.5 | Backfill dados existentes | Dev | 2h | 📋 | UPDATE queries com LIMIT inicialmente |
| 1.6 | Executar migration localmente | Dev | 1h | 📋 | Validar sem erros |
| 1.7 | Testar com docker-compose | Dev | 2h | 📋 | Simular produção |
| 1.8 | Gerar novo Prisma client | Dev | 0.5h | 📋 | `npx prisma generate` |
| 1.9 | Atualizar schema.prisma types | Dev | 2h | 📋 | Add relações Organization → Driver/TripInstance |
| 1.10 | Documentar migration | Dev | 0.5h | 📋 | README na pasta migrations |
| 1.11 | Code review migration SQL | SR Dev | 1h | 📋 | Validar segurança |
| 1.12 | Backup database antes | OPS | 0.5h | 📋 | PostgreSQL dump |

**Comandos de Referência**:
```bash
# Criar migration
cd prisma
npx prisma migrate dev --name add_tenant_id_critical

# Verificar SQL gerado
cat migrations/[timestamp]_add_tenant_id_critical/migration.sql

# Testar com Docker
docker-compose down && docker-compose up -d
npx prisma migrate deploy

# Gerar types
npx prisma generate
```

**Critérios de Aceitação**:
- [ ] Driver tem organizationId NOT NULL
- [ ] TripInstance tem organizationId NOT NULL
- [ ] Todos os drivers/trips existentes têm organizationId preenchido
- [ ] Índices criados e funcionando
- [ ] Sem erros em migrations aplicadas

---

### **DIA 2-3: JWT ENRIQUECIDO (1.5 dias - 12 horas)**

#### Objetivos
- ✅ Extrair `organizationId`, `role`, `isDev` do JWT
- ✅ Incluir no payload de validação do Passport
- ✅ Validar coerência (role requer organizationId ou isDev)

#### Tarefas

| # | Tarefa | Responsável | Duração | Status |
|---|--------|-------------|---------|--------|
| 2.1 | Criar interface `PrismaMembershipRepository` | Dev | 1h | 📋 |
| 2.2 | Implementar `findFirstByUserId()` | Dev | 1.5h | 📋 |
| 2.3 | Actualizar `jwt.strategy.ts` para enriquecer payload | Dev | 2h | 📋 |
| 2.4 | Adicionar `isDev` whitelist em `.env` | DevOps | 0.5h | 📋 |
| 2.5 | Testar JWT gerado com jwt.io | Dev | 1.5h | 📋 |
| 2.6 | Validar claims: organizationId + role + isDev | Dev | 1.5h | 📋 |
| 2.7 | Adicionar testes unitários JwtStrategy | QA | 2h | 📋 |
| 2.8 | Code review JWT changes | SR Dev | 1h | 📋 |

**Código de Referência** (resumido):
```typescript
// src/modules/auth/infrastructure/jwt.strategy.ts

async validate(payload: any) {
  const user = await this.userRepository.findById(payload.sub);
  
  const devWhitelist = (this.configService.get('DEV_EMAILS') || '')
    .split(',');
  const isDev = devWhitelist.includes(user.email);
  
  let organizationId: string | undefined;
  let role: 'ADMIN' | 'DRIVER' | null = null;
  
  if (!isDev) {
    const membership = await this.membershipRepository
      .findFirstByUserId(user.id);
    if (membership) {
      organizationId = membership.organizationId;
      role = membership.role.name;
    }
  }
  
  return {
    sub: user.id,
    email: user.email,
    organizationId,
    role,
    isDev,
  };
}
```

**Critérios de Aceitação**:
- [ ] JWT contém todos os campos necessários
- [ ] Dev whitelist funciona
- [ ] Membership carregado corretamente
- [ ] Sem N+1 queries na validação

---

### **DIA 4: MIDDLEWARE + GUARDS (1 dia - 8 horas)**

#### Objetivos
- ✅ Criar `TenantContextMiddleware`
- ✅ Refatorar `RolesGuard` para usar contexto
- ✅ Criar `TenantFilterGuard`
- ✅ Criar decorators `@GetTenantContext()` e `@GetTenantId()`

#### Tarefas

| # | Tarefa | Responsável | Duração | Status |
|---|--------|-------------|---------|--------|
| 4.1 | Criar TenantContextMiddleware | Dev | 1.5h | 📋 |
| 4.2 | Registrar middleware em app.module.ts | Dev | 0.5h | 📋 |
| 4.3 | Criar TenantFilterGuard | Dev | 1.5h | 📋 |
| 4.4 | Refatorar RolesGuard | Dev | 1.5h | 📋 |
| 4.5 | Criar @GetTenantContext() decorator | Dev | 0.5h | 📋 |
| 4.6 | Criar @GetTenantId() decorator | Dev | 0.5h | 📋 |
| 4.7 | Testar guards em isolamento | QA | 1.5h | 📋 |
| 4.8 | Code review | SR Dev | 1h | 📋 |

**Critérios de Aceitação**:
- [ ] Middleware injeta context em req
- [ ] Guards validam tenant_id corretamente
- [ ] Decorators retornam valores esperados
- [ ] Sem exposição de dados entre tenants

---

### **DIA 5: TESTES UNITÁRIOS (1 dia - 8 horas)**

#### Objetivos
- ✅ Testes de Guards isolados
- ✅ Testes de Middleware
- ✅ Testes de JWT enrichment

#### Tarefas

| # | Tarefa | Responsável | Duração | Status |
|---|--------|-------------|---------|--------|
| 5.1 | Testes TenantContextMiddleware | QA | 2h | 📋 |
| 5.2 | Testes TenantFilterGuard | QA | 2h | 📋 |
| 5.3 | Testes RolesGuard refatorado | QA | 2h | 📋 |
| 5.4 | Testes JwtStrategy | QA | 1.5h | 📋 |
| 5.5 | Code coverage report | QA | 0.5h | 📋 |

**Saída Esperada**: Cobertura >95% nestes módulos

---

## 🟡 FASE 2: REFATORAÇÃO DE ROTAS (DIAS 6-10)

### **DIA 6: USER CONTROLLER (1 dia - 8 horas)**

#### Tarefas

| # | Tarefa | Responsável | Duração |
|---|--------|-------------|---------|
| 6.1 | Criar GET /users/me endpoint | Dev | 1.5h |
| 6.2 | Criar PUT /users/me endpoint | Dev | 1.5h |
| 6.3 | Criar GET /users/me/enrollments | Dev | 1.5h |
| 6.4 | Remover GET /users/:id (deprecated) | Dev | 0.5h |
| 6.5 | Remover PUT /users/:id (deprecated) | Dev | 0.5h |
| 6.6 | Adicionar warnings em changelog | Dev | 0.5h |
| 6.7 | Testes E2E User controller | QA | 1.5h |
| 6.8 | Code review | SR Dev | 1h |

---

### **DIA 7: VEHICLE + TRIP CONTROLLER (1.5 dias - 12 horas)**

#### Tarefas Vehicle

| # | Tarefa | Responsável | Duração |
|---|--------|-------------|---------|
| 7.1 | Criar VehicleController novo | Dev | 2h |
| 7.2 | Implementar GET /orgs/:id/vehicles | Dev | 1.5h |
| 7.3 | Implementar POST /orgs/:id/vehicles | Dev | 1.5h |
| 7.4 | Implementar PUT/DELETE | Dev | 1h |
| 7.5 | Adicionar @Roles(ADMIN) a todas | Dev | 1h |
| 7.6 | Testes E2E vehicles | QA | 2h |
| 7.7 | Code review | SR Dev | 1h |
| 7.8 | Testes de IDOR vehicles | QA | 1.5h |

#### Tarefas Trip

| # | Tarefa | Responsável | Duração |
|---|--------|-------------|---------|
| 7.9 | Criar TripController novo | Dev | 2h |
| 7.10 | GET /my-trips (DRIVER) | Dev | 1.5h |
| 7.11 | PUT /my-trips/:id (DRIVER) | Dev | 1h |
| 7.12 | GET /public-trips (PUBLIC) | Dev | 1h |
| 7.13 | POST /public/:id/enroll (USER) | Dev | 1.5h |
| 7.14 | Testes E2E trips | QA | 2h |

---

### **DIA 8: OUTRAS CONTROLLERS (1 dia - 8 horas)**

#### Tarefas

| # | Tarefa | Responsável | Duração |
|---|--------|-------------|---------|
| 8.1 | Refatorar MembershipController | Dev | 2h |
| 8.2 | Refatorar OrganizationController | Dev | 2h |
| 8.3 | Refatorar DriverController (novo) | Dev | 1.5h |
| 8.4 | Adicionar Guards de role em todas | Dev | 1h |
| 8.5 | Testes E2E | QA | 1h |
| 8.6 | Code review | SR Dev | 0.5h |

---

### **DIA 9: REPOSITORIES (1 dia - 8 horas)**

#### Objetivos
- ✅ Implementar `TenantAwareRepository` base
- ✅ Refatorar Vehicle, Trip, Driver, Enrollment repositories

#### Tarefas

| # | Tarefa | Responsável | Duração |
|---|--------|-------------|---------|
| 9.1 | Criar TenantAwareRepository abstrata | Dev | 1.5h |
| 9.2 | Implementar em Vehicle repository | Dev | 1.5h |
| 9.3 | Implementar em Trip repository | Dev | 1.5h |
| 9.4 | Implementar em Enrollment repository | Dev | 1h |
| 9.5 | Adicionar validações tenant_id | Dev | 1.5h |
| 9.6 | Testes unitários repositories | QA | 1h |
| 9.7 | Code review | SR Dev | 0.5h |

---

### **DIA 10: TESTES E2E COMPLETOS (1 dia - 8 horas)**

#### Suítes de Testes

| Suite | Cobertura | Duração |
|-------|-----------|---------|
| IDOR Protection | Validar que User A não vê recursos de User B | 2h |
| Tenant Filtering | Validar WHERE organization_id em toda query | 2h |
| Role-Based Authorization | ADMIN/DRIVER/USER permissionings | 1.5h |
| Dados B2C | USER comum não acessa dados de org | 1h |
| Happy Path | Fluxos completos por role | 1.5h |

---

## 🟢 FASE 3: VALIDAÇÃO E DOCUMENTAÇÃO (DIAS 11-12)

### **DIA 11: CODE REVIEW + TESTS (8 horas)**

- Revisão de todos os PR abertos
- Cobertura de testes >90%
- Performance validation
- Security audit

### **DIA 12: DOCUMENTAÇÃO + DEPLOY (8 horas)**

- Atualizar docs técnicas
- Criar runbook de deployment
- Treinar time
- Preparar para produção

---

## 🎬 DEPENDENCY GRAPH

```
┌─────────────────────────────────┐
│ Dia 1-2: Migrations             │ (Can start immediately)
│ ✓ Driver.organizationId         │
│ ✓ TripInstance.organizationId  │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│ Dia 2-3: JWT Enriquecido        │ (Depends on Migrations)
│ ✓ JWT contains organizationId  │
│ ✓ JWT contains role            │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│ Dia 4: Middleware + Guards       │ (Depends on JWT)
│ ✓ TenantContextMiddleware       │
│ ✓ TenantFilterGuard             │
│ ✓ RolesGuard refactored         │
└────────────┬────────────────────┘
             │
    ┌────────┴────────┐
    ▼                 ▼
┌──────────┐    ┌──────────────┐
│Dia 5:    │    │Dia 6-10:     │
│Unit Tests│    │Controllers   │
│Guards    │    │Repositories  │
│JWT       │    │Integration   │
└──────────┘    └──────────────┘
    │                 │
    └────────┬────────┘
             ▼
┌─────────────────────────────────┐
│ Dia 10-11: Full E2E Tests        │
│ IDOR Protection ✓                │
│ Tenant Filtering ✓               │
│ Role Authorization ✓              │
└────────────┬────────────────────┘
             │
             ▼
        🚀 PRODUCTION READY
```

---

## 💰 RESOURCE ALLOCATION

### Equipe Necessária
- **1x Dev Sênior** (80h) - Lead da implementação
- **1x Dev Mid** (40h) - Suporte
- **1x QA/Tester** (30h) - Testes
- **1x DevOps** (8h) - Infra/Migrations

### Ferramentas
- Prisma Studio (debug)
- Postman/Bruno (API testing)
- JetBrains IDE (debugging)
- GitHub Actions (CI/CD)

---

## ⚠️ RISCOS CRÍTICOS

### Risco 1: Data Loss em Migrations
- **Probabilidade**: Baixa
- **Impacto**: CRÍTICO
- **Mitigation**:
  - Backup completo antes
  - Testar migration em staging
  - Rollback plan documentado

### Risco 2: Regression em Autorização
- **Probabilidade**: Alta (mudanças complexas)
- **Impacto**: CRÍTICO
- **Mitigation**:
  - E2E tests obrigatórios
  - Feature flag para ativar gradualmente
  - Monitoring de erros 403/401

### Risco 3: Performance Degradation
- **Probabilidade**: Média
- **Impacto**: Médio
- **Mitigation**:
  - Load tests antes/depois
  - Índices em lugar certo
  - Cache JWT no middleware

---

## 📈 MÉTRICAS DE SUCESSO

### Segurança
- ✅ Zero IDOR vulnerabilities (detectadas em testes)
- ✅ 100% tenant filtering coverage
- ✅ Zero cross-tenant data leaks

### Performance
- ✅ Response time < 100ms (p95)
- ✅ Queries por request < 2
- ✅ No N+1 queries

### Qualidade
- ✅ Test coverage >90%
- ✅ Zero regression bugs
- ✅ Zero security issues em code review

---

## 🔄 GATEWAY CRITERIA

### Antes de Dia 5 (Fundação)
- [ ] Migrations executadas com sucesso
- [ ] JWT contém todos os campos
- [ ] Guards funcionando isoladamente

### Antes de Dia 10 (Controllers)
- [ ] 100% controllers refatorados
- [ ] 100% testes E2E criados
- [ ] Zero IDOR detectados

### Antes de Deploy
- [ ] Tudo documentado
- [ ] Rollback plan testado
- [ ] Time treinado
- [ ] Monitoring configurado

---

## 📞 COMUNICAÇÃO

### Standups
- **Daily 09:00**: 15 min (Slack)
- **Sprint Review**: Sextas 15:00 (30 min)

### Escalation
- Bloqueio: Senior Dev (escalate imediatamente)
- Segurança: CTO (24h máximo)
- Performance: Tech Lead (48h máximo)

---

## 📝 ENTREGÁVEIS

1. ✅ Código-fonte refatorado (branch `feat/saas-rbac`)
2. ✅ Migrations Prisma aplicadas
3. ✅ Testes E2E passando (100%)
4. ✅ Documentação técnica atualizada
5. ✅ Runbook de deployment
6. ✅ Change log com breaking changes

---

## 🚀 GO-LIVE PLAN

```
D-1 (Dia anterior)
├─ Backup produção completo
├─ Verificar rollback plan
├─ Notificar stakeholders
└─ Preparar monitoring

D0 (Deploy Day)
├─ 08:00 - Deploy staging (aplicar migrations)
├─ 09:00 - Smoke tests em staging
├─ 10:00 - Deploy produção
├─ 10:15 - Verificar logs de erro
├─ 10:30 - Verificar métricas
├─ 11:00 - Coordenado com customer support
└─ 14:00 - Considerado estável (revert blackout end)

D+1 (Próximo dia)
├─ Monitorar performance
├─ Verificar relatórios de erro
├─ Estar em prontidão para rollback
└─ Feedback dos usuários
```

---

**Pronto para começar?** ✅

Próximo passo: Discutir com a equipe e começar com o Dia 1! 

