# Índice da Documentação — Movy API

> Porta de entrada da pasta `docs/`. Define **qual documento é a fonte da verdade de cada
> assunto** (e qual é apenas complementar/evidência), e como a pasta está organizada, para que
> a leitura (e a avaliação da banca) seja inequívoca.

## 🗂️ Estrutura

```
docs/
├── README.md                 ← este índice
├── DOC-TCC.tex               ← entregável do TCC (build LaTeX)
├── referencias.bib           ← bibliografia do .tex   ┐ ficam juntos na raiz
├── imagens/                  ← assets do .tex (gitignored) ┘ (caminhos relativos do build)
├── DOCUMENTACAO_TECNICA.md   ← documento técnico mestre (skill movy-doc-sync escreve aqui)
│
├── arquitetura/   → visão, decisões de design, segurança, diagramas ASCII
├── modelagem/     → modelo de dados + diagramas (DER, classes, casos de uso)
├── api/           → contrato da API + catálogo de erros
├── dominio/       → regras de negócio (modelo SaaS, scheduling de viagens)
├── tcc/           → material de apresentação/defesa
├── processo/      → evidência histórica (roadmap)
└── _internal/     → (gitignored) material de trabalho, fora da entrega
```

## 📌 Entregável do TCC

O documento que a banca lê é **um só**:

| Arquivo | Papel |
|---|---|
| **`DOC-TCC.tex`** | Relatório Técnico de Software (ABNT). **Fonte da verdade do trabalho.** Fica na raiz de `docs/`. |
| `referencias.bib` | Bibliografia citada pelo `.tex` (`\bibliography{referencias}`). Não mover. |

> ⚠️ Todos os números do `.tex` (93 endpoints, 93 casos de uso, 458 testes em 57 suites,
> 13 módulos, 17 entidades) foram **verificados contra o código em execução** e batem
> linha a linha com a Tabela de módulos. Se a banca pedir para rodar `npx jest`, o número
> confere.

## 🚀 Apoio / como executar

| Arquivo | Papel |
|---|---|
| [`../README.md`](../README.md) | Setup, comandos, variáveis de ambiente. |
| [`api/API_FRONTEND.md`](./api/API_FRONTEND.md) | Contrato da API consumido pela aplicação cliente. |

## 🏗️ Arquitetura — `arquitetura/`

| Assunto | **Canônico** | Complementar |
|---|---|---|
| Visão de arquitetura | [**`arquitetura/ARCHITECTURE.md`**](./arquitetura/ARCHITECTURE.md) | [`arquitetura/ARQUITETURA_VISUAL.md`](./arquitetura/ARQUITETURA_VISUAL.md) (diagramas) |
| Decisões de design | [**`arquitetura/ARCHITECTURAL-DECISIONS.md`**](./arquitetura/ARCHITECTURAL-DECISIONS.md) | — |
| Segurança (IDOR, multi-tenant, guards) | [**`arquitetura/SECURITY.md`**](./arquitetura/SECURITY.md) | — |

## 🌐 API — `api/`

| Assunto | Canônico |
|---|---|
| Contrato consumido pelo cliente | [`api/API_FRONTEND.md`](./api/API_FRONTEND.md) |
| Códigos de erro de domínio → status HTTP | [`api/ERROR-CATALOG.md`](./api/ERROR-CATALOG.md) |

## 🗃️ Modelo de dados — `modelagem/`

| Assunto | **Canônico** | Complementar (diagramas) |
|---|---|---|
| Esquema e relacionamentos | [**`modelagem/DATA-MODEL.md`**](./modelagem/DATA-MODEL.md) | [`modelagem/DER.md`](./modelagem/DER.md), [`modelagem/DIAGRAMA_CLASSES.md`](./modelagem/DIAGRAMA_CLASSES.md), [`modelagem/usecases.md`](./modelagem/usecases.md) |

> A fonte definitiva do esquema é sempre `prisma/schema.prisma`. Os documentos acima são
> a narrativa sobre ele. `DER.md`, `DIAGRAMA_CLASSES.md` e `usecases.md` são as fontes Mermaid
> dos diagramas exportados para o `.tex`.

## 🧭 Domínio e negócio — `dominio/`

| Arquivo | Papel |
|---|---|
| [`dominio/SAAS-MODEL.md`](./dominio/SAAS-MODEL.md) | Modelo de negócio (planos, assinaturas, multi-tenancy). |
| [`dominio/GUIA_TRIP_SCHEDULING.md`](./dominio/GUIA_TRIP_SCHEDULING.md) | Fluxo template de viagem → geração de instâncias. |

## 📈 Processo e documento técnico

| Arquivo | Papel |
|---|---|
| `DOCUMENTACAO_TECNICA.md` (raiz) | Documento técnico completo (módulo a módulo, métricas). Mantido pelo skill `movy-doc-sync` — **não mover/renomear** (o automatismo escreve neste caminho). |
| [`processo/ROADMAP.md`](./processo/ROADMAP.md) | **Documento histórico** — registros datados das fases. Não é fonte de verdade do estado atual (métricas canônicas: este índice e o `.tex`). |

## 🎤 Apresentação — `tcc/`

| Arquivo | Papel |
|---|---|
| [`tcc/APRESENTACAO_TCC.md`](./tcc/APRESENTACAO_TCC.md) | Base do roteiro de defesa (linguagem acessível). |

## ⚠️ Compilar o `.tex`

O `DOC-TCC.tex` (raiz de `docs/`) usa `\bibliography{referencias}` (já versionada) e referencia
**4 imagens** via `\includegraphics{imagens/...}`. A pasta `docs/imagens/` é **gitignored** —
os `.png` não vão no repositório; coloque-os localmente (ou confirme no **Overleaf**). Sem eles
o build local **não fecha**:

| Imagem esperada (`imagens/`) | Origem |
|---|---|
| `Logo-IFPI-Vertical.png` | Logo institucional (IFPI). |
| `usecases_diagram.png` | Exportar de [`modelagem/usecases.md`](./modelagem/usecases.md). |
| `diagrama de classes (mapa geral).png` | Exportar de [`modelagem/DIAGRAMA_CLASSES.md`](./modelagem/DIAGRAMA_CLASSES.md). |
| `Subscription Payment-2026-06-05-152616.png` | Captura do fluxo de pagamento na aplicação. |

## 🗄️ Arquivo interno (`_internal/`)

Documentos que **não fazem parte da entrega** e não devem ser apresentados à banca. A pasta
inteira está em `.gitignore` (`docs/_internal/`) — fica local, fora do versionamento:

| Arquivo | Motivo |
|---|---|
| `_internal/VALIDACAO_TCC.md` | Auto-validação ("pronto para entrega") — material de trabalho, não de avaliação. |
| `_internal/claude_review.md` | Saída de revisão automatizada por IA. |

---

## Dívidas técnicas declaradas (escopo consciente)

Registradas para que sejam lidas como **decisões datadas, não omissões** (ver
`DOC-TCC.tex` → *Limitações Identificadas*):

- **Pagamento** — opera com simulação de ciclo de vida (`PENDING → COMPLETED/FAILED`);
  integração com gateway real fica como evolução.
- **Auditoria** — entidade `AuditLog` **modelada no schema, mas não persistida**
  (nenhum caso de uso grava). Mantida como ponto de extensão (*audit-ready*).
- **Notificações** e **relatórios no backend** — não implementados (RF15–RF18).
