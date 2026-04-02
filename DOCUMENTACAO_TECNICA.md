# Documentação Técnica: Movy API - SaaS de Gerenciamento de Transporte

## 1. Introdução
A Movy API é o núcleo de um ecossistema de software como serviço (SaaS) projetado para otimizar o gerenciamento de transporte coletivo e viagens recorrentes. O sistema permite que organizações de transporte gerenciem frotas, motoristas, rotas e passageiros de forma centralizada e eficiente.

## 2. Metodologia
A metodologia adotada para o desenvolvimento do projeto baseia-se em práticas modernas de engenharia de software, garantindo escalabilidade, manutenibilidade e robustez.

### 2.1 Abordagem de Desenvolvimento
- **Domain-Driven Design (DDD):** Foco no domínio do negócio, utilizando padrões como **Entidades** para representar objetos com identidade (ex: `User`), **Value Objects** para encapsular regras de validação de dados (ex: `Email`, `UserName`) e o **Padrão de Repositório** para abstrair a persistência de dados.
- **Clean Architecture:** Organização do código em camadas concêntricas (Domínio, Aplicação, Infraestrutura, Apresentação), garantindo que as regras de negócio sejam independentes de frameworks externos.
- **Desenvolvimento Modular:** Divisão do sistema em módulos independentes (User, Organization, Trip, etc.), facilitando a manutenção e o crescimento orgânico do projeto.
- **Test-Driven Development (TDD):** Priorização da criação de testes unitários e de integração (utilizando Jest) para garantir a integridade das funcionalidades.

### 2.2 Tecnologias Utilizadas
A stack tecnológica foi selecionada visando alta performance e produtividade:

| Tecnologia           | Função                    | Justificativa                                                |
| :------------------- | :------------------------ | :----------------------------------------------------------- |
| **Node.js (v18+)**   | Ambiente de execução      | Alta performance e ecossistema maduro.                       |
| **NestJS (v11)**     | Framework Backend         | Estrutura modular e suporte nativo a TypeScript.             |
| **TypeScript**       | Linguagem                 | Tipagem estática e redução de erros em tempo de execução.    |
| **Prisma (v7)**      | ORM                       | Tipagem forte para o banco de dados e migrações seguras.     |
| **PostgreSQL**       | Banco de Dados Relacional | Confiabilidade e suporte a consultas complexas.              |
| **Docker**           | Conteinerização           | Padronização do ambiente de desenvolvimento e produção.      |
| **Supabase**         | Infraestrutura/Auth       | Facilita a gestão de autenticação e infraestrutura de nuvem. |
| **Bcrypt**           | Segurança                 | Hash seguro de senhas para proteção de dados sensíveis.      |

---

## 3. Arquitetura do Sistema

### 3.1 Diagrama de Arquitetura de Software
O sistema utiliza uma arquitetura baseada em camadas dentro de cada módulo, seguindo os princípios de Clean Architecture:

```mermaid
graph TD
    subgraph Presentation_Layer
        Controller[Controllers / API REST]
        DTO[DTOs / Request Validation]
    end

    subgraph Application_Layer
        UseCase[Use Cases / Serviços de Aplicação]
    end

    subgraph Domain_Layer
        Entity[Entities / Agregados]
        ValueObjects[Value Objects]
        Interface[Repository Interfaces]
        Errors[Domain Errors]
    end

    subgraph Infrastructure_Layer
        RepoImpl[Prisma Repository Implementation]
        DB[PostgreSQL / Prisma ORM]
        External[External Providers - Hash, Auth]
    end

    Controller --> UseCase
    UseCase --> Entity
    UseCase --> Interface
    RepoImpl -- Implements --> Interface
    RepoImpl --> DB
```

### 3.2 Estrutura de Pastas
A organização do projeto reflete a modularidade e a separação de camadas:
- `src/modules/`: Contém os módulos funcionais do sistema (ex: `user`).
  - `application/`: DTOs e Casos de Uso.
  - `domain/`: Entidades, Value Objects e interfaces de repositório.
  - `infrastructure/`: Implementações de banco de dados e mappers.
  - `presentation/`: Controladores e rotas.
- `src/shared/`: Recursos compartilhados (filtros de exceção, interceptadores, provedores globais).
- `prisma/`: Esquema do banco de dados e arquivos de migração.

---

## 4. Resultados Parciais

Até o momento, o projeto atingiu os seguintes marcos:

### 4.1 Modelagem de Dados Completa
O esquema do banco de dados (`schema.prisma`) foi totalmente desenhado, contemplando:
- Gerenciamento de **Organizações** (Multi-tenancy).
- Planos e Assinaturas (**SaaS model**).
- Gestão de **Frotas** (Veículos e Motoristas).
- Agendamento de **Viagens Recorrentes** e Instâncias de Viagem.
- Sistema de **Inscrições** e **Pagamentos**.

### 4.2 Implementação Completa do Módulo de Usuário (CRUD)
O módulo de usuários foi implementado de forma completa, servindo como um pilar para as demais funcionalidades do sistema. Ele segue rigorosamente os princípios da Clean Architecture e Domain-Driven Design, com uma clara separação de responsabilidades.

As seguintes funcionalidades foram implementadas e validadas:
- **`POST /users`**: Cadastro de novos usuários com validação de DTOs (`CreateUserDto`) e hashing de senha utilizando Bcrypt.
- **`GET /users`**: Lista todos os usuários com status `ACTIVE`, com suporte a **paginação** através dos query parameters `page` e `limit`. A resposta é encapsulada em um DTO paginado, que inclui os dados, o total de itens e informações da página.
- **`GET /users/:id`**: Busca de um usuário específico por ID. A lógica de negócio garante que usuários inativos (soft-deleted) não sejam retornados, resultando em um erro `404 Not Found` para proteger a informação.
- **`PUT /users/:id`**: Atualização dos dados de um usuário. O DTO de atualização (`UpdateUserDto`) foi projetado para permitir apenas a modificação de campos pertinentes, garantindo a imutabilidade de dados sensíveis.
- **`DELETE /users/:id`**: Implementação de **Soft Delete**. Em vez de uma exclusão física, a operação altera o status do usuário para `INACTIVE`. Esta abordagem preserva a integridade referencial dos dados e o histórico do sistema, sendo uma prática recomendada para sistemas complexos.

### 4.3 Infraestrutura de Desenvolvimento
- Configuração de ambiente com Docker e Docker Compose.
- Pipeline de migrações Prisma configurado.
- Sistema global de tratamento de exceções e logs.

---

## 5. Principais Desafios e Soluções

| Desafio                                 | Solução Implementada                                                  | 
|**Multi-tenancy (SaaS)**                 | Implementação do modelo de `Organization` e `OrganizationMembership`, garantindo que dados de diferentes empresas sejam isolados. |
| **Complexidade de Viagens Recorrentes** | Separação em `TripTemplate` (modelo da rota) e `TripInstance` (execução específica), permitindo agendamentos flexíveis.           |
| **Manutenibilidade do Código**          | Adoção de Clean Architecture, que isola as regras de negócio de mudanças em tecnologias externas (como troca de ORM ou Banco de Dados). |
| **Garantia da Integridade dos Dados**   | A validação de dados de domínio (ex: formato de e-mail, comprimento do nome) foi encapsulada em **Value Objects**. Isso substituiu o uso de tipos primitivos (`string`) e validadores espalhados, garantindo que um dado só possa ser instanciado em um estado válido, aumentando a robustez e a segurança do sistema. |
| **Segurança de Dados**                  | Uso de Bcrypt para senhas e validação rigorosa de DTOs para prevenir entradas maliciosas.                                         |
| **Acoplamento da Lógica de Negócio com o Protocolo HTTP** | Inicialmente, os casos de uso lançavam exceções HTTP (ex: `ConflictException`). Isso acoplava a camada de aplicação a detalhes da camada de apresentação. **Solução:** Foi implementado um sistema de **Erros de Domínio** (`DomainError`), onde os casos de uso lançam erros de negócio específicos (ex: `UserEmailAlreadyExistsError`). Um filtro global (`AllExceptionsFilter`) foi modificado para interceptar esses erros de domínio e traduzi-los para os códigos de status HTTP corretos (`409 Conflict`, `404 Not Found`, etc.), garantindo o desacoplamento das camadas. |

---

## 6. Próximos Passos

1. **Implementação do Módulo de Organização:** CRUD de empresas e gestão de membros.
2. **Sistema de Autenticação JWT:** Integração com Supabase Auth ou implementação customizada.
3. **Módulo de Veículos e Motoristas:** Cadastro de frotas e associação com usuários do tipo `DRIVER`.
4. **Módulo de Viagens (Templates e Instâncias):** Lógica para geração automática de viagens recorrentes.
5. **Integração de Pagamentos:** Mock de gateway de pagamento para o MVP.

---

## 7. Conclusão Parcial
O projeto Movy API demonstra uma base sólida e bem estruturada. A escolha de tecnologias modernas aliada a uma arquitetura robusta (DDD/Clean Arch) garante que o sistema possa escalar horizontalmente e suportar a complexidade de um ambiente SaaS multi-tenant. O progresso atual foca na base estrutural, preparando o terreno para as funcionalidades principais de transporte que serão implementadas nas próximas fases.

---

## 8. Apêndice

### 8.1 Comandos Principais
- `npm run start:dev`: Inicia o servidor em modo de desenvolvimento.
- `npx prisma migrate dev`: Aplica novas migrações ao banco de dados.
- `npx prisma studio`: Interface visual para gerenciamento de dados.

### 8.2 Variáveis de Ambiente Necessárias
```env
DATABASE_URL="postgresql://user:password@localhost:5432/movy"
PORT=3000
```