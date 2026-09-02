# Lixo Zero API

Backend da aplicação **CaxiasLixoZero** — API REST para cadastro de usuários, categorias e ações ambientais, com autenticação JWT e fluxo de aprovação administrativa.

**Stack:** Node.js 20 · TypeScript · Express · Prisma · PostgreSQL

## Pré-requisitos

- Node.js 20+
- PostgreSQL (local ou via Docker)

## Rodar localmente

```bash
# 1. Variáveis de ambiente
cp .env.example .env

# 2. Banco (opcional — sobe só o Postgres)
docker compose up lixozero-db -d

# 3. Dependências e migrations
npm install
npx prisma migrate deploy

# 4. Desenvolvimento
npm run start:dev
```

A API sobe em `http://localhost:3000` (ou na porta definida em `PORT`).

### Variáveis de ambiente

| Variável | Descrição |
|----------|-----------|
| `PORT` | Porta do servidor (padrão: `3000`) |
| `DATABASE_URL` | Connection string do PostgreSQL |
| `SECRET_KEY` | Chave para assinatura do JWT |
| `JWT_EXPIRES_IN` | Expiração do token (padrão: `24h`) |
| `CORS_ORIGIN` | Origens permitidas (`*` ou vazio libera qualquer origem) |
| `RATE_LIMIT_ENABLED` | `true` ativa rate limiting; `false` desativa |
| `GMAIL_USER` / `GMAIL_PASS` | Credenciais SMTP (envio de e-mails) |
| `DB_PASSWORD` | Senha do Postgres no Docker Compose |

Limites de rate limiting (opcionais, com defaults no `.env.example`): `RATE_LIMIT_GLOBAL_*`, `RATE_LIMIT_AUTH_*`, `RATE_LIMIT_REGISTER_*`, `RATE_LIMIT_PUBLIC_READ_*`.

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run start:dev` | Desenvolvimento com hot reload (`tsx watch`) |
| `npm run typecheck` | Checagem de tipos (`tsc --noEmit`) |
| `npm run build` | Compila com `tsc`, reescreve `@/` (`tsc-alias`) e copia templates `.ejs` |
| `npm run start` | Produção (migrations + `node dist/server.js`) |
| `npm run lint` | ESLint |

## Primeiro administrador

Todo cadastro pela API nasce como usuário comum (`tipo = '1'`). Não existe endpoint para promover alguém, então em um ambiente novo é preciso criar o primeiro admin manualmente:

```sql
UPDATE "Usuario" SET tipo = '0' WHERE email = 'admin@exemplo.com';
```

Sem esse passo a fila de moderação de ações fica inacessível.

## Documentação

Comece por [`AGENTS.md`](AGENTS.md) — é o resumo do projeto e o ponto de entrada, tanto para pessoas quanto para agentes de IA.

| Documento | Conteúdo |
|-----------|----------|
| [`docs/CONTEXTO_E_DOMINIO.md`](docs/CONTEXTO_E_DOMINIO.md) | O que o sistema resolve, papéis, ciclo de vida da ação, regras de validação, e-mails |
| [`docs/ARQUITETURA.md`](docs/ARQUITETURA.md) | Camadas, fluxo de uma requisição, casos de uso, build, Docker |
| [`docs/API.md`](docs/API.md) | Todos os endpoints com payloads, filtros, respostas e códigos de erro |
| [`docs/MODELO_DE_DADOS.md`](docs/MODELO_DE_DADOS.md) | Schema Prisma, enums, relacionamentos, migrations |
| [`docs/SEGURANCA.md`](docs/SEGURANCA.md) | JWT, autorização, rate limiting, CORS, sanitização de saída |
| [`docs/PONTOS_DE_ATENCAO.md`](docs/PONTOS_DE_ATENCAO.md) | Bugs conhecidos, dívidas técnicas, código morto, armadilhas |
