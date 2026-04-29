# Movy — Sistema de Gerenciamento de Transporte Coletivo
### Trabalho de Conclusão de Curso | Documentação para Apresentação

---

## O que é o Movy?

O **Movy** é um sistema de software criado para ajudar empresas de transporte coletivo — como vans escolares, fretamentos e linhas de ônibus — a organizarem seu trabalho do dia a dia de forma digital.

Imagine uma empresa que organiza viagens recorrentes para funcionários de uma fábrica. Hoje, ela controla tudo em planilhas: quais motoristas estão disponíveis, quais vans vão sair, quem se inscreveu em cada viagem, quanto cada passageiro pagou. O Movy substitui esse controle manual por um sistema organizado e acessível pela internet.

---

## Qual problema ele resolve?

Empresas de transporte coletivo enfrentam desafios recorrentes:

- **Controle de frota manual** — não saber quais veículos estão ativos ou inativos
- **Gestão de motoristas descentralizada** — dificuldade de saber quem está disponível
- **Inscrições em papel ou WhatsApp** — sem controle de capacidade por viagem
- **Cobranças informais** — sem registro de pagamentos por passageiro
- **Falta de visibilidade** — gestores sem informações em tempo real

O Movy resolve isso oferecendo um sistema centralizado onde a empresa controla tudo em um só lugar, com acesso via internet.

---

## Como funciona na prática?

O sistema é dividido em áreas de responsabilidade claras:

### Para o Administrador da Empresa (ADMIN)
| O que ele pode fazer | Como o sistema ajuda |
|----------------------|----------------------|
| Cadastrar veículos da frota | Registro com placa, tipo e capacidade |
| Cadastrar motoristas | Vínculo com CNH e categoria habilitada |
| Criar roteiros de viagem | Definir origem, destino, horário e preço |
| Agendar saídas | Criar viagens a partir dos roteiros |
| Ver quem se inscreveu | Lista de passageiros por viagem |
| Confirmar pagamentos | Marcar como pago ou recusado |
| Gerenciar assinatura do plano | Upgrade ou cancelamento do serviço |

### Para o Passageiro (usuário comum)
| O que ele pode fazer | Como o sistema ajuda |
|---|---|
| Criar conta e entrar no sistema | Login seguro com email e senha |
| Ver viagens disponíveis | Consultar roteiros e horários |
| Se inscrever em uma viagem | Reserva de vaga com preço definido pelo sistema |
| Cancelar sua inscrição | Com prazo mínimo de 30 minutos antes da saída |
| Acompanhar seus pagamentos | Histórico de pagamentos por viagem |

### Para o Motorista (DRIVER)
| O que ele pode fazer |
|---|
| Criar seu perfil com dados da CNH |
| Ser vinculado a uma empresa (organização) |
| Ser atribuído a uma viagem pelo admin |

---

## O modelo de negócio (SaaS)

O Movy funciona como um serviço por assinatura — o modelo é chamado de **SaaS** (*Software as a Service*), o mesmo modelo do Spotify, Netflix ou qualquer software vendido como "plano mensal".

Cada empresa que usa o sistema assina um **plano**, e o plano define os limites do que ela pode fazer:

| Plano   | Veículos | Motoristas | Viagens/mês | Preço |
|---------|----------|------------|-------------|-------|
| FREE    | 1        | 1          | 7           | Gratuito |
| BASIC   | 5        | 4          | 60          | R$ 79,90/mês |
| PRO     | 10       | 13         | 200         | R$ 149,90/mês |
| PREMIUM | 100      | 100        | Ilimitado*  | R$ 399,90/mês |

> *9.999 viagens por mês

Quando uma empresa tenta cadastrar mais veículos do que o plano permite, o sistema bloqueia a ação e informa o motivo. Isso é feito de forma automática, sem intervenção humana.

---

## Isolamento entre empresas (Multi-tenancy)

O sistema foi construído para atender **várias empresas ao mesmo tempo**, sem que uma veja os dados da outra. Esse conceito é chamado de **multi-tenancy** (multi-inquilino).

É como um prédio comercial: vários escritórios no mesmo endereço, mas cada um com sua própria chave. Um inquilino não consegue entrar na sala do vizinho.

No Movy:
- Cada empresa tem seu próprio espaço isolado
- Um administrador de uma empresa nunca acessa dados de outra
- A separação é feita automaticamente pelo sistema, com base no token de autenticação do usuário

---

## Segurança do sistema

O acesso ao sistema é protegido por **JWT** (*JSON Web Token*) — um padrão de segurança usado por grandes sistemas como Google e GitHub. Funciona como um "crachá digital": ao fazer login, o sistema emite um token que comprova quem é o usuário e a qual empresa ele pertence. Esse token acompanha todas as requisições.

Além disso, o sistema possui três camadas de controle de acesso:

1. **Autenticação** — "Você está logado?"
2. **Papel (Role)** — "Você é administrador ou passageiro?"
3. **Isolamento de empresa** — "Você pertence a esta empresa?"

As senhas dos usuários nunca são armazenadas diretamente — elas passam por um processo de embaralhamento irreversível chamado **hash** (usando o algoritmo Bcrypt), de forma que nem o próprio sistema consegue ler a senha original.

---

## Arquitetura do software

O projeto foi desenvolvido com um padrão de organização de código chamado **Clean Architecture** (Arquitetura Limpa), combinado com **Domain-Driven Design** (DDD). Em termos simples: o código foi escrito pensando em facilitar manutenção, testes e crescimento futuro.

O sistema é dividido em módulos independentes. Cada módulo cuida de uma área específica:

```
Autenticação       → Login, registro, renovação de sessão
Usuários           → Cadastro e perfil de usuários
Organizações       → Dados e configurações de cada empresa
Motoristas         → Perfil e documentação (CNH)
Veículos           → Frota de cada organização
Roteiros (Templates) → Modelos de viagem recorrente
Viagens (Instâncias) → Saídas agendadas a partir dos roteiros
Inscrições (Bookings)→ Passageiros inscritos em cada viagem
Pagamentos         → Registro e status dos pagamentos
Planos             → Definição dos pacotes de assinatura
Assinaturas        → Contrato ativo de cada empresa com o plano
```

---

## Tecnologias utilizadas

| Tecnologia | Para que serve | Analogia simples |
|---|---|---|
| **Node.js + NestJS** | Motor do servidor | O "motor" que faz o sistema funcionar |
| **TypeScript** | Linguagem de programação | Como escrever código com regras mais rígidas para evitar erros |
| **PostgreSQL** | Banco de dados | A "planilha" onde todos os dados ficam guardados |
| **Prisma** | Ferramenta de acesso ao banco | O "tradutor" entre o código e o banco de dados |
| **Docker** | Conteinerização | Garante que o sistema rode igual em qualquer computador |
| **JWT + Bcrypt** | Segurança | Crachá digital + cofre de senhas |
| **Jest** | Testes automáticos | Verificação automática que o sistema funciona corretamente |

---

## O que já foi desenvolvido

O sistema está **100% funcional** nos seguintes módulos:

| Módulo | Status | Testes automatizados |
|--------|---|---|
| Autenticação (login, registro, tokens) | Completo | Sim (16 testes) |
| Usuários | Completo | Sim |
| Organizações | Completo | Sim |
| Motoristas | Completo | Sim (4 testes) |
| Veículos | Completo | Em progresso |
| Roteiros e Viagens | Completo | Sim (90 testes) |
| Inscrições de passageiros | Completo | Sim (85 testes) |
| Pagamentos | Completo | Em progresso |
| Planos de assinatura | Completo | Sim (5 testes) |
| Assinaturas | Completo | Sim (7 testes) |

**Total de testes automatizados:** 37 suítes de teste, 280 testes passando.

Os testes automatizados são como "verificações" que o computador realiza sozinho para confirmar que cada parte do sistema funciona corretamente. Quando algo é alterado, os testes garantem que a mudança não quebrou nada.

---

## Visão geral do fluxo completo

Abaixo, o caminho completo de uma viagem dentro do sistema:

```
1. Empresa se cadastra no Movy
      ↓
2. Sistema atribui o plano FREE automaticamente
      ↓
3. Admin cadastra veículos e motoristas
      ↓
4. Admin cria um roteiro (origem, destino, preço, dias da semana)
      ↓
5. Admin agenda uma viagem a partir do roteiro
      ↓
6. Admin atribui motorista e veículo à viagem
      ↓
7. Passageiro se inscreve na viagem (sistema verifica vagas disponíveis)
      ↓
8. Sistema registra pagamento como PENDENTE
      ↓
9. Admin confirma o pagamento
      ↓
10. Admin transita o status da viagem: AGENDADA → EM ANDAMENTO → CONCLUÍDA
```

---

## Resumo para apresentação

O **Movy** é um sistema web completo para gestão de transporte coletivo, desenvolvido como TCC. O projeto demonstra na prática conceitos fundamentais da Engenharia de Software:

- **Arquitetura de software** — organização clara e escalável do código
- **Segurança** — autenticação, autorização e proteção de dados
- **Modelo de negócio digital** — sistema SaaS com planos e limites
- **Qualidade de software** — 280 testes automatizados garantindo que o sistema funciona
- **Boas práticas** — código organizado, reutilizável e de fácil manutenção

O sistema está pronto para uso, documentado e com CI/CD configurado (processo automático de verificação e publicação de atualizações no servidor).
