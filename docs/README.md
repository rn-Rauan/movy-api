# Índice da Documentação — Movy API

> Porta de entrada da pasta `docs/`. Define **qual documento é a fonte da verdade de cada
> assunto** (e qual é apenas complementar/evidência), e como a pasta está organizada.

## 🗂️ Estrutura

```
docs/
├── README.md                 ← este índice
├── DOCUMENTACAO_TECNICA.md   ← BASE técnica do backend (fonte que alimenta o TCC)
├── DOC-TCC.tex               ← snapshot de referência do TCC (o documento real é mantido online)
├── referencias.bib           ← bibliografia do snapshot
│
├── arquitetura/   → visão, decisões de design, segurança, diagramas ASCII
├── modelagem/     → modelo de dados + diagramas (DER, classes, casos de uso)
├── api/           → contrato da API + catálogo de erros
├── dominio/       → modelo de negócio (SaaS)
└── processo/      → evidência histórica (roadmap)
```

## 📌 Documento do TCC (referência)

O **documento real do TCC** é um `.tex` mantido **fora deste repositório** (plataforma online).
O que existe aqui é apenas apoio:

| Arquivo | Papel |
|---|---|
| **`DOCUMENTACAO_TECNICA.md`** | **Base técnica do backend.** É a partir dela que a parte de backend do TCC deve ser escrita. **Fonte da verdade técnica deste repositório.** Mantida pelo skill `movy-doc-sync` — não renomear. |
| `DOC-TCC.tex` | **Snapshot de referência** que reflete o estado do TCC. **Pode estar defasado** em relação à versão online. Não é o entregável. |
| `referencias.bib` | Bibliografia do snapshot (`\bibliography{referencias}`). O `.bib` real acompanha o `.tex` online. |

> ⚠️ As métricas verificadas contra o código em execução (93 endpoints, 93 casos de uso,
> 458 testes em 57 suites, 13 módulos, 14 entidades de domínio — 17 tabelas no schema) vivem em
> `DOCUMENTACAO_TECNICA.md`. Se a banca pedir para rodar `npx jest`, o número confere.

## 🚀 Apoio / como executar

| Arquivo | Papel |
|---|---|
| [`../README.md`](../README.md) | Setup, comandos, variáveis de ambiente. |
| [`api/API.md`](./api/API.md) | Contrato da API consumido pela aplicação cliente. |

## 🏗️ Arquitetura — `arquitetura/`

| Assunto | **Canônico** | Complementar |
|---|---|---|
| Visão de arquitetura | [**`arquitetura/ARCHITECTURE.md`**](./arquitetura/ARCHITECTURE.md) | [`arquitetura/ARQUITETURA_VISUAL.md`](./arquitetura/ARQUITETURA_VISUAL.md) (diagramas) |
| Decisões de design | [**`arquitetura/ARCHITECTURAL-DECISIONS.md`**](./arquitetura/ARCHITECTURAL-DECISIONS.md) | — |
| Segurança (IDOR, multi-tenant, guards) | [**`arquitetura/SECURITY.md`**](./arquitetura/SECURITY.md) | — |

## 🌐 API — `api/`

| Assunto | Canônico |
|---|---|
| Contrato consumido pelo cliente | [`api/API.md`](./api/API.md) |
| Códigos de erro de domínio → status HTTP | [`api/ERROR-CATALOG.md`](./api/ERROR-CATALOG.md) |

## 🗃️ Modelo de dados — `modelagem/`

| Assunto | **Canônico** | Complementar (diagramas) |
|---|---|---|
| Esquema e relacionamentos | [**`modelagem/DATA-MODEL.md`**](./modelagem/DATA-MODEL.md) | [`modelagem/DER.md`](./modelagem/DER.md), [`modelagem/DIAGRAMA_CLASSES.md`](./modelagem/DIAGRAMA_CLASSES.md), [`modelagem/USECASES.md`](./modelagem/USECASES.md) |

> A fonte definitiva do esquema é sempre `prisma/schema.prisma`. Os documentos acima são
> a narrativa sobre ele. `DER.md`, `DIAGRAMA_CLASSES.md` e `USECASES.md` são as fontes Mermaid
> dos diagramas.

## 🧭 Domínio e negócio — `dominio/`

| Arquivo | Papel |
|---|---|
| [`dominio/SAAS-MODEL.md`](./dominio/SAAS-MODEL.md) | Modelo de negócio (planos, assinaturas, multi-tenancy). |

> O fluxo de scheduling de viagens (template → instâncias, crons de geração e auto-cancel) está
> documentado em `DOCUMENTACAO_TECNICA.md` → seção *Trip Scheduling*, já que o módulo está
> implementado.

## 📈 Processo

| Arquivo | Papel |
|---|---|
| [`processo/DEPLOY-NEON-RENDER.md`](./processo/DEPLOY-NEON-RENDER.md) | Registro do deploy online: Neon, Render, variáveis, ajustes de startup e hardening básico. |
| [`processo/ROADMAP.md`](./processo/ROADMAP.md) | **Documento histórico** — registros datados das fases. Não é fonte de verdade do estado atual. |

---

## Dívidas técnicas declaradas (escopo consciente)

Registradas para que sejam lidas como **decisões datadas, não omissões**:

- **Pagamento** — opera com simulação de ciclo de vida (`PENDING → COMPLETED/FAILED`);
  integração com gateway real fica como evolução.
- **Auditoria** — entidade `AuditLog` **modelada no schema, mas não persistida**
  (nenhum caso de uso grava). Mantida como ponto de extensão (*audit-ready*).
- **Notificações** e **relatórios no backend** — não implementados (RF15–RF18).
- **Recuperação de senha e verificação de e-mail** — a lógica de tokens (hash SHA-256, TTL,
  anti-enumeration) está implementada no backend, mas **não há entrega de e-mail** (provedor não
  integrado), então os fluxos não operam ponta a ponta. Declarados como dívida técnica.
