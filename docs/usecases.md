# Casos de Uso do Sistema Movy API

Este documento descreve os casos de uso para os diferentes módulos e atores do sistema, com base no schema do banco de dados e na documentação de progresso.

## Atores

- **Administrador do Sistema:** Gerencia as configurações globais da plataforma (ex: planos de assinatura).
- **Administrador da Organização:** Gerencia todos os aspectos de sua organização, incluindo membros, veículos, motoristas e viagens.
- **Motorista:** Usuário com permissões para ser associado a veículos e executar viagens.
- **Passageiro (Usuário Autenticado):** Usuário padrão que pode se inscrever em viagens e realizar pagamentos.
- **Sistema (Processos Automatizados):** Executa tarefas agendadas, como a geração de instâncias de viagem a partir de templates.

---

## Módulo 1: Autenticação e Usuários

### 1.1. Gerenciamento de Contas
- **UC-001:** Registrar um novo usuário na plataforma com nome, email, senha e telefone.
- **UC-002:** Autenticar um usuário (Login) para obter um token de acesso.
- **UC-003:** Atualizar um token de acesso expirado (Refresh Token).
- **UC-004:** Visualizar os próprios dados de perfil.
- **UC-005:** Atualizar os próprios dados de perfil (nome, telefone).
- **UC-006:** Desativar a própria conta (Soft Delete).

---

## Módulo 2: Organizações e Membros (RBAC)

### 2.1. Gerenciamento de Organizações
- **UC-007:** Criar uma nova organização (com nome, CNPJ, email, etc.).
- **UC-008:** Visualizar os detalhes de uma organização específica pelo seu ID ou slug.
- **UC-009:** Listar todas as organizações ativas (com paginação).
- **UC-010:** Atualizar os dados cadastrais de uma organização.
- **UC-011:** Desativar uma organização, mantendo o registro histórico (Soft Delete).

### 2.2. Gerenciamento de Membros
- **UC-012:** Adicionar um usuário existente a uma organização com um papel específico (ADMIN, DRIVER).
- **UC-013:** Listar todos os membros de uma organização, exibindo seus papéis.
- **UC-014:** Remover um membro de uma organização (Soft Delete, registrando `removedAt`).
- **UC-015:** Alterar o papel de um membro dentro da organização.

---

## Módulo 3: Planos de Assinatura do SaaS

Este módulo descreve como as organizações assinam e utilizam a plataforma Movy API dentro de um modelo de negócio Software as a Service (SaaS).

### 3.1. Gerenciamento de Planos (Admin do Sistema)
- **UC-016:** Criar um novo plano de assinatura para o SaaS (ex: FREE, BASIC, PRO, PREMIUM), definindo preço, periodicidade (mensal/anual) e limites de recursos (ex: número máximo de veículos, motoristas, viagens por mês).
- **UC-017:** Listar todos os planos disponíveis.
- **UC-018:** Atualizar os detalhes de um plano.
- **UC-019:** Desativar um plano para novas assinaturas.

### 3.2. Gerenciamento de Assinaturas da Organização
- **UC-020:** Inscrever uma organização em um dos planos de assinatura do SaaS para que ela possa utilizar os serviços da plataforma.
- **UC-021:** Visualizar o status da assinatura de uma organização (Ativa, Cancelada, Vencida).
- **UC-022:** Cancelar a assinatura de um plano.
- **UC-023:** (Sistema) Verificar e atualizar o status da assinatura (ex: marcar como `PAST_DUE` se o pagamento falhar).

---

## Módulo 4: Frota (Veículos e Motoristas)

### 4.1. Gerenciamento de Veículos
- **UC-024:** Registrar um novo veículo para uma organização (placa, modelo, capacidade máxima).
- **UC-025:** Listar todos os veículos de uma organização.
- **UC-026:** Visualizar os detalhes de um veículo específico.
- **UC-027:** Atualizar os dados de um veículo.
- **UC-028:** Alterar o status de um veículo (Ativo, Inativo).

### 4.2. Gerenciamento de Motoristas
- **UC-029:** Registrar um usuário como motorista, fornecendo dados da CNH.
- **UC-030:** Listar todos os motoristas de uma organização.
- **UC-031:** Visualizar os detalhes de um motorista.
- **UC-032:** Atualizar os dados de um motorista (ex: categoria da CNH).

---

## Módulo 5: Viagens (Templates e Instâncias)

### 5.1. Gerenciamento de Templates de Viagem
- **UC-033:** Criar um template de viagem com rota (partida, destino), paradas, e preços para cada tipo de rota (ida, volta, ida e volta).
- **UC-034:** Definir um template como recorrente, especificando os dias da semana e o turno (Manhã, Tarde, Noite).
- **UC-035:** Listar todos os templates de viagem de uma organização.
- **UC-036:** Atualizar um template de viagem.
- **UC-037:** Desativar um template de viagem.
- **UC-038:** Marcar um template como público (visível para outras organizações) ou privado.

### 5.2. Gerenciamento de Instâncias de Viagem
- **UC-039:** (Sistema) Gerar instâncias de viagem automaticamente a partir de templates recorrentes (via CRON job).
- **UC-040:** Listar instâncias de viagem com filtros (por data, status, motorista).
- **UC-041:** Visualizar os detalhes de uma instância de viagem (motorista, veículo, capacidade total, status).
- **UC-042:** Atribuir/alterar um motorista e um veículo a uma instância de viagem agendada.
- **UC-043:** (Motorista) Iniciar uma viagem (alterar status para `IN_PROGRESS`).
- **UC-044:** (Motorista) Finalizar uma viagem (alterar status para `FINISHED`).
- **UC-045:** (Admin da Org) Cancelar uma instância de viagem (alterar status para `CANCELED`).

---

## Módulo 6: Inscrições e Pagamentos (Enrollments)

### 6.1. Gerenciamento de Inscrições
- **UC-046:** (Passageiro) Inscrever-se em uma instância de viagem.
- **UC-047:** (Passageiro) Escolher o tipo de rota (ida, volta, ida e volta) e os pontos de embarque/desembarque ao se inscrever.
- **UC-048:** (Passageiro) Visualizar o histórico de suas inscrições (viagens futuras e passadas).
- **UC-049:** (Passageiro) Cancelar uma inscrição em uma viagem (alterar status para `INACTIVE`).
- **UC-050:** (Admin da Org / Motorista) Listar todos os passageiros inscritos em uma viagem.
- **UC-051:** (Admin da Org / Motorista) Confirmar a presença de um passageiro a bordo.

### 6.2. Gerenciamento de Pagamentos
- **UC-052:** (Passageiro) Realizar o pagamento de uma inscrição, escolhendo o método (Dinheiro, PIX, Cartão).
- **UC-053:** (Sistema) Receber a confirmação de pagamento de um gateway externo e associá-la à inscrição.
- **UC-054:** (Sistema) Atualizar o status do pagamento para `COMPLETED` ou `FAILED`.
- **UC-055:** (Admin da Org) Visualizar o histórico de pagamentos relacionados às viagens de sua organização.

---

## Módulo 7: Auditoria

- **UC-056:** (Sistema) Registrar ações importantes realizadas por usuários (ex: criação de organização, remoção de membro) em um log de auditoria.
- **UC-057:** (Admin da Org) Visualizar os logs de auditoria de sua organização para rastrear atividades.

---

## Histórias de Usuário

Esta seção traduz os casos de uso para o formato de Histórias de Usuário, focando no ator, na ação desejada e no objetivo final.

### Módulo 1: Autenticação e Usuários
- **Como um novo usuário,** quero **me registrar na plataforma** para **ter acesso às funcionalidades.**
- **Como um usuário registrado,** quero **fazer login** para **acessar minha conta de forma segura.**
- **Como um usuário autenticado,** quero **visualizar e atualizar meu perfil** para **manter minhas informações corretas.**
- **Como um usuário,** quero **desativar minha conta** para **remover minha presença da plataforma se eu desejar.**

### Módulo 2: Organizações e Membros
- **Como um novo cliente,** quero **criar uma organização** para **começar a gerenciar minhas frotas e viagens.**
- **Como um administrador de organização,** quero **visualizar e atualizar os dados da minha organização** para **manter as informações cadastrais sempre corretas.**
- **Como um administrador de organização,** quero **adicionar usuários como membros com papéis específicos** para **delegar responsabilidades, como motoristas ou outros administradores.**
- **Como um administrador de organização,** quero **remover um membro** para **revogar seu acesso quando ele não fizer mais parte da equipe.**
- **Como um administrador de organização,** quero **alterar o papel de um membro** para **ajustar suas permissões de acordo com sua função.**

### Módulo 3: Planos de Assinatura do SaaS
- **Como um administrador do sistema,** quero **criar e gerenciar os planos de assinatura do SaaS (FREE, BASIC, PRO, PREMIUM)** para **oferecer diferentes níveis de serviço e monetizar a plataforma.**
- **Como um administrador de organização,** quero **assinar um dos planos (ex: PRO)** para **desbloquear as funcionalidades e os limites necessários para a operação da minha empresa.**
- **Como um administrador de organização,** quero **visualizar e gerenciar minha assinatura** para **ter controle sobre os custos e o serviço que minha organização está consumindo.**

### Módulo 4: Frota (Veículos e Motoristas)
- **Como um administrador de organização,** quero **registrar um novo veículo** para **incluí-lo na minha frota disponível para viagens.**
- **Como um administrador de organização,** quero **listar e gerenciar meus veículos** para **ter uma visão geral da minha frota e manter seus dados atualizados.**
- **Como um administrador de organização,** quero **registrar um usuário como motorista** para **habilitá-lo a conduzir os veículos da organização.**
- **Como um administrador de organização,** quero **listar e gerenciar meus motoristas** para **saber quem está apto a realizar viagens.**

### Módulo 5: Viagens (Templates e Instâncias)
- **Como um administrador de organização,** quero **criar um template de viagem com rotas, paradas e preços** para **padronizar e agilizar a criação de viagens frequentes.**
- **Como um administrador de organização,** quero **definir um template como recorrente** para **automatizar a criação de viagens que acontecem regularmente.**
- **Como um administrador de organização,** quero **atribuir um motorista e um veículo a uma viagem agendada** para **garantir que a viagem tenha os recursos necessários para acontecer.**
- **Como um motorista,** quero **iniciar e finalizar uma viagem** para **sinalizar o progresso da viagem em tempo real para os passageiros e administradores.**
- **Como um administrador de organização,** quero **cancelar uma viagem** para **lidar com imprevistos e notificar os envolvidos.**

### Módulo 6: Inscrições e Pagamentos
- **Como um passageiro,** quero **me inscrever em uma viagem** para **garantir meu lugar no transporte.**
- **Como um passageiro,** quero **escolher meus pontos de embarque e desembarque** para **personalizar minha rota de acordo com minha necessidade.**
- **Como um passageiro,** quero **visualizar meu histórico de viagens** para **ter um registro das minhas atividades.**
- **Como um passageiro,** quero **cancelar uma inscrição** para **liberar minha vaga caso eu não possa mais viajar.**
- **Como um motorista,** quero **listar os passageiros inscritos** para **saber quem esperar na viagem.**
- **Como um motorista,** quero **confirmar a presença de um passageiro** para **ter um controle de quem embarcou.**
- **Como um passageiro,** quero **realizar o pagamento da minha inscrição** para **confirmar minha participação na viagem.**
- **Como um administrador de organização,** quero **visualizar o histórico de pagamentos** para **ter um controle financeiro das viagens.**

### Módulo 7: Auditoria
- **Como um administrador de organização,** quero **visualizar um log de auditoria** para **rastrear ações importantes e garantir a segurança e conformidade das operações.**