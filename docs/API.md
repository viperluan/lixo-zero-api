# Referência da API

Base URL local: `http://localhost:3000`. Não há prefixo de versão (`/v1`) nem documentação OpenAPI — este arquivo é a referência.

Todas as requisições e respostas usam `application/json`, limitadas a 500 kB de corpo.

## Autenticação

Envie o token JWT no header:

```
Authorization: Bearer <token>
```

O token é obtido em `POST /usuarios/autenticar` e vale 24 horas por padrão (`JWT_EXPIRES_IN`).

## Mapa de rotas

| Método | Rota | Acesso | Rate limit específico |
|--------|------|--------|------------------------|
| `GET` | `/health` | Público | Isento do limite global |
| `POST` | `/usuarios` | Público | Cadastro (5/h) |
| `POST` | `/usuarios/autenticar` | Público | Autenticação (10/15min) |
| `GET` | `/usuarios` | Admin | — |
| `DELETE` | `/usuarios/:id` | Admin | — |
| `GET` | `/categorias` | Público | Leitura pública (60/min) |
| `POST` | `/categorias` | Admin | — |
| `GET` | `/acoes` | Público, com auth opcional | Leitura pública (60/min) |
| `POST` | `/acoes` | Autenticado | — |
| `GET` | `/acoes/:data` | Autenticado | — |
| `GET` | `/acoes/:dataInicial/:dataFinal` | Autenticado | — |
| `PUT` | `/acoes/:id` | Admin | — |

Todas as rotas também passam pelo rate limit global de 200 requisições por 15 minutos por IP.

## Paginação

Os três endpoints de listagem paginada (`/usuarios`, `/categorias`, `/acoes`) aceitam:

| Query param | Default | Regra |
|-------------|---------|-------|
| `page` | `1` | Valores ≤ 0 ou inválidos caem para 1 |
| `limit` | `10` | Teto rígido de 100; valores maiores são truncados |

E respondem com o mesmo envelope, onde a chave da coleção muda por recurso:

```json
{ "actions|users|categories": [], "totalPages": 3, "currentPage": 1 }
```

---

## Health

### `GET /health`

Sem autenticação e isento do rate limit global (o `skip` está em `criarRateLimitGlobal`). Não toca no banco — responde `200` mesmo com o Postgres fora do ar. É o endpoint usado pelo `HEALTHCHECK` do Docker.

**200** — `{ "status": "ok" }`

---

## Usuários

### `POST /usuarios`

Cadastro público de organizador. O usuário criado sempre recebe `tipo: '1'` (comum) e `status: true`.

```json
{
  "nome": "Maria Silva",
  "email": "maria@exemplo.com",
  "senha": "senha-em-texto-puro",
  "cpf_cnpj": "12345678901"
}
```

Nenhum dos campos tem validação de formato ou de força de senha — apenas duplicidade de `email` e `cpf_cnpj` é verificada.

| Status | Corpo |
|--------|-------|
| `201` | **Vazio** (sem corpo) |
| `400` | `{ "error": "Email já cadastrado." }` ou `{ "error": "CPF/CNPJ já cadastrado." }` |
| `429` | `{ "message": "Muitas requisições. Tente novamente mais tarde." }` |

### `POST /usuarios/autenticar`

```json
{ "email": "maria@exemplo.com", "senha": "senha-em-texto-puro" }
```

| Status | Corpo |
|--------|-------|
| `200` | `{ "token": "...", "usuario": { "id", "nome", "email", "tipo" } }` |
| `401` | `{ "error": "Email ou senha incorretos" }` |
| `400` | Outros erros |

A mesma mensagem `401` cobre e-mail inexistente, senha errada e conta desativada (`status: false`), de propósito — não vaza qual dos três ocorreu.

### `GET /usuarios`

Requer admin. Aceita `page` e `limit`.

**200:**

```json
{
  "users": [
    { "id": "uuid", "nome": "Maria Silva", "tipo": "1",
      "email": "maria@exemplo.com", "cpf_cnpj": "12345678901" }
  ],
  "totalPages": 3,
  "currentPage": 1
}
```

O hash da senha não é retornado. O CPF/CNPJ é, na íntegra e sem máscara.

| Status | Situação |
|--------|----------|
| `401` | Sem token ou sessão inválida |
| `403` | Autenticado mas não admin |
| `400` | Qualquer falha (este controller não diferencia erro interno) |

### `DELETE /usuarios/:id`

Requer admin. Bloqueado quando o usuário está vinculado a ações, como responsável ou como autor da última alteração.

| Status | Corpo |
|--------|-------|
| `200` | **Vazio** |
| `404` | `{ "error": "Usuário não existe." }` |
| `409` | `{ "error": "Não é possível excluir um usuário vinculado a ações." }` |
| `500` | `{ "error": "..." }` |

---

## Categorias

### `GET /categorias`

Público. Aceita `page` e `limit`.

**200:**

```json
{
  "categories": [{ "id": "uuid", "descricao": "Reciclagem" }],
  "totalPages": 1,
  "currentPage": 1
}
```

### `POST /categorias`

Requer admin.

```json
{ "descricao": "Compostagem" }
```

| Status | Corpo |
|--------|-------|
| `201` | `{ "id": "uuid", "descricao": "Compostagem" }` |
| `400` | `{ "error": "Descrição de categoria já cadastrada." }`, `{ "error": "A categoria deve possuir uma descrição" }` ou `{ "error": "A descrição não pode conter mais de 100 caracteres." }` |
| `401` / `403` | Sem token / não é admin |

Não existe endpoint para editar ou excluir categoria.

---

## Ações

### `GET /acoes`

O endpoint principal e o único com **autenticação opcional**: funciona sem token, e o que é devolvido muda conforme quem chama.

| Chamador | Ações visíveis | Filtro `situacao` | Sanitização |
|----------|----------------|-------------------|-------------|
| Anônimo ou usuário comum | Só `Aprovada` (forçado) | Ignorado | Sim |
| Administrador | Todas | Respeitado | Não |

Quando a sanitização se aplica, `celular` é removido do item e `usuario_responsavel`/`usuario_alteracao` são reduzidos a `{ nome }` — sem `email`.

**Query params:**

| Param | Descrição |
|-------|-----------|
| `page`, `limit` | Paginação |
| `id_categoria` | UUID da categoria |
| `id_usuario` | UUID do usuário responsável (mapeado internamente para `id_usuario_responsavel`) |
| `data_acao` | Data exata — ver a advertência abaixo |
| `search` | Busca case-insensitive em `titulo_acao`, `descricao_acao`, `nome_organizador` e `nome_local_acao` |
| `situacao` | `'0'`, `'1'` ou `'2'`. **Só tem efeito para admin** |
| `forma_realizacao_acao` | `'0'`, `'1'` ou `'2'` |

> **Advertência sobre `data_acao`:** o filtro faz `new Date(valor)` e compara por igualdade exata contra o `DateTime` da coluna, hora inclusa. Passar `2026-09-15` só casa com ações gravadas exatamente à meia-noite UTC. Para buscar "as ações de um dia", use `GET /acoes/:dataInicial/:dataFinal` com o início e o fim do dia.

**200:**

```json
{
  "actions": [
    {
      "id": "uuid",
      "nome_organizador": "Instituto Verde",
      "celular": "54999999999",
      "titulo_acao": "Mutirão de limpeza do Arroio Tega",
      "descricao_acao": "Limpeza das margens...",
      "data_acao": "2026-09-15T14:00:00.000Z",
      "forma_realizacao_acao": "Presencial",
      "link_divulgacao_acesso_acao": "",
      "nome_local_acao": "Parque dos Macaquinhos",
      "endereco_local_acao": "Rua Os Dezoito do Forte, s/n",
      "informacoes_acao": "Levar luvas.",
      "link_para_inscricao_acao": "https://...",
      "tipo_publico_acao": "Externo",
      "orientacao_divulgacao_acao": "Divulgar nas redes sociais",
      "numero_organizadores_acao": 12,
      "situacao_acao": "Aprovada",
      "data_cadastro": "2026-08-01T10:00:00.000Z",
      "data_atualizacao": "2026-08-02T09:30:00.000Z",
      "categoria": { "descricao": "Reciclagem" },
      "usuario_responsavel": { "nome": "Maria Silva", "email": "maria@exemplo.com" },
      "usuario_alteracao": { "nome": "Admin", "email": "admin@exemplo.com" }
    }
  ],
  "totalPages": 4,
  "currentPage": 1
}
```

Repare que `situacao_acao`, `forma_realizacao_acao` e `tipo_publico_acao` vêm **traduzidos para texto** neste endpoint, enquanto os filtros da query esperam os **códigos**. Erros inesperados respondem `500` via `responderErroInterno`.

### `POST /acoes`

Requer autenticação (qualquer usuário). O `id_usuario_responsavel` vem do token — mandar no corpo não tem efeito.

```json
{
  "nome_organizador": "Instituto Verde",
  "celular": "54999999999",
  "titulo_acao": "Mutirão de limpeza do Arroio Tega",
  "descricao_acao": "Limpeza das margens do arroio",
  "id_categoria": "uuid-da-categoria",
  "data_acao": "2026-09-15T14:00:00.000Z",
  "forma_realizacao_acao": "1",
  "link_divulgacao_acesso_acao": "",
  "nome_local_acao": "Parque dos Macaquinhos",
  "endereco_local_acao": "Rua Os Dezoito do Forte, s/n",
  "informacoes_acao": "Levar luvas e garrafa de água.",
  "link_para_inscricao_acao": "https://forms.exemplo.com/mutirao",
  "tipo_publico_acao": "1",
  "orientacao_divulgacao_acao": "Divulgar nas redes sociais do instituto",
  "numero_organizadores_acao": 12
}
```

Quais campos são obrigatórios depende de `forma_realizacao_acao`; a matriz completa está em [`CONTEXTO_E_DOMINIO.md`](CONTEXTO_E_DOMINIO.md#regras-de-validação-da-ação). Em resumo: online exige o link de acesso, presencial exige nome e endereço do local, híbrida exige os três mais `informacoes_acao`.

| Status | Corpo |
|--------|-------|
| `201` | `{ "id": "uuid" }` — apenas o id |
| `400` | `{ "error": "<mensagem de validação>" }`, incluindo `"Título já cadastrado."` |
| `401` | `{ "message": "Autenticação necessária para acessar o recurso." }` |

A ação nasce `Pendente` e um e-mail de confirmação é enfileirado para o usuário autenticado. A resposta `201` não espera o SMTP; se o Redis estiver fora, a ação já foi salva e a falha de enqueue só é logada.

### `PUT /acoes/:id`

Requer admin. Apesar do verbo, **não é um update genérico**: é o endpoint de aprovar/reprovar, e o único campo lido do corpo é `situacao_acao`.

```json
{ "situacao_acao": "1" }
```

| Valor | Efeito |
|-------|--------|
| `"1"` | Aprova e enfileira o e-mail de aprovação |
| `"2"` | Reprova e enfileira o e-mail de reprovação |
| qualquer outro | `400` |

**200:**

```json
{
  "id": "uuid",
  "nome_organizador": "Instituto Verde",
  "celular": "54999999999",
  "titulo_acao": "Mutirão de limpeza do Arroio Tega",
  "descricao_acao": "Limpeza das margens do arroio",
  "data_acao": "2026-09-15T14:00:00.000Z",
  "numero_organizadores_acao": 12,
  "situacao_acao": "Aprovada"
}
```

A resposta é um subconjunto dos campos, com `situacao_acao` em texto. `id_usuario_alteracao` é atualizado com o id do admin, mas não aparece na resposta.

| Status | Corpo |
|--------|-------|
| `400` | `{ "error": "Situação inválida. Use \"1\" para aprovar ou \"2\" para reprovar." }`, `"Ação não encontrada!"`, `"Usuário não encontrado!"` ou `"Erro ao gerar template."` |
| `401` / `403` | Sem token / não é admin |

### `GET /acoes/:data`

Requer autenticação — diferente de `GET /acoes`, não funciona anonimamente. Não é paginado: devolve um **array puro**.

`:data` é passado direto para `new Date()`, então aceita ISO 8601 (`2026-09-15` ou `2026-09-15T14:00:00.000Z`). A comparação é por igualdade exata de timestamp, com a mesma limitação descrita no filtro `data_acao`.

Usuário comum recebe só ações `Aprovada`, sanitizadas. Admin recebe todas, completas.

| Status | Corpo |
|--------|-------|
| `200` | `[ { ...ação }, ... ]` |
| `400` | `{ "error": "Data inválida." }` |
| `401` | Sem token |

> **Inconsistência conhecida:** aqui `situacao_acao` volta como **código** (`"1"`), não como texto, ao contrário de `GET /acoes`. Já `forma_realizacao_acao` e `tipo_publico_acao` continuam em texto. Este endpoint também não inclui `categoria`, `usuario_responsavel` nem `usuario_alteracao` preenchidos, porque a consulta do repositório não faz `include`.

### `GET /acoes/:dataInicial/:dataFinal`

Requer autenticação. Array puro, sem paginação. Intervalo **inclusivo** nas duas pontas (`gte` / `lte`). Mesmas regras de visibilidade e o mesmo formato de saída de `GET /acoes/:data`.

Este é o endpoint recomendado para montar a programação de um período — por exemplo, a semana do evento em um ano específico.

| Status | Corpo |
|--------|-------|
| `200` | `[ { ...ação }, ... ]` |
| `400` | `{ "error": "Data inicial inválida." }`, `"Data final inválida."` ou `"A data de início deve ser anterior à data de fim."` |
| `401` | Sem token |

---

## Formato dos erros

Não há um formato único. Existem três chaves diferentes em circulação:

| Origem | Formato |
|--------|---------|
| Controllers (erros de negócio e `500`) | `{ "error": "mensagem" }` |
| Middlewares de autenticação e autorização | `{ "message": "mensagem" }` |
| Rate limit | `{ "message": "Muitas requisições. Tente novamente mais tarde." }` |

Clientes devem checar as duas chaves. Mensagens de erro `500` são detalhadas fora de produção e genéricas (`"Erro interno do servidor."`) quando `NODE_ENV=production`.

## Respostas de autenticação e autorização

| Status | Mensagem | Quando |
|--------|----------|--------|
| `401` | `Autenticação necessária para acessar o recurso.` | Header `Authorization` ausente |
| `401` | `Sessão inválida.` | Token expirado/adulterado, ou usuário excluído/desativado |
| `401` | `Usuário não autenticado` | `AdminMiddleware` sem `request.usuario` |
| `403` | `Acesso negado.` | Autenticado, mas `tipo !== '0'` |

## Exemplos com cURL

```bash
# Autenticar e guardar o token
TOKEN=$(curl -s -X POST http://localhost:3000/usuarios/autenticar \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@exemplo.com","senha":"senha"}' | jq -r .token)

# Listagem pública (só ações aprovadas, sem dados de contato)
curl 'http://localhost:3000/acoes?page=1&limit=20&search=mutirao'

# Fila de moderação (admin)
curl -H "Authorization: Bearer $TOKEN" 'http://localhost:3000/acoes?situacao=0'

# Aprovar uma ação
curl -X PUT "http://localhost:3000/acoes/<id>" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"situacao_acao":"1"}'

# Programação de um período
curl -H "Authorization: Bearer $TOKEN" \
  'http://localhost:3000/acoes/2026-09-01/2026-09-30'
```
