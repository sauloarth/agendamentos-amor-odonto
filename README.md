# Amor Odonto — API de Agendamentos

API REST para agendamento de consultas em clínica odontológica. Pacientes consultam horários livres e agendam procedimentos; profissionais gerenciam a própria agenda e bloqueios; a administração controla procedimentos, equipe e todos os agendamentos.

**Stack:** Node.js 18+ · TypeScript · Express · MongoDB (Mongoose) · Zod · JWT

## Sumário

- [Funcionalidades](#funcionalidades)
- [Primeiros passos](#primeiros-passos)
- [Documentação da API](#documentação-da-api)
- [Papéis e permissões](#papéis-e-permissões)
- [Regras de agendamento](#regras-de-agendamento)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Testes](#testes)
- [Scripts](#scripts)
- [Próximos passos](#próximos-passos)

## Funcionalidades

- **Autenticação JWT** com três papéis: `client`, `professional` e `admin`.
- **Produtos** (procedimentos) com duração, preço, ativação/desativação e profissionais vinculados.
- **Bloqueios de agenda** únicos (ex.: uma tarde) ou recorrentes (ex.: almoço de segunda a sexta), por profissional ou para a clínica inteira.
- **Disponibilidade**: cálculo dos horários livres de um profissional para um procedimento em um período.
- **Agendamentos** com validação de conflitos, listagem por papel e cancelamento.
- **Documentação interativa** OpenAPI 3.0 com Swagger UI.

## Primeiros passos

### Pré-requisitos

- Node.js 18 ou superior
- Uma instância MongoDB (local ou Atlas)

### Instalação

```bash
npm install
```

### Variáveis de ambiente

Copie o `.env.example` para `.env` na raiz do projeto e ajuste os valores:

```bash
cp .env.example .env
```

| Variável | Obrigatória | Padrão | Descrição |
|---|---|---|---|
| `MONGO_URI` | sim | — | String de conexão do MongoDB. Sem ela o servidor encerra na inicialização. |
| `JWT_SECRET` | sim | — | Segredo usado para assinar e validar os tokens. |
| `JWT_EXPIRES_IN` | não | `7d` | Validade do token (formato do `jsonwebtoken`, ex.: `12h`, `7d`). |
| `PORT` | não | `3000` | Porta HTTP. |
| `TZ` | recomendada | fuso do SO | Fuso horário do processo. Veja [Regras de agendamento](#regras-de-agendamento). |
| `SMTP_HOST` | para enviar e-mail | — | Servidor SMTP. Só é exigida quando um e-mail é enviado. |
| `SMTP_PORT` | não | `587` | Porta SMTP. |
| `SMTP_SECURE` | não | `false` | `true` para TLS direto (porta 465); `false` usa STARTTLS. |
| `SMTP_USER` / `SMTP_PASS` | não | — | Credenciais SMTP; a autenticação só é usada se ambas estiverem definidas. |
| `EMAIL_FROM` | para enviar e-mail | — | Remetente, ex.: `"Amor Odonto <nao-responda@example.com>"`. |

### Criar o primeiro admin

O cadastro público cria apenas pacientes (`client`). O primeiro administrador é criado direto no banco:

```bash
npm run seed:admin -- admin@exemplo.com senha123 "Nome do Admin"
```

### Executar

```bash
npm run dev      # desenvolvimento, com hot reload
# ou
npm run build && npm start   # produção
```

A API sobe em `http://localhost:3000`.

## Documentação da API

Com o servidor rodando:

- **Swagger UI:** http://localhost:3000/api/docs
- **Especificação OpenAPI (JSON):** http://localhost:3000/api/docs.json

Para testar rotas protegidas no Swagger UI, faça login em `POST /api/auth/login`, clique em **Authorize** e cole o `token` retornado.

A especificação fica em [`src/docs/openapi.json`](src/docs/openapi.json) e é mantida manualmente: ao criar ou alterar um endpoint, atualize-a também.

### Visão geral dos recursos

| Recurso | Base | Descrição |
|---|---|---|
| Auth | `/api/auth` | Cadastro, login e dados do usuário logado |
| Produtos | `/api/products` | Procedimentos oferecidos pela clínica |
| Bloqueios | `/api/blocks` | Períodos em que não é possível agendar |
| Usuários | `/api/users` | Alteração de papel (`client` ↔ `professional`) |
| Agendamentos | `/api/appointments` | Criação, consulta e cancelamento |
| Disponibilidade | `/api/availability` | Horários livres de um profissional para um procedimento |

## Papéis e permissões

| Papel | Como é criado | O que pode fazer |
|---|---|---|
| `client` | `POST /api/auth/register` | Ver procedimentos e horários livres; criar, listar e cancelar os **próprios** agendamentos. |
| `professional` | Admin promove um `client` via `PATCH /api/users/:id/role` | Ver a **própria** agenda; cancelar agendamentos em que participa; criar e editar os **próprios** bloqueios. |
| `admin` | `npm run seed:admin` | Acesso total: procedimentos, bloqueios de qualquer profissional ou da clínica, papéis de usuários e todos os agendamentos. |

Observações:

- Rotas de listagem de produtos e disponibilidade são públicas; com token de admin, a listagem de produtos inclui os inativos.
- Recursos de outros usuários retornam `404` (e não `403`), para não revelar a existência deles.
- Quando um `professional` volta a ser `client`, ele é removido automaticamente de todos os produtos.

## Regras de agendamento

Um agendamento só é criado quando:

1. o produto existe e está ativo;
2. o profissional tem papel `professional` e está vinculado ao produto;
3. o início é no futuro; o fim é calculado como início + duração do produto;
4. o horário não ultrapassa a meia-noite;
5. não há conflito com outro agendamento ativo do profissional (`409`);
6. não há conflito com bloqueios ativos do profissional ou da clínica (`409`).

A consulta de disponibilidade (`GET /api/availability`) aplica as mesmas regras e aceita períodos de até **90 dias**. Os horários são gerados em sequência a partir de `dateStart`, com a duração do produto.

> **Fuso horário:** bloqueios recorrentes (`startTime`/`endTime` em `HH:mm`, `daysOfWeek`) e a regra da meia-noite usam o **fuso local do processo Node**. Em produção, defina `TZ` com o fuso da clínica (ex.: `America/Sao_Paulo`); caso contrário, servidores em UTC vão deslocar esses horários.

## Estrutura do projeto

```
src/
├── app.ts             # App Express: middlewares, rotas e Swagger
├── server.ts          # Conecta no MongoDB e sobe o servidor HTTP
├── config/db.ts       # Conexão com o MongoDB
├── routes/            # Verbos/rotas + middlewares de auth e validação
├── controllers/       # Camada HTTP (req/res)
├── services/          # Regras de negócio
├── models/            # Schemas Mongoose
├── validations/       # Schemas Zod de entrada
├── middleware/        # authenticate, authorize, validate, errorHandler
├── utils/             # AppError, asyncHandler
├── docs/openapi.json  # Especificação OpenAPI
└── scripts/seedAdmin.ts
```

Fluxo de uma requisição: `route → authenticate/authorize → validateBody/validateQuery (Zod) → controller → service → model`. Erros de negócio são lançados como `AppError(mensagem, status)` e convertidos em resposta JSON pelo `errorHandler`.

Formato das respostas de erro:

```json
{ "message": "Horário indisponível para este profissional" }
```

```json
{ "message": "Dados inválidos", "errors": [{ "field": "email", "message": "E-mail inválido" }] }
```

## Testes

Testes de aceitação em [Cucumber](https://cucumber.io/) (Gherkin, em inglês) que exercitam a API via HTTP de ponta a ponta, usando um MongoDB em memória ([mongodb-memory-server](https://github.com/typegoose/mongodb-memory-server)). Não é preciso ter MongoDB nem `.env`.

```bash
npm test
```

> A primeira execução baixa o binário do MongoDB, o que pode levar alguns segundos.

```
features/
├── *.feature                 # Cenários por recurso (auth, products, blocks, users, appointments, availability)
├── step_definitions/         # Passos reutilizáveis (requisições, asserções, fixtures)
└── support/                  # World (cliente HTTP + estado), hooks do banco, datas relativas
```

Convenções usadas nos cenários:

- `Given a client "joao"` cria o usuário `joao@test.com` (senha `secret123`) já com token; também há `a professional` e `an admin`.
- Caminhos e corpos JSON aceitam placeholders: `{user:ana}`, `{product:Cleaning}`, `{block:lunch}`, `{appointment:A1}` viram o ID da entidade, e `{date:tomorrow at 10:00}` vira uma data ISO. Formatos de data aceitos: `today`, `tomorrow`, `yesterday`, `in N days` e `next monday`, sempre seguidos de `at HH:mm`.
- Os testes rodam no fuso `America/Sao_Paulo` e o banco é limpo antes de cada cenário.
- Cenários marcados com `@known-bug` documentam bugs ainda não corrigidos. Eles ficam fora do `npm test` e podem ser rodados com `npx cucumber-js --profile known-bugs`.

## Scripts

| Comando | Descrição |
|---|---|
| `npm run dev` | Servidor em modo desenvolvimento (`tsx watch`) |
| `npm run build` | Compila TypeScript para `dist/` |
| `npm start` | Executa a build compilada |
| `npm test` | Roda os testes de aceitação (Cucumber) |
| `npm run seed:admin -- <email> <senha> "<nome>"` | Cria um usuário admin |

O projeto ainda não tem lint configurado.

## Próximos passos

- Envio de e-mail ao criar ou cancelar agendamentos (o serviço genérico já existe em `src/services/emailService.ts`)
