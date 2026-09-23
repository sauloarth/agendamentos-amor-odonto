# Sistema de agendamentos para clínica odontológica

API base de um sistema de agendamento com autenticação JWT e dois níveis de permissão (`client` e `admin`).

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

## Próximos passos

- Model `Product` (serviços oferecidos)
- Model `Availability` (horários do admin)
- Model `Appointment` (agendamentos) + validação de conflito de horário
- Rotas `/api/appointments` (cliente) e `/api/admin/*` (admin)
- Envio de e-mail com Nodemailer ao criar/cancelar agendamento
