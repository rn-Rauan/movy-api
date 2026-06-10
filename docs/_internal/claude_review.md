O PDF já estava completo no contexto. Vou direto à análise.

---

# Análise Técnica — Movy API

## 1. Problemas Críticos

### JWT sem invalidação de token
A "otimização" de remover `userRepository.findById` do `JwtStrategy.validate()` é o bug de segurança mais sério do sistema. Um usuário soft-deleted, banido ou com role alterada mantém acesso completo até o JWT expirar — e a doc não menciona qual é o TTL do access token. Para um SaaS multi-tenant onde um admin pode ser removido da org, isso é inaceitável mesmo em MVP. A solução mínima seria um TTL curto (15 min) com refresh token funcionando corretamente. O que remete ao próximo ponto.

### `RefreshTokenUseCase` sem testes e sem validação formal
É explicitamente listado como pendente nos testes. O fluxo de refresh é o que mantém sessões longas funcionando — e é exatamente onde costumam aparecer vulnerabilidades de token theft. Sem testes, sem garantia.

### Payment Module é uma casca decorativa
Todo booking cria um Payment com `status: PENDING`. Não existe `UpdatePaymentUseCase`, nenhum webhook, nenhuma integração real. O status **jamais sairá de PENDING**. Isso não é um atalho de MVP aceitável — é um módulo que induz o frontend a mostrar "pagamento pendente" para sempre, o que vai confundir qualquer avaliador da banca que tentar usar o sistema ponta a ponta. Ou você implementa um fluxo simulado mínimo de confirmação (um endpoint `PATCH /payments/:id/confirm` fake), ou remove o módulo da documentação como "funcional".

### Subscriptions expiram no banco mas nunca no sistema
`SubscriptionEntity` tem `expiresAt`, mas não há cron job, worker ou qualquer hook que mude `status` para `CANCELED` quando a data passa. Uma org com subscription vencida há 3 meses ainda aparece como `ACTIVE`. O modelo de monetização inteiro é decorativo no estado atual — e pior, os planos FREE/BASIC/PRO/PREMIUM não limitam nenhuma funcionalidade do sistema. Qualquer org pode criar viagens ilimitadas independente do plano.

---

## 2. Fraquezas da Arquitetura

### `frequency` e `autoCancelEnabled` são campos ornamentais
`TripTemplate` tem `frequency: DayOfWeek[]`, `isRecurring`, `autoCancelEnabled`, `autoCancelOffset` e `minRevenue`. Nenhum desses campos é processado por nada. Não há scheduler, não há geração automática de `TripInstance` a partir do template. O admin precisa criar cada instância manualmente. O campo `frequency` existe no schema mas é somente leitura do ponto de vista da lógica de negócio — o que levanta a questão: por que está na entidade de domínio se o domínio não o usa?

Para TCC isso pode ser justificado como "planejado para fase 4", mas se a banca perguntar como funciona o agendamento recorrente e a resposta for "o admin cria manualmente", vai soar mal dado o nome do campo.

### Três padrões de soft delete no mesmo sistema
| Módulo | Implementação |
|---|---|
| User, Organization, Vehicle | `status: INACTIVE` |
| Membership | `removedAt: timestamp` |
| Subscription | `status: CANCELED` |
| Booking | `status: INACTIVE` |

Isso não é inconsistência cosmética — queries de "listar apenas ativos" precisam de lógica diferente para cada entidade. Um repositório que filtra por `status != INACTIVE` quebra silenciosamente no módulo de membership. A padronização mínima seria: soft delete sempre via campo `deletedAt: DateTime?` (null = ativo), ou sempre via `status`. Misturar é dívida técnica real.

### `FindAllOrganizationsUseCase` vs `FindAllActiveOrganizationsUseCase`
Dois use cases separados para a mesma query com um filtro diferente. Se amanhã surgir `FindAllSuspendedOrganizationsUseCase` você tem um terceiro. Um único use case com `status?: OrganizationStatus` como parâmetro opcional resolve isso e não viola nenhum princípio real — viola apenas uma leitura dogmática de SRP.

### `belongsToOrganization()` via JOIN profundo no Driver
O check de ownership do Driver faz `COUNT` com `user.userRoles.some({ organizationId, removedAt: null, role: { name: 'DRIVER' } })`. Essa query é executada em `FindDriverByIdUseCase`, `UpdateDriverUseCase` e `RemoveDriverUseCase` — 3 operações por request, todas com JOIN N-nível. Se não há índice composto em `(organizationId, removedAt, roleId)` na tabela `OrganizationMembership`, isso vai detonar em qualquer carga real. Para TCC é tolerável, mas deveria estar documentado como trade-off consciente.

### `AsyncLocalStorage` + `UnitOfWork` — complexidade invisível com falha silenciosa
O padrão é tecnicamente correto mas tem uma armadilha: se algum repositório for chamado fora do contexto de execução da transação (por exemplo, em um `Promise.all` com contexto diferente, ou em um evento assíncrono separado), `dbContext.client` retorna o `PrismaService` raiz **sem lançar erro**. A operação executa fora da transação silenciosamente. Não tem como detectar isso em runtime — só em teste de integração, que não existe.

---

## 3. Casos Extremos e Riscos

### Timezone no cancelamento de booking (30 minutos antes)
`CancelBookingUseCase` bloqueia cancelamento dentro de 30 minutos da partida comparando `departureTime` com `new Date()`. Se o servidor está em UTC e a organização é de Manaus (UTC-4), a janela de bloqueio pode começar 4 horas antes ou depois do esperado dependendo de como `departureTime` foi armazenado. A doc não menciona normalização de timezone em lugar nenhum.

### Driver que é também passageiro na própria org
Um usuário com role DRIVER pode fazer booking em uma viagem da sua própria organização. `ConfirmPresenceUseCase` bloqueia o "owner do booking" mas permite org members. O motorista é ao mesmo tempo owner do booking E org member. O código provavelmente vai checar `booking.userId === callerId` primeiro e bloquear, mas o caso deveria estar testado explicitamente.

### `countActiveByTripInstance` não decrementado ao completar viagem
Quando uma `TripInstance` vai para `COMPLETED` ou `CANCELLED`, os bookings `ACTIVE` continuam como `ACTIVE`. Não há `UpdateBookingStatusOnTripCompletionUseCase` ou nada equivalente. Isso significa que `countActiveByTripInstance` para uma trip completada retorna o número original de passageiros — o que pode artificialmente "lotar" trips futuras se a query for reutilizada em contextos errados.

### `DEV_EMAILS` via CSV em variável de ambiente bypassa tudo
`isDev=true` no JWT bypassa `RolesGuard` e `TenantFilterGuard`. Se essa lista vazar (logs, `.env` commitado, etc.), qualquer pessoa com o email na lista tem acesso irrestrito a todos os tenants em produção. Para TCC isso é gerenciável, mas o risco deveria estar explicitado na documentação e a variável nunca deveria aparecer em logs.

### `SubscribeToPlanlUseCase` com Serializable — pode bloquear desnecessariamente
O `findActive() + save()` dentro de transação Serializable para subscription é correto para evitar duplicata, mas Serializable em PostgreSQL pode abortar transações que nem conflitam de verdade (false positive no SSI). Para a frequência de criação de subscriptions (raramente mais de uma por org por mês), o custo é zero na prática — mas se isso for reutilizado como padrão em casos de alta frequência, vai causar problemas.

---

## 4. Lacunas nos Testes

O número de 278 testes soa bem até você olhar o que **não** está coberto:

**Componentes críticos sem cobertura:**
- `AllExceptionsFilter` — o mapeamento código-de-domínio → HTTP status. Um mapeamento errado resulta em HTTP 500 silencioso. Sem teste.
- `JwtStrategy` após a otimização — especificamente o caso de usuário soft-deleted ainda autenticando com token válido.
- `RefreshTokenUseCase` e `RegisterUseCase` — explicitamente pendentes.
- `UnitOfWork` / `DbContext` — o retry de P2034 e o comportamento fora do contexto de transação.
- `UpdateOrganizationUseCase`, `UpdateUserUseCase`, todos os CRUDs de Vehicle e Driver com IDOR.

**Ausência total de testes de integração:**
278 testes unitários com mocks manuais não pegam bugs de mapeamento no Prisma. Um campo nullable que o mapper assume como non-null quebra em runtime e nunca quebra no teste unitário. Para TCC é aceitável não ter integração completa, mas pelo menos os mappers deveriam ter smoke tests contra um banco em memória (SQLite via Prisma adapter).

**Factories mas sem testes de invariante de entidade:**
Existem 20 factories para criar entidades, mas não há testes que verifiquem que as entidades rejeitam estados inválidos — por exemplo, que `TripInstance` não aceita `transitionTo(COMPLETED)` quando está em `DRAFT`. O estado machine tem 15 testes no use case mas nenhum direto na entidade.

---

## 5. Sugestões Práticas (priorizadas)

**P0 — antes de qualquer apresentação:**

1. **Simular confirmação de pagamento.** Criar `PATCH /payments/:id/confirm` com lógica fake (apenas muda status para `COMPLETED`). Sem isso, toda demonstração termina com "pagamento pendente" e a banca vai perguntar.

2. **Documentar explicitamente os atalhos de MVP na doc.** A seção de "Próximos Passos" lista CI/CD mas não lista "geração automática de TripInstances", "expiração de subscriptions" e "integração real de pagamento" como trabalho futuro. A banca precisa ver que você sabe o que está faltando, não descobrir sozinha.

**P1 — antes de conectar o frontend:**

3. **TTL curto no access token + teste do refresh.** 15 minutos de access token e cobrir o `RefreshTokenUseCase` com pelo menos happy path e token expirado.

4. **Padronizar soft delete.** Escolha um padrão (`deletedAt` ou `status`) e aplique consistentemente. Membership com `removedAt` enquanto todo resto usa `status` vai quebrar alguma query de relatório no futuro.

5. **Adicionar teste para `AllExceptionsFilter`.** É 1 arquivo, cobre um componente crítico, e evita que erros de domínio vazem como HTTP 500 na demo.

**P2 — nice to have para o TCC:**

6. **Seed com um plano FREE padrão.** Se a banca criar uma org e não tiver subscription, o modelo de monetização é invisível. Criar auto-subscription FREE no `RegisterOrganizationWithAdminUseCase` tornaria o fluxo completo na demo.

7. **Pelo menos 1 teste de integração por módulo crítico** (Booking + Trip) contra banco real com Docker Compose no CI. Isso eleva a credibilidade técnica do trabalho significativamente.

---

## Frontend: Lovable vs Alternativas

**Lovable** é a escolha mais pragmática para o cenário específico (TCC, prazo curto, backend complexo já pronto). Gera React com shadcn/ui, entende bem contextos de autenticação quando você descreve bem os endpoints.

Mas tem um problema concreto com o seu sistema: Lovable não lida bem com **multi-tenancy com JWT enriquecido**. O JWT do Movy carrega `organizationId` e `role` no payload, e o frontend precisa decodificar isso para decidir o que renderizar. Você vai precisar escrever esse contexto de auth manualmente de qualquer forma.

Sugestão mais eficiente: usar **Lovable para gerar o layout e os componentes visuais**, mas escrever o `AuthContext`, as rotas protegidas e as chamadas de API manualmente em React. Tenta gerar uma tela por vez ao invés de "gera o sistema inteiro" — o resultado é significativamente melhor.

**Bolt.new** é alternativa válida se quiser mais controle sobre o código gerado. **v0 by Vercel** é melhor para componentes isolados, não para uma aplicação com auth.

O risco real não é qual ferramenta escolher — é que o frontend vai expor os buracos do Payment Module e das Subscriptions imediatamente na primeira demo end-to-end.