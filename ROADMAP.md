# 🗺️ Roadmap - Movy API (Solo Dev)

> 4 fases claras até MVP. Cheque PROGRESS.md para detalhe de cada módulo.

**Última atualização:** 31 Mar 2026

---

## ⏱️ Timeline Estimado

```
FASE 1: Mar 31 - Abr 13    (2 semanas)
FASE 2: Abr 14 - Mai 15    (4 semanas)
FASE 3: Mai 18 - Jun 01    (2 semanas)
FASE 4: Jun 02 - Jun 15    (2 semanas, final polish)

MVP PRONTO: 15 de Junho 2026
```

---

## 📍 Fase 1: Fundação (Mar 31 - Abr 13)

**Objetivo:** Base sólida com 2 módulos funcionais

| Status | O Quê | Duração |
|:------:|-------|---------|
| ✅ | User module | ✅ Pronto |
| 🔄 | Organization CRUD + Members | 2-3 dias |
| ⏳ | JWT/Auth setup | 2-3 dias |
| ⏳ | CI/CD básico (GitHub Actions) | 1 dia |
| ⏳ | Testes 80%+ coverage | 2-3 dias |

**Saída:** API com 2 módulos, autenticação, CI/CD

---

## 🚗 Fase 2: Core Business Logic (Abr 14 - Mai 15)

**Objetivo:** Lógica de negócio completa (Vehicles, Drivers, Trips, Bookings)

### Semana 1-2: Frotas (Abr 14-25)
| Status | O Quê | Duração |
|:------:|-------|---------|
| ⏳ | Vehicles CRUD | 3-4 dias |
| ⏳ | Drivers CRUD + LinkVehicles | 3-4 dias |
| ⏳ | Testes dos 2 módulos | 1-2 dias |

**Saída:** Gestão de frotas pronta

### Semana 3-4: Viagens (Abr 28 - Mai 15)
| Status | O Quê | Duração |
|:------:|-------|---------|
| ⏳ | Trip Templates | 3-4 dias |
| ⏳ | Trip Instances + Auto-generate | 4-5 dias (COMPLEXO) |
| ⏳ | Bookings (Inscrições) | 3-4 dias |
| ⏳ | Testes E2E trip flow | 2-3 dias |

**Saída:** Sistema de viagens recorrentes + booking funcional

---

## 💰 Fase 3: Monetização (Mai 18 - Jun 01)

**Objetivo:** Transformar em SaaS com pagamentos

| Status | O Quê | Duração |
|:------:|-------|---------|
| ⏳ | Payment integration (Stripe) | 4-5 dias |
| ⏳ | Plans (Free/Pro/Enterprise) | 2 dias |
| ⏳ | Billing + Invoices | 2 dias |
| ⏳ | Testes de pagamento | 2 dias |

**Saída:** SaaS monetizado, pronto pra production

---

## 🔧 Fase 4: Qualidade & Deploy (Jun 02 - Jun 15)

**Objetivo:** Polish final, documentação, pronto para TCC

| Status | O Quê | Duração |
|:------:|-------|---------|
| ⏳ | Swagger completo (todos endpoints) | 2-3 dias |
| ⏳ | Documentação TCC | 3-4 dias |
| ⏳ | Docker + Docker-compose prod | 1-2 dias |
| ⏳ | Testes finais + bug fixes | 2-3 dias |
| ⏳ | Deploy em staging/demo | 1 dia |

**Saída:** MVP production-ready + documentação completa

---

## 🎯 Milestones

```
✅ 04 Abr  → User + Org modules, Auth básica
✅ 18 Abr  → Vehicles + Drivers prontos
✅ 01 Mai  → Trips + Bookings funcionando
✅ 15 Mai  → Pagamentos integrados
✅ 15 Jun  → MVP deployado + TCC documentado
```

---

## 📊 Módulos por Fase

### Fase 1 ✅
```
user/          ✅ COMPLETO
organization/  🔄 IN PROGRESS
auth/          ⏳ PRÓXIMO
```

### Fase 2 ⏳
```
vehicle/       ⏳ PRÓXIMO (semana 1-2)
driver/        ⏳ PRÓXIMO (semana 1-2)
trip/          ⏳ PRÓXIMO (semana 3-4, COMPLEXO)
booking/       ⏳ PRÓXIMO (semana 3-4)
```

### Fase 3 ⏳
```
payment/       ⏳ PRÓXIMO (semana 1-2)
plan/          ⏳ PRÓXIMO (semana 1-2)
billing/       ⏳ PRÓXIMO (semana 1-2)
```

### Fase 4 🔧
```
Testes E2E, Swagger, Docker, Deploy, Docs
```

---

## 📝 Riscos & Mitigações

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Trips module complexo | Alto | Começar cedo, testar bem |
| Payment integration bugs | Alto | Mock Stripe para dev, testes cuidadosos |
| Multi-tenant bugs | Médio | Testar com 2+ orgs |
| Database migrations | Médio | Versionar migrations, backup antes |

---

## 📋 Checklist MVP Mínimo

- [ ] User CRUD ✅
- [ ] Organization CRUD 🔄
- [ ] Auth JWT ⏳
- [ ] Vehicles CRUD ⏳
- [ ] Drivers CRUD ⏳
- [ ] Trip Templates ⏳
- [ ] Trip Instances ⏳
- [ ] Bookings ⏳
- [ ] Pagamentos (integração) ⏳
- [ ] Plans básicos ⏳
- [ ] Testes 80%+ ⏳
- [ ] Swagger docs ⏳
- [ ] Docker ✅ (já tem)
- [ ] README/Setup ✅ (já tem)
- [ ] Documentação TCC ⏳

---

## 💡 Notas Importantes

**Não entrar em scope creep:**
- ❌ WebSockets/Live tracking (V2)
- ❌ Mobile app (V2)
- ❌ Admin dashboard (V2)
- ❌ Notificações por email/SMS (V2)
- ❌ Relatórios avançados (V2)

**Manter foco em:**
- ✅ API REST funcional
- ✅ Lógica de negócio sólida
- ✅ Testes automatizados
- ✅ Documentação clara

---

**Ver detalhes em:** [PROGRESS.md](./PROGRESS.md)

