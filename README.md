# Sistema de agendamentos para clínica odontológica

API base de um sistema de agendamento com autenticação JWT e três níveis de permissão (`client`, `professional` e `admin`).

## Setup

1. `npm install`
2. Copie `.env.example` para `.env` e preencha as variáveis de ambiente.
3. `npm run dev` ou `npm start`.

## Criar o primeiro admin

```
npm run seed:admin -- seuemail@exemplo.com senha123 "Seu Nome"
```

## Rotas disponíveis até agora

| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| POST | /api/auth/register | público | Cria usuário como `client` |
| POST | /api/auth/login | público | Retorna token JWT |
| GET | /api/auth/me | autenticado | Retorna dados do usuário logado |
| GET | /api/products | público (opcional) | Lista produtos ativos (admin vê todos); aceita `?professional=<id>` para filtrar |
| GET | /api/products/:id | público (opcional) | Detalha um produto (profissionais vinculados populados) |
| POST | /api/products | admin | Cria produto (aceita `professionals`: IDs de Users com role `professional`) |
| PATCH | /api/products/:id | admin | Atualiza produto (inclui ativar/desativar e alterar `professionals`) |
| GET | /api/blocks | admin, professional | Lista bloqueios (admin: todos; professional: só os seus) |
| GET | /api/blocks/:id | admin, professional (dono) | Detalha um bloqueio |
| POST | /api/blocks | admin, professional | Cria bloqueio (único ou recorrente) |
| PATCH | /api/blocks/:id | admin, professional (dono) | Atualiza bloqueio (inclui ativar/desativar) |
| PATCH | /api/users/:id/role | admin | Alterna papel do usuário entre `client` e `professional` |

## Próximos passos

- Model `Appointment` (agendamentos) + validação de conflito de horário
- Rotas `/api/appointments` (cliente) e `/api/admin/*` (admin)
- Envio de e-mail com Nodemailer ao criar/cancelar agendamento
