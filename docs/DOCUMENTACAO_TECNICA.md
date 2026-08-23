# Documentação Técnica — Lixo Zero API

> Documento gerado a partir da análise do código-fonte. Objetivo: servir como contexto para desenvolvimento, manutenção e geração de código assistida por IA.

---

## 1. Visão geral

**Lixo Zero API** (`lixo-zero-api`) é o backend da aplicação **CaxiasLixoZero** — plataforma para cadastro e gestão de ações ambientais (eventos de conscientização, coleta, reciclagem etc.).

| Item | Valor |
|------|-------|
| Nome do pacote | `lixo-zero-api` |
| Versão | `1.0.0` |
| Autor | Zerium |
| Linguagem | TypeScript (strict mode) |
| Runtime | Node.js 20 |
| Framework HTTP | Express 4 |
| ORM | Prisma 5 + PostgreSQL |
| Porta padrão | `3000` (via `PORT`) |
| Fuso horário (Docker) | `America/Sao_Paulo` |

---

## 2. Propósito de negócio

A API permite:

1. **Cadastro de usuários** (organizadores de ações)
2. **Autenticação** via JWT
3. **Gestão de categorias** de ações (ex.: Reciclagem, Coleta seletiva)
4. **Cadastro de ações** com fluxo de aprovação administrativa
5. **Notificações por e-mail** (cadastro, aprovação e reprovação de ações)

### Fluxo principal de uma ação

```
Usuário autenticado cria ação
        ↓
Situação inicial: Pendente ('0')
        ↓
E-mail de confirmação de cadastro enviado ao responsável
        ↓
Admin aprova ('1') ou reprova ('2') via PUT /acoes/:id
        ↓
E-mail de aprovação ou reprovação enviado ao responsável
```

---

## 3. Arquitetura

O projeto segue uma **arquitetura em camadas inspirada em Clean Architecture / DDD**, com separação clara de responsabilidades.

```
src/
├── server.ts                          # Entry point — sobe o servidor HTTP
├── app.ts                             # Bootstrap Express (Helmet, CORS, JSON, rotas)
│
├── domain/                            # Regras de negócio puras
│   ├── acao/
│   │   ├── entity/Acao.ts             # Entidade com validações de criação
│   │   ├── enum/                      # Situação, forma de realização, tipo de público
│   │   └── repository/IAcaoRepository.ts
│   ├── categoria/
│   │   ├── entity/Categoria.ts
│   │   └── repository/ICategoriaRepository.ts
│   ├── usuario/
│   │   ├── entity/Usuario.ts          # Hash de senha (bcrypt), tipos de usuário
│   │   └── repository/IUsuarioRepository.ts
│   └── email/
│       ├── entity/Email.ts
│       └── service/IEmailService.ts
│
├── application/                       # Casos de uso e implementações de infraestrutura
│   ├── usecases/                      # Um use case por operação (padrão executar)
│   ├── repositories/                  # Implementações Prisma dos repositórios
│   └── services/email/NodemailerService.ts
│
├── infrastructure/                    # Adaptadores externos
│   ├── http/
│   │   ├── config/                    # Configurações HTTP (CORS, rate limit)
│   │   ├── routes/                    # Definição de rotas REST
│   │   ├── controllers/               # Orquestração request → use case → response
│   │   └── middlewares/               # Autenticação JWT (obrigatória/opcional) e admin
│   └── smtp/templates/                # Templates EJS para e-mails
│
└── shared/                            # Utilitários e singletons
    ├── types/                         # Tipos compartilhados (ex.: UsuarioAutenticado)
    ├── package/prisma/                # Instância global do PrismaClient
    ├── package/nodemailer/            # Transportador SMTP (Gmail)
    └── utils/
```

### Padrões adotados

| Padrão | Como é aplicado |
|--------|-----------------|
| **Use Case** | Interface `Usecase<Entrada, Saída>` com método `executar()` |
| **Repository** | Interface no `domain/`, implementação Prisma em `application/repositories/` |
| **Entity** | Classes com factory methods (`criarNovo*`, `carregar*Existente`) e validações internas |
| **Controller** | Instancia repositórios e use cases diretamente (sem container de DI) |
| **DTO** | Tipos `*EntradaDTO` e `*SaidaDTO` por use case |

### Diagrama de dependências

```
HTTP Request
    → Route (middlewares)
        → Controller
            → Use Case
                → Entity (validação)
                → Repository Interface
                    → Prisma Repository
                        → PostgreSQL
                → Email Service (quando aplicável)
                    → Nodemailer → Gmail SMTP
```

---

## 4. Stack tecnológica

### Dependências de produção

| Pacote | Uso |
|--------|-----|
| `express` | Servidor HTTP |
| `cors` | CORS configurável via `CORS_ORIGIN` (`config/cors.ts`) |
| `@prisma/client` / `prisma` | ORM e migrations |
| `bcrypt` | Hash de senhas (salt rounds: 10) |
| `jsonwebtoken` | Autenticação JWT |
| `nodemailer` | Envio de e-mails |
| `ejs` | Renderização de templates de e-mail |
| `uuid` | Geração de IDs nas entidades |
| `cross-env` | Variáveis de ambiente cross-platform |
| `express-rate-limit` | Rate limiting por IP |

### Ferramentas de desenvolvimento

| Pacote | Uso |
|--------|-----|
| `tsx` | Execução TypeScript em dev |
| `tsup` | Build para produção (CommonJS) |
| `typescript` | Compilador |
| `eslint` + `prettier` | Lint e formatação |
| `copyfiles` | Copia templates `.ejs` para `dist/` no build |

### Scripts npm

| Script | Comando | Descrição |
|--------|---------|-----------|
| `start:dev` | `tsx watch src/server.ts` | Desenvolvimento com hot reload |
| `start` | `prisma migrate deploy && node dist/server.js` | Produção |
| `start:tsx` | `prisma migrate deploy && tsx src/server.ts` | Produção via tsx |
| `build` | `tsup && copy-ejs` | Compila TS e copia templates |
| `lint` | `eslint` | Verificação estática |

---

## 5. Variáveis de ambiente

Arquivo de referência: `.env.example`

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `PORT` | Não | Porta do servidor (default: `3000`) |
| `DATABASE_URL` | Sim | Connection string PostgreSQL para Prisma |
| `SECRET_KEY` | Sim | Chave secreta para assinar/verificar JWT |
| `JWT_EXPIRES_IN` | Não | Expiração do token JWT (padrão: `24h`) |
| `CORS_ORIGIN` | Não | Origens permitidas, separadas por vírgula. Vazio ou `*` libera qualquer origem |
| `GMAIL_USER` | Sim* | Usuário Gmail para SMTP |
| `GMAIL_PASS` | Sim* | Senha de app Gmail |
| `DB_PASSWORD` | Sim** | Senha do Postgres (usada no docker-compose) |
| `RATE_LIMIT_ENABLED` | Não | `true` (padrão) ativa rate limiting; `false` desativa |
| `RATE_LIMIT_GLOBAL_MAX` | Não | Máx. requisições globais por IP (padrão: `200`) |
| `RATE_LIMIT_GLOBAL_WINDOW_MS` | Não | Janela global em ms (padrão: `900000` = 15 min) |
| `RATE_LIMIT_AUTH_MAX` | Não | Máx. tentativas de login por IP (padrão: `10`) |
| `RATE_LIMIT_AUTH_WINDOW_MS` | Não | Janela de login em ms (padrão: `900000`) |
| `RATE_LIMIT_REGISTER_MAX` | Não | Máx. cadastros por IP (padrão: `5`) |
| `RATE_LIMIT_REGISTER_WINDOW_MS` | Não | Janela de cadastro em ms (padrão: `3600000` = 1 h) |
| `RATE_LIMIT_PUBLIC_READ_MAX` | Não | Máx. leituras públicas por IP (padrão: `60`) |
| `RATE_LIMIT_PUBLIC_READ_WINDOW_MS` | Não | Janela de leitura pública em ms (padrão: `60000` = 1 min) |
| `NODE_ENV` | Não | `development` ou `production` (afeta caminho dos templates EJS) |

\* Necessárias para envio de e-mail.  
\** Usada pelo serviço `lixozero-db` no Docker.

---

## 6. Modelo de dados (Prisma)

Arquivo: `prisma/schema.prisma`  
Banco: **PostgreSQL**

### Entidades

#### `Categoria`

| Campo | Tipo | Observação |
|-------|------|------------|
| `id` | UUID | PK, gerado na entidade |
| `descricao` | String | Máx. 100 caracteres (validação na entidade) |

#### `Usuario`

| Campo | Tipo | Observação |
|-------|------|------------|
| `id` | UUID | PK |
| `nome` | String | |
| `email` | String | Unique |
| `senha` | String | Hash bcrypt |
| `status` | Boolean | Default `true` |
| `tipo` | VarChar(2) | `'0'` = Admin, `'1'` = Usuário comum |
| `cpf_cnpj` | VarChar(14) | Unique |

#### `Acao`

| Campo | Tipo | Observação |
|-------|------|------------|
| `id` | UUID | PK, unique |
| `nome_organizador` | String | |
| `celular` | VarChar(11) | Exatamente 11 dígitos |
| `titulo_acao` | String | Unique na prática (validado no use case) |
| `descricao_acao` | String | |
| `data_acao` | DateTime | Deve ser futura |
| `forma_realizacao_acao` | VarChar(2) | Ver enums |
| `link_divulgacao_acesso_acao` | String | Obrigatório se online/híbrida |
| `nome_local_acao` | String | Obrigatório se presencial/híbrida |
| `endereco_local_acao` | String | Obrigatório se presencial/híbrida |
| `informacoes_acao` | String | Obrigatório se híbrida |
| `link_para_inscricao_acao` | String | |
| `tipo_publico_acao` | VarChar(2) | Ver enums |
| `orientacao_divulgacao_acao` | String | |
| `numero_organizadores_acao` | Int | Mínimo 1 |
| `situacao_acao` | VarChar(2) | Default: Pendente |
| `data_cadastro` | DateTime | Auto |
| `data_atualizacao` | DateTime | Auto `@updatedAt` |
| `id_usuario_responsavel` | UUID | FK → Usuario |
| `id_usuario_alteracao` | UUID | FK → Usuario |
| `id_categoria` | UUID | FK → Categoria |

### Relacionamentos

```
Categoria 1 ── N Acao
Usuario   1 ── N Acao (como responsável)
Usuario   1 ── N Acao (como alteração, relação "usuario_alteracao")
```

### Histórico de migrations

| Migration | Descrição |
|-----------|-----------|
| `20240905022826_inicia_migrations` | Schema inicial (incluía Patrocinador e Cota) |
| `20240913012708_adiciona_campos_publico_e_orientacao_divulgacao` | Campos de público e orientação |
| `20240915060259_adiciona_campos_necessarios_para_email` | Campos para templates de e-mail |
| `20251007231610_change_field_size_nome_organizador` | Ajuste de tamanho do nome do organizador |
| `20260611120000_remove_patrocinio_cota` | Remoção de Patrocinador, Cota e campo `receber_informacao_patrocinio` |

> **Nota:** O domínio de patrocínio foi removido do banco, mas pode haver resquícios em documentação antiga.

---

## 7. Enums e códigos de domínio

Valores armazenados como `VarChar(2)` no banco.

### Situação da ação (`AcaoSituacao`)

| Código | Label |
|--------|-------|
| `'0'` | Pendente |
| `'1'` | Aprovada |
| `'2'` | Reprovada |

### Forma de realização (`AcaoFormaRealizacao`)

| Código | Label | Campos obrigatórios extras |
|--------|-------|---------------------------|
| `'0'` | Online | `link_divulgacao_acesso_acao` |
| `'1'` | Presencial | `nome_local_acao`, `endereco_local_acao` |
| `'2'` | Híbrida | Todos os acima + `informacoes_acao` |

### Tipo de público (`AcaoTipoPublico`)

| Código | Label |
|--------|-------|
| `'0'` | Interno |
| `'1'` | Externo |

### Tipo de usuário

| Código | Papel |
|--------|-------|
| `'0'` | Administrador |
| `'1'` | Usuário comum (default na criação) |

---

## 8. Autenticação e autorização

### JWT

- **Geração:** `GerarTokenUsuario` — `jwt.sign(payload, SECRET_KEY, { expiresIn, algorithm: 'HS256' })`
- **Payload:** `{ id, nome, email, tipo }`
- **Verificação:** `VerificarTokenUsuario` — `jwt.verify` com `algorithms: ['HS256']`
- **Header:** `Authorization: Bearer <token>`
- **Expiração:** `24h` por padrão (configurável via `JWT_EXPIRES_IN`)

> **Do token, a aplicação usa apenas o `id`.** Os campos `nome`, `email` e `tipo` permanecem no payload por compatibilidade, mas são ignorados — ler `tipo` do token reintroduziria a possibilidade de um admin rebaixado continuar com privilégio até a expiração.

### Contexto do usuário autenticado

A cada requisição autenticada, `carregarUsuarioAutenticado` resolve o `id` do token e **consulta o banco** para montar `request.usuario` (tipo `UsuarioAutenticado`). Consequências:

| Situação | Efeito |
|----------|--------|
| Conta desativada (`status: false`) | `401` imediato, sem esperar a expiração do token |
| Admin rebaixado para `tipo: '1'` | Perde privilégio na requisição seguinte |
| Usuário excluído | Token deixa de funcionar imediatamente |
| Banco indisponível | `500` (não é mascarado como `401`) |

Custo: uma consulta por chave primária por requisição autenticada.

### Headers e body HTTP

- **Helmet:** registrado em `app.ts` com `contentSecurityPolicy: false`
- **Body JSON:** limite de `500kb` via `express.json({ limit: '500kb' })`

### Rate limiting

Configurado em `config/rateLimit.ts`. Pode ser desativado com `RATE_LIMIT_ENABLED=false` (útil em dev ou em caso de bloqueio indevido em produção).

| Camada | Escopo | Limite padrão |
|--------|--------|---------------|
| Global | Todas as rotas (exceto `/health`) | 200 req / 15 min por IP |
| Autenticação | `POST /usuarios/autenticar` | 10 req / 15 min por IP |
| Cadastro | `POST /usuarios` | 5 req / 1 h por IP |
| Leitura pública | `GET /acoes`, `GET /categorias` | 60 req / 1 min por IP |

- **`trust proxy`:** habilitado em `app.ts` para identificar IP real atrás do Nginx Proxy Manager
- **Resposta `429`:** `{ "message": "Muitas requisições. Tente novamente mais tarde." }`
- **Headers:** `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`

### Middlewares

| Middleware | Arquivo | Comportamento |
|------------|---------|---------------|
| `AutenticacaoMiddleware` | `AutenticacaoMiddleware.ts` | Exige Bearer token; resolve o usuário no banco; `401` se token inválido, conta inexistente ou inativa |
| `AutenticacaoOpcionalMiddleware` | `AutenticacaoOpcionalMiddleware.ts` | Se houver token válido, resolve o usuário no banco; qualquer falha segue como anônimo |
| `AdminMiddleware` | `AdminMiddleware.ts` | Exige `usuarioEhAdmin(request.usuario)`; `401` sem usuário, `403` sem privilégio |

### Matriz de permissões

| Recurso | Público | Autenticado | Admin |
|---------|---------|-------------|-------|
| GET `/health` | ✅ | — | — |
| POST `/usuarios` | ✅ | — | — |
| POST `/usuarios/autenticar` | ✅ | — | — |
| GET `/usuarios` | — | — | ✅ |
| DELETE `/usuarios/:id` | — | — | ✅ |
| GET `/categorias` | ✅ | — | — |
| POST `/categorias` | — | — | ✅ |
| GET `/acoes` | ✅ (só aprovadas) | ✅ (só aprovadas) | ✅ (todas + filtro `situacao`) |
| POST `/acoes` | — | ✅ | — |
| GET `/acoes/:data` | — | ✅ | — |
| GET `/acoes/:dataInicial/:dataFinal` | — | ✅ | — |
| PUT `/acoes/:id` | — | — | ✅ |

---

## 9. API REST — Endpoints

Base URL: `http://localhost:{PORT}`  
Não há prefixo global (ex.: `/api`).

### Health check — `/health`

#### `GET /health` — Status da API

**Auth:** Nenhuma

**Resposta `200`:**
```json
{
  "status": "ok",
  "database": "up"
}
```

**Resposta `503`:** banco indisponível (`{ "status": "error", "database": "down" }`)

---

### Usuários — `/usuarios`

#### `POST /usuarios` — Criar usuário

**Auth:** Nenhuma

**Body:**
```json
{
  "nome": "string",
  "email": "string",
  "senha": "string",
  "cpf_cnpj": "string"
}
```

**Respostas:**
- `201` — Criado (body vazio)
- `400` — `{ "error": "mensagem" }` (email/CPF duplicado)

**Regras:**
- Senha hasheada com bcrypt
- Tipo default: `'1'` (usuário comum)
- Status default: `true`

---

#### `POST /usuarios/autenticar` — Login

**Auth:** Nenhuma

**Body:**
```json
{
  "email": "string",
  "senha": "string"
}
```

**Respostas:**
- `200` — autenticação bem-sucedida
- `401` — credenciais inválidas ou conta desativada (`{ "error": "mensagem" }`)

**Resposta `200`:**
```json
{
  "token": "jwt...",
  "usuario": {
    "id": "uuid",
    "nome": "string",
    "email": "string",
    "tipo": "0|1"
  }
}
```

---

#### `GET /usuarios` — Listar usuários

**Auth:** Admin

**Query params:** `page` (default 1), `limit` (default 10, máximo 100)

**Resposta `200`:**
```json
{
  "users": [
    { "id": "", "nome": "", "tipo": "", "email": "", "cpf_cnpj": "" }
  ],
  "totalPages": 1,
  "currentPage": 1
}
```

---

#### `DELETE /usuarios/:id` — Remover usuário

**Auth:** Admin

**Respostas:** `200` (vazio) | `400` (usuário não existe)

---

### Categorias — `/categorias`

#### `GET /categorias` — Listar categorias

**Auth:** Nenhuma

**Query params:** `page` (default 1), `limit` (default 10, máximo 100)

**Resposta `200`:**
```json
{
  "categories": [{ "id": "", "descricao": "" }],
  "totalPages": 1,
  "currentPage": 1
}
```

---

#### `POST /categorias` — Criar categoria

**Auth:** Admin

**Body:**
```json
{ "descricao": "string" }
```

**Respostas:** `201` com `{ "id": "", "descricao": "" }` | `400` (descrição duplicada ou inválida)

---

### Ações — `/acoes`

#### `GET /acoes` — Listar ações

**Auth:** Opcional (`Authorization: Bearer <token>`)

**Comportamento por perfil:**

| Perfil | Ações retornadas | Filtro `situacao` | Campos sensíveis |
|--------|------------------|-------------------|------------------|
| Sem token / usuário comum | Apenas **aprovadas** | Ignorado | `celular` e e-mails omitidos |
| Admin (`tipo === '0'`) | Todas | Respeitado via query | Resposta completa |

**Query params:**

| Param | Descrição |
|-------|-----------|
| `page` | Página (default 1) |
| `limit` | Itens por página (default 10, máximo 100) |
| `id_categoria` | Filtro por categoria |
| `id_usuario` | Filtro por usuário responsável |
| `data_acao` | Filtro por data exata |
| `search` | Busca em título, descrição, organizador, local (case insensitive) |
| `situacao` | Código de situação (`'0'`, `'1'`, `'2'`) — **somente admin** |
| `forma_realizacao_acao` | Código de forma (`'0'`, `'1'`, `'2'`) |

**Resposta `200` (público — campos sanitizados):**
```json
{
  "actions": [
    {
      "id": "",
      "nome_organizador": "",
      "titulo_acao": "",
      "descricao_acao": "",
      "data_acao": "ISO Date",
      "forma_realizacao_acao": "Online|Presencial|Hibrida",
      "link_divulgacao_acesso_acao": "",
      "nome_local_acao": "",
      "endereco_local_acao": "",
      "informacoes_acao": "",
      "link_para_inscricao_acao": "",
      "tipo_publico_acao": "Interno|Externo",
      "orientacao_divulgacao_acao": "",
      "numero_organizadores_acao": 0,
      "situacao_acao": "Aprovada",
      "data_cadastro": "ISO Date",
      "data_atualizacao": "ISO Date",
      "categoria": { "descricao": "" },
      "usuario_responsavel": { "nome": "" },
      "usuario_alteracao": { "nome": "" }
    }
  ],
  "totalPages": 1,
  "currentPage": 1
}
```

> **Observação:** `totalPages` reflete a contagem com os mesmos filtros aplicados na listagem. Admin autenticado recebe também `celular` e e-mails nos objetos de usuário.

---

#### `POST /acoes` — Criar ação

**Auth:** Autenticado

**Body (campos principais):**
```json
{
  "nome_organizador": "string",
  "celular": "11999999999",
  "titulo_acao": "string",
  "descricao_acao": "string",
  "id_categoria": "uuid",
  "data_acao": "2026-12-01T10:00:00.000Z",
  "forma_realizacao_acao": "0|1|2",
  "link_divulgacao_acesso_acao": "string",
  "nome_local_acao": "string",
  "endereco_local_acao": "string",
  "informacoes_acao": "string",
  "link_para_inscricao_acao": "string",
  "tipo_publico_acao": "0|1",
  "orientacao_divulgacao_acao": "string",
  "numero_organizadores_acao": 1
}
```

> **Importante:** `id_usuario_responsavel` e `id_usuario_alteracao` **não** fazem parte do body. O responsável é sempre o usuário autenticado (`request.usuario.id`).

**Resposta `201`:** `{ "id": "uuid" }`

**Efeitos colaterais:** Envia e-mail de confirmação ao responsável (`NotificacaoAcaoCriada.ejs`)

**Validações (entidade `Acao`):**
- Título único
- Celular com 11 dígitos
- Data futura
- Campos condicionais conforme forma de realização
- Situação inicial: Pendente
- `id_usuario_responsavel` e `id_usuario_alteracao` definidos internamente a partir do token

---

#### `PUT /acoes/:id` — Atualizar situação da ação

**Auth:** Admin

**Body:**
```json
{
  "situacao_acao": "1|2"
}
```

> **Importante:** `id_usuario_alteracao` **não** faz parte do body — é sempre o admin autenticado (`request.usuario.id`). Só `'1'` (aprovar) e `'2'` (reprovar) são aceitos; qualquer outro valor retorna `400` sem tocar no banco.

**Resposta `200`:**
```json
{
  "id": "",
  "nome_organizador": "",
  "celular": "",
  "titulo_acao": "",
  "descricao_acao": "",
  "data_acao": "ISO Date",
  "numero_organizadores_acao": 0,
  "situacao_acao": "Pendente|Aprovada|Reprovada"
}
```

**Efeitos colaterais:** E-mail de aprovação ou reprovação conforme situação

**Ordem de execução:** valida situação → gera template → grava no banco → envia e-mail. Assim uma falha de template nunca deixa o registro alterado. Se o e-mail falhar, a ação fica atualizada sem notificação — preferível a notificar uma mudança que não persistiu.

> **Limitação:** Apenas `situacao_acao` é atualizável pelo cliente.

---

#### `GET /acoes/:data` — Listar por data

**Auth:** Autenticado

**Param:** `data` — string parseável por `Date` (ex.: `2026-08-22`)

**Comportamento:** Usuário comum vê apenas ações aprovadas (resposta sanitizada). Admin vê todas as situações com dados completos.

**Resposta `200`:** Array de ações

---

#### `GET /acoes/:dataInicial/:dataFinal` — Listar por intervalo

**Auth:** Autenticado

**Params:** `dataInicial`, `dataFinal`

**Validações:** Datas válidas; inicial ≤ final

**Comportamento:** Mesma regra de visibilidade de `GET /acoes/:data`.

**Resposta `200`:** Array de ações

> **Atenção (roteamento):** As rotas `/:data` e `/:dataInicial/:dataFinal` são genéricas. Não existe `GET /acoes/:id`.

---

## 10. Casos de uso — Inventário

### Usuário

| Use Case | Entrada | Saída |
|----------|---------|-------|
| `CriarUsuario` | nome, email, senha, cpf_cnpj | void |
| `AutenticarUsuario` | email, senha | token + dados do usuário |
| `GerarTokenUsuario` | id, nome, email, tipo | token |
| `VerificarTokenUsuario` | token | payload decodificado |
| `ListarUsuarios` | paginaAtual, limiteDeUsuariosPorPagina | usuários paginados |
| `DeletarUsuario` | id | void |

### Categoria

| Use Case | Entrada | Saída |
|----------|---------|-------|
| `CriarCategoria` | descricao | `{ id, descricao }` |
| `ListarCategorias` | paginaAtual, limite | categorias paginadas |

### Ação

| Use Case | Entrada | Saída |
|----------|---------|-------|
| `CriarAcao` | dados da ação | `{ id }` + e-mail |
| `ListarAcoes` | filtros + paginação | ações paginadas |
| `ListarAcoesPorData` | data | array de ações |
| `ListarAcoesPorIntervaloData` | dataInicial, dataFinal | array de ações |
| `AtualizarAcao` | id, campos | ação atualizada + e-mail |

### E-mail (templates)

| Use Case | Template EJS |
|----------|--------------|
| `GerarTemplateAcaoCadastrada` | `NotificacaoAcaoCriada.ejs` |
| `GerarTemplateAcaoAprovada` | `NotificacaoAcaoAprovada.ejs` |
| `GerarTemplateAcaoReprovada` | `NotificacaoAcaoReprovada.ejs` |

---

## 11. Sistema de e-mail

- **Serviço:** `NodemailerService` implementa `IEmailService`
- **SMTP:** Gmail (`smtp.gmail.com:465`, SSL)
- **Remetente fixo:** `caxiaslixozero@gmail.com`
- **Templates:** EJS em `src/infrastructure/smtp/templates/`
- **Resolução de caminho:** `resolveCaminhoArquivoTemplate()` — `src/` em dev, `dist/` em produção
- **Tratamento de erro:** Falhas de envio são logadas no console, não propagadas ao cliente

---

## 12. Infraestrutura e deploy

### Docker

**`docker-compose.yml`** define dois serviços:

| Serviço | Imagem/Build | Porta |
|---------|--------------|-------|
| `lixozero-db` | `postgres` | 5432 |
| `lixozero-api` | Build local (Dockerfile) | 3000 |

Rede externa `proxy-manager` para integração com reverse proxy (Nginx Proxy Manager).

**`Dockerfile`:**
- Base: `node:20.17.0-alpine3.20`
- Timezone: `America/Sao_Paulo`
- Build: `npm install` → `npm run build` → `prisma generate`
- Start: `npm run start` (aplica migrations + inicia servidor)

### CI/CD

**`.github/workflows/deploy.yml`**
- Trigger: push em `main` ou manual (`workflow_dispatch`)
- Destino: VPS Hostinger via SSH
- Fluxo: `git pull` → `docker compose down` → `docker compose up -d --build`
- Secrets: `VPS_SSH_KEY`, `VPS_HOST`, `VPS_SSH_USER`, `PROJECT_DIR`, `PORT`, `DATABASE_URL`, `DB_PASSWORD`, `SECRET_KEY`, `GMAIL_USER`, `GMAIL_PASS`

---

## 13. Build e estrutura de saída

- **Bundler:** `tsup` — compila todos os `.ts` de `src/` para `dist/` em CommonJS
- **Templates:** copiados para `dist/infrastructure/smtp/templates/` via `copy-ejs`
- **Path alias:** `baseUrl: "."` no tsconfig — imports como `src/application/...` funcionam em runtime com tsx

---

## 14. Testes

Arquivo existente: `test/categoria.test.ts`

- Usa `supertest` (não listado em `package.json` — dependência ausente)
- Testes parecem desatualizados em relação ao comportamento atual (ex.: POST `/categorias` exige auth admin; formato de resposta de GET mudou para objeto paginado)
- Não há script `test` no `package.json`

---

## 15. Convenções de código

| Aspecto | Convenção |
|---------|-----------|
| Idioma do código | Português (nomes de classes, métodos, mensagens de erro) |
| Nomenclatura de use cases | Verbo + substantivo (`CriarAcao`, `ListarUsuarios`) |
| Método principal | `executar()` |
| IDs | UUID v4 gerados nas entidades (não pelo banco) |
| Respostas de erro | `{ "error": "mensagem" }` ou `{ "message": "..." }` (inconsistente entre middlewares e controllers) |
| Paginação | Query `page` + `limit` (máx. 100), resposta com `totalPages` e `currentPage` |
| Controllers | Instanciam dependências no topo do arquivo (sem injeção de dependência formal) |

---

## 16. Pontos de atenção para desenvolvimento futuro

Itens pendentes que podem impactar manutenção ou novas features:

1. **Roteamento de `/acoes/:data`** — parâmetro genérico pode conflitar com outros padrões
2. **Atualização de ação limitada** — apenas situação e usuário de alteração
3. **Erros de e-mail silenciosos** — falha no envio não retorna erro ao cliente (fila de envio planejada para o futuro)
4. **Testes desatualizados** — `supertest` não está nas dependências; testes não refletem auth e formato atual
5. **Domínio de patrocínio removido** — migration recente removeu `Patrocinador` e `Cota`; código não possui vestígios

### Itens corrigidos

- JWT com expiração configurável (`JWT_EXPIRES_IN`, padrão `24h`) e algoritmo explícito `HS256`
- CORS configurável via `CORS_ORIGIN`
- `totalPages` em listagem de ações respeita filtros aplicados
- `CriarCategoria` retorna `{ id, descricao }` no `201`
- Paginação de `ListarUsuarios` com parâmetro `limiteDeUsuariosPorPagina` padronizado
- Endpoint `GET /health` com verificação de banco
- Rate limiting por IP com flag `RATE_LIMIT_ENABLED`
- IDOR em `POST /acoes` corrigido — responsável sempre é o usuário do token
- Listagem pública de ações restrita a aprovadas, com sanitização de PII
- Helmet, limite de body JSON (500kb), teto de paginação (100), erros 500 genéricos em produção
- Login com conta desativada retorna `401`
- Privilégio e status revalidados no banco a cada requisição (revogação imediata)
- IDOR em `PUT /acoes/:id` corrigido — `id_usuario_alteracao` vem do token
- `situacao_acao` validada antes da gravação, eliminando corrupção silenciosa

---

## 17. Como rodar localmente

```bash
# 1. Configurar variáveis
cp .env.example .env
# Preencher DATABASE_URL, SECRET_KEY, JWT_EXPIRES_IN, CORS_ORIGIN, GMAIL_*, DB_PASSWORD

# 2. Subir banco (opcional via Docker)
docker compose up lixozero-db -d

# 3. Aplicar migrations
npx prisma migrate deploy

# 4. Desenvolvimento
npm install
npm run start:dev
```

API disponível em `http://localhost:3000` (ou `PORT` configurada).

---

## 18. Mapa rápido de arquivos-chave

| Arquivo | Responsabilidade |
|---------|------------------|
| `src/server.ts` | Bootstrap do servidor |
| `src/app.ts` | Bootstrap Express (trust proxy, CORS, rate limit global, rotas) |
| `src/infrastructure/http/config/cors.ts` | Leitura de `CORS_ORIGIN` e opções do middleware |
| `src/infrastructure/http/config/rateLimit.ts` | Factories de rate limiting e leitura de env |
| `src/infrastructure/http/controllers/HealthController.ts` | Verificação de saúde da API e banco |
| `prisma/schema.prisma` | Modelo de dados |
| `src/infrastructure/http/routes/index.ts` | Registro centralizado de rotas (inclui `/health`) |
| `src/domain/acao/entity/Acao.ts` | Regras de validação de ações |
| `src/domain/usuario/entity/Usuario.ts` | Hash e tipos de usuário |
| `src/application/usecases/` | Toda lógica de aplicação |
| `src/application/repositories/` | Acesso a dados via Prisma |
| `docker-compose.yml` | Orquestração local/produção |
| `.github/workflows/deploy.yml` | Pipeline de deploy |

---

*Última atualização: agosto/2026 — revisada após implementação de rate limiting.*
