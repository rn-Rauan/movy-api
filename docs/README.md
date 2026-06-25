# Índice da Documentação — Movy API

> Porta de entrada da pasta `docs/`. A documentação cresceu por acúmulo durante o
> desenvolvimento; este índice define **qual documento é a fonte da verdade de cada
> assunto** e qual é apenas complementar/evidência, para que a leitura (e a avaliação
> da banca) seja inequívoca.

## 📌 Entregável do TCC

O documento que a banca lê é **um só**:

| Arquivo | Papel |
|---|---|
| **`DOC-TCC.tex`** | Relatório Técnico de Software (ABNT). **Fonte da verdade do trabalho.** |
| `referencias.bib` | Bibliografia citada pelo `.tex` (`\bibliography{referencias}`). Não mover. |

> ⚠️ Todos os números do `.tex` (93 endpoints, 93 casos de uso, 458 testes em 57 suites,
> 13 módulos, 17 entidades) foram **verificados contra o código em execução** e batem
> linha a linha com a Tabela de módulos. Se a banca pedir para rodar `npx jest`, o número
> confere.

## 🚀 Apoio / como executar

| Arquivo | Papel |
|---|---|
| [`../README.md`](../README.md) | Setup, comandos, variáveis de ambiente. |
| `API_FRONTEND.md` | Contrato da API consumido pela aplicação cliente. |

## 🏗️ Arquitetura

| Assunto | **Canônico** | Complementar |
|---|---|---|
| Visão de arquitetura | **`ARCHITECTURE.md`** | `ARQUITETURA_VISUAL.md` (diagramas) |
| Decisões de design | **`ARCHITECTURAL-DECISIONS.md`** | — |
| Segurança (IDOR, multi-tenant, guards) | **`SECURITY.md`** | — |
| Códigos de erro → status HTTP | **`ERROR-CATALOG.md`** | — |

## 🗃️ Modelo de dados

| Assunto | **Canônico** | Complementar |
|---|---|---|
| Esquema e relacionamentos | **`DATA-MODEL.md`** | `DER.md`, `DIAGRAMA_CLASSES.md` |

> A fonte definitiva do esquema é sempre `prisma/schema.prisma`. Os documentos acima são
> a narrativa sobre ele.

## 🧭 Domínio e negócio

| Arquivo | Papel |
|---|---|
| `SAAS-MODEL.md` | Modelo de negócio (planos, assinaturas, multi-tenancy). |
| `usecases.md` | Casos de uso do sistema. |
| `GUIA_TRIP_SCHEDULING.md` | Fluxo template de viagem → geração de instâncias. |

## 📈 Processo e gestão (evidência de desenvolvimento)

| Arquivo | Papel |
|---|---|
| `DOCUMENTACAO_TECNICA.md` | Documento técnico completo (módulo a módulo, métricas). Mantido pelo skill `movy-doc-sync` — **não renomear** (o automatismo escreve neste caminho). |
| `ROADMAP.md` | **Documento histórico** — registros datados das fases. Não é fonte de verdade do estado atual (as métricas canônicas estão neste índice e no `.tex`). |

## 🎤 Apresentação

| Arquivo | Papel |
|---|---|
| `APRESENTACAO_TCC.md` | Base do roteiro de defesa (linguagem acessível). |

## ⚠️ Pendências para compilar o `.tex`

A pasta [`imagens/`](./imagens/) já existe com um [README](./imagens/README.md) listando as
**4 imagens** que o `DOC-TCC.tex` referencia via `\includegraphics`. Os arquivos `.png` em si
**não estão versionados** — coloque-os lá (ou confirme no **Overleaf**); sem eles o documento
**não fecha** localmente. A bibliografia [`referencias.bib`](./referencias.bib) já está
versionada (`\bibliography{referencias}`).

## 🗄️ Arquivo interno (`_internal/`)

Documentos que **não fazem parte da entrega** e não devem ser apresentados à banca. A pasta
inteira está agora em `.gitignore` (`docs/_internal/`) — fica local, fora do versionamento:

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
