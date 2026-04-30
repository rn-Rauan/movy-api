---
name: movy-doc-sync
description: 'Sync technical documentation after a module is added or changed. Updates DOCUMENTACAO_TECNICA.md (module section, test table, metrics) and DOC-TCC.tex (module description, test table, metrics table). Optionally updates MOVY_BRAIN.md for architectural changes.'
argument-hint: 'module name (e.g. vehicle, bookings) or "all" to sync everything'
---

# Movy Doc Sync — Documentation Synchronization

> Mantém a documentação técnica em sincronia com o código após mudanças em módulos.
> Conhecimento base: [MOVY_BRAIN.md](../../MOVY_BRAIN.md)

---

## When to Use

- "atualiza a documentação do módulo de bookings"
- "sincroniza a doc técnica depois de implementar o planos module"
- "atualiza o TCC com as métricas novas"
- Após qualquer adição ou remoção de use case, endpoint ou teste
- Após mudar o número total de testes ou suites
- Após adicionar um módulo novo

---

## Pre-Flight Checklist

- [ ] Argumento recebido: `<module-name>` ou `all`
- [ ] Identificar o que mudou: use cases, endpoints, testes, ou estrutura arquitetural?
- [ ] Os arquivos de documentação existem?
  - `docs/DOCUMENTACAO_TECNICA.md`
  - `docs/DOC-TCC.tex`
  - `.github/MOVY_BRAIN.md`

---

## Procedure

### Passo 1 — Coletar Estado Atual do Módulo

Ler os arquivos de código para extrair informações reais:

**Use Cases** — listar todos em `src/modules/<name>/application/use-cases/`:
```
CreateXUseCase, FindXByIdUseCase, UpdateXUseCase, ...
```

**Endpoints** — extrair do controller `src/modules/<name>/presentation/controllers/<name>.controller.ts`:
```
POST /resources, GET /resources/:id, ...
```

**Testes** — contar em `test/modules/<name>/application/use-cases/*.spec.ts`:
- Total de `describe()` blocos = suites
- Total de `it()` blocos = testes
- Listar cada use case com seu número de testes

**Domain Errors** — listar de `src/modules/<name>/domain/errors/<name>.errors.ts`

**Value Objects** — listar de `src/modules/<name>/domain/entities/` ou `value-objects/`

---

### Passo 2 — Atualizar DOCUMENTACAO_TECNICA.md

Localizar a seção do módulo no arquivo `docs/DOCUMENTACAO_TECNICA.md`.

Se o módulo **já existe** na doc: atualizar a seção existente com:
- Lista de use cases atualizada
- Endpoints atuais (verificar contra controller real)
- Domain errors atuais
- Contagem de testes atualizada
- Remover referências a decisões arquiteturais antigas (ex: "redesenhado em X Abr")

Se o módulo **não existe** na doc: adicionar nova seção seguindo o padrão:

```markdown
### X.Y Módulo de <Name>

**Descrição**: <uma linha descrevendo o propósito do módulo> (Status: Implementado).

**Use Cases Implementados (<N> total)**:
1. `CreateXUseCase`: <descrição>
2. `FindXByIdUseCase`: <descrição>
...

**Endpoints REST**:
| Método | Rota | Auth | O que faz |
|--------|------|------|-----------|
| POST | `/resources` | JWT + ADMIN | Cria recurso |
...

**Value Objects** (se houver):
- **`XValueObject`**: <validação>

**Erros de Domínio**:
| Error | Código | HTTP |
|-------|--------|------|
| `XNotFoundError` | `X_NOT_FOUND` | 404 |
...
```

---

### Passo 3 — Atualizar Tabela de Testes na DOCUMENTACAO_TECNICA.md

Localizar a tabela de testes unitários (seção "Infraestrutura de Testes Unitários"):

**Adicionar ou atualizar linhas** para o módulo:
```markdown
| `CreateXUseCase` | N | <cenários cobertos> |
```

Atualizar o **total** no rodapé da tabela.

---

### Passo 4 — Atualizar DOC-TCC.tex

#### 4a. Seção do Módulo

Localizar a subsubsection do módulo em `\section{Implementação e Resultados Alcançados}`.

Atualizar:
- Número de use cases
- Listagem de use cases com `\enumerate`
- Endpoints no `\lstlisting`
- Erros de domínio (se em tabela)
- Value Objects

Se módulo novo: adicionar nova `\subsubsection{}` seguindo o padrão dos existentes.

#### 4b. Tabela de Testes

Localizar `\label{tab:testes}` e atualizar as linhas do módulo:
```latex
<Module> & <UseCaseName> & <N> \\
```
Atualizar o `\textbf{Total}` no rodapé.

#### 4c. Tabela de Métricas

Localizar `\label{tab:metricas_projeto}` e atualizar:
```latex
Módulos & <N> & <N> (100\%) \\
Use Cases & <N>+ & <N>+ (100\%) \\
Endpoints REST & <N>+ & <N>+ (100\%) \\
Cobertura de Testes (Use Cases críticos) & <N> suites & <N> testes \\
```

#### 4d. Resumo Executivo

Localizar o primeiro parágrafo (após `\section*{Resumo}`) e atualizar:
- Número de módulos
- Número de testes e suites

```latex
O sistema está 100\% concluído (<N> módulos implementados)...
com infraestrutura de testes unitários composta por <N> testes em <N> suites.
```

---

### Passo 5 — Atualizar MOVY_BRAIN.md (apenas para mudanças arquiteturais)

Atualizar apenas se houver **mudança arquitetural** (não mera adição de use case):
- Novo módulo → adicionar seção em `## 3. MÓDULOS IMPLEMENTADOS`
- Novo padrão adotado → adicionar em `## 12. ARMADILHAS CONHECIDAS` ou `## 2. ARQUITETURA`
- Novo enum no schema → atualizar `## 5. SCHEMA PRISMA — ENUMS`
- Nova variável de ambiente → atualizar `## 9. VARIÁVEIS DE AMBIENTE`

**Não atualizar** MOVY_BRAIN.md para:
- Adição de use cases dentro de um módulo já documentado
- Mudanças de endpoint menores
- Correções de bugs

---

### Passo 6 — Verificação Final

Conferir consistência entre documentação e código:

- [ ] Total de módulos em DOC-TCC.tex == número de pastas em `src/modules/`
- [ ] Total de testes em DOC-TCC.tex == saída real de `npx jest --config test/jest-unit.json`
- [ ] Endpoints documentados == endpoints no controller real
- [ ] Use cases documentados == arquivos em `application/use-cases/`
- [ ] Nenhuma referência a "em andamento", "pendente" ou "fase X" para módulos já implementados

---

## Números Atuais para Referência (estado em Abr 2026)

> Atualizar conforme o projeto evolui.

| Métrica | Valor |
|---------|-------|
| Módulos | 13 |
| Use Cases | 50+ |
| Endpoints REST | 55+ |
| Suites de teste | 37 |
| Total de testes | 280 |
| Factories de teste | 20 |

---

## Quick Reference

| O que mudou | Arquivos a editar |
|---|---|
| Novo use case | DOCUMENTACAO_TECNICA (seção do módulo + tabela de testes), DOC-TCC (idem) |
| Novo endpoint | DOCUMENTACAO_TECNICA (endpoints do módulo), DOC-TCC (lstlisting) |
| Novo módulo completo | DOCUMENTACAO_TECNICA (nova seção), DOC-TCC (nova subsubsection + todas as tabelas), MOVY_BRAIN (nova seção em módulos) |
| Novos testes | DOCUMENTACAO_TECNICA (tabela de testes), DOC-TCC (tabela de testes + resumo) |
| Mudança arquitetural | DOCUMENTACAO_TECNICA, DOC-TCC, MOVY_BRAIN |
