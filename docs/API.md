# Referência da API

Base URL local: `http://localhost:3000`. Não há prefixo de versão (`/v1`) nem documentação OpenAPI — este arquivo é a referência.

Todas as requisições e respostas usam `application/json`, limitadas a 500 kB de corpo.

## Autenticação

Envie o token JWT no header:

```
Authorization: Bearer <token>
```

O token é obtido em `POST /usuarios/autenticar` e vale 24 horas por padrão (`JWT_EXPIRES_IN`). A resposta do login inclui `expires_in` (segundos, `exp - iat`) e `expires_at` (ISO 8601), lidos do JWT já assinado.

Em rota protegida, JWT expirado responde `401` `{ "message": "Sessão inválida.", "code": "TOKEN_EXPIRED" }`. Token adulterado, malformado ou conta inativa/excluída responde a mesma mensagem **sem** `code`.

## Mapa de rotas

| Método | Rota | Acesso | Rate limit específico |
|--------|------|--------|------------------------|
| `GET` | `/health` | Público | Isento do limite global |
| `POST` | `/usuarios` | Público | Cadastro (5/h) |
| `POST` | `/usuarios/autenticar` | Público | Autenticação (10/15min) |
| `POST` | `/usuarios/esqueci-senha` | Público | Pedido de redefinição (5/h) |
| `POST` | `/usuarios/redefinir-senha` | Público | Troca de senha (10/15min) |
| `GET` | `/usuarios` | Admin | — |
| `DELETE` | `/usuarios/:id` | Admin | — |
| `GET` | `/categorias` | Público | Leitura pública (60/min) |
| `POST` | `/categorias` | Admin | — |
| `GET` | `/acoes` | Público, com auth opcional | Leitura pública (60/min) |
| `GET` | `/acoes/minhas` | Autenticado | — |
| `POST` | `/acoes` | Autenticado | — |
| `GET` | `/acoes/:data` | Autenticado | — |
| `GET` | `/acoes/:dataInicial/:dataFinal` | Autenticado | — |
| `PUT` | `/acoes/:id` | Admin | — |
| `GET` | `/edicoes/vigente` | Público | Leitura pública (60/min) |
| `GET` | `/edicoes` | Admin | — |
| `GET` | `/edicoes/:id` | Admin | — |
| `POST` | `/edicoes` | Admin | — |
| `PUT` | `/edicoes/:id` | Admin | — |
| `DELETE` | `/edicoes/:id` | Admin | — |
| `PUT` | `/edicoes/:id/prorrogar` | Admin | — |
| `PUT` | `/edicoes/:id/inscricoes` | Admin | — |
| `PUT` | `/edicoes/:id/vigente` | Admin | — |

Todas as rotas também passam pelo rate limit global de 200 requisições por 15 minutos por IP.

## Paginação

Os endpoints de listagem paginada (`/usuarios`, `/categorias`, `/acoes`, `/acoes/minhas`) aceitam:

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
| `200` | `{ "token": "...", "expires_in": 86400, "expires_at": "2026-09-17T01:58:00.000Z", "usuario": { "id", "nome", "email", "tipo" } }` |
| `401` | `{ "error": "Email ou senha incorretos" }` |
| `400` | Outros erros |

A mesma mensagem `401` cobre e-mail inexistente, senha errada e conta desativada (`status: false`), de propósito — não vaza qual dos três ocorreu.

Um JWT emitido antes de uma redefinição de senha passa a receber `401` `{ "message": "Sessão inválida." }`, sem `code`. A comparação usa o `iat` do token e `Usuario.senha_alterada_em`.

### `POST /usuarios/esqueci-senha`

Pedido público de link para redefinir a senha. Não exige autenticação.

```json
{ "email": "maria@exemplo.com" }
```

| Status | Corpo |
|--------|-------|
| `200` | `{ "message": "Se existir uma conta com esse e-mail, enviaremos instruções para redefinir a senha." }` |
| `429` | `{ "message": "Muitas requisições. Tente novamente mais tarde." }` |
| `500` | Falha inesperada via `responderErroInterno` |

A resposta `200` é a mesma quando o e-mail não existe, a conta está desativada, o pedido cai no intervalo de 2 minutos da mesma conta, ou o e-mail foi enfileirado. O link aponta para `{URL_FRONT}/redefinir-senha?token=...`, vale 1 hora e é de uso único. Abrir a página não consome o token.

### `POST /usuarios/redefinir-senha`

```json
{ "token": "token-do-link", "senha": "senha-nova" }
```

| Status | Corpo |
|--------|-------|
| `200` | `{ "message": "Senha redefinida. Entre novamente com a nova senha." }` |
| `400` | `{ "error": "Link inválido ou expirado." }` |
| `400` | `{ "error": "A senha deve ter entre 10 e 128 caracteres." }` |
| `429` | `{ "message": "Muitas requisições. Tente novamente mais tarde." }` |
| `500` | Falha inesperada via `responderErroInterno` |

A mensagem de tamanho só aparece quando o token ainda é válido. A senha nova não exige maiúscula, número ou símbolo. O sucesso não devolve JWT: a pessoa entra de novo em `POST /usuarios/autenticar`.

### `GET /usuarios`

Requer admin. Aceita `page` e `limit`.

**200:**

```json
{
  "users": [
    { "id": "uuid", "nome": "Maria Silva", "tipo": "1",
      "email": "maria@exemplo.com", "cpf_cnpj": "123.***.***-01" }
  ],
  "totalPages": 3,
  "currentPage": 1
}
```

O hash da senha não é retornado. O CPF/CNPJ sai mascarado (`123.***.***-01` ou `12.***.***/****-91`); o valor completo fica só no banco. Documento com tamanho inesperado vira `***`.

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

Se o header `Authorization` vier com um Bearer que não autentica (expirado, inválido ou conta inativa), a rota segue como anônima e inclui `X-Session-Expired: true` para o front limpar o storage. Sem Bearer, esse header não é enviado. A rota **não** responde `401`.

| Chamador | Ações visíveis | Filtro `situacao` | Sanitização |
|----------|----------------|-------------------|-------------|
| Anônimo ou usuário comum | Só `Aprovada` da edição vigente | Ignorado | Sim |
| Administrador | Default: edição vigente, qualquer situação | Respeitado | Não |

Sem edição vigente, a listagem pública (e o default do admin) responde `200` com `actions: []`. O admin troca de ano com `ano` ou `id_edicao`. `ano=todos` remove o filtro de edição. `id_edicao` enviado por quem não é admin é ignorado.

Quando a sanitização se aplica, `celular` é removido do item e `usuario_responsavel`/`usuario_alteracao` são reduzidos a `{ nome }` — sem `email`.

**Query params:**

| Param | Descrição |
|-------|-----------|
| `page`, `limit` | Paginação |
| `id_categoria` | UUID da categoria |
| `id_usuario` | UUID do usuário responsável (mapeado internamente para `id_usuario_responsavel`) |
| `data_acao` | Dia civil em `America/Sao_Paulo`. `2026-11-07` cobre o dia inteiro, não só a meia-noite |
| `data_acao_inicial` | `data_acao` a partir do início desse dia civil |
| `data_acao_final` | `data_acao` até o fim desse dia civil |
| `ano` | Ano da edição. Admin: default é a vigente; `todos` lista todos os anos. Não-admin: ignorado |
| `id_edicao` | UUID da edição. No admin, tem precedência sobre `ano`, exceto quando `ano=todos` |
| `search` | Busca case-insensitive em `titulo_acao`, `descricao_acao`, `nome_organizador` e `nome_local_acao` |
| `situacao` | `'0'`, `'1'` ou `'2'`. **Só tem efeito para admin** |
| `forma_realizacao_acao` | `'0'`, `'1'` ou `'2'` |

A listagem sai ordenada por `data_acao` crescente, com `id` como desempate — a página 1 traz as ações **mais antigas da edição filtrada**. A ordenação é explícita justamente para tornar a paginação determinística: sem ela o Postgres devolve as linhas em ordem arbitrária e o par `skip`/`take` repete e pula registros entre páginas.

Data inválida em `data_acao`, `data_acao_inicial` ou `data_acao_final` responde `400` `{ "error": "Data inválida." }`. `ano` ou `id_edicao` inexistente responde `404` `{ "error": "Edição não encontrada." }`.

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

A tela de Minhas Ações **não** deve usar este endpoint: para não-admin ele só devolve aprovadas. Use `GET /acoes/minhas`.

### `GET /acoes/minhas`

Requer autenticação (qualquer usuário autenticado). Devolve as ações em que o chamador é `id_usuario_responsavel`, em **qualquer** situação — Pendente, Aprovada ou Reprovada. É o endpoint da tela Minhas Ações.

O responsável sai **somente** do token. Query `id_usuario`, se vier, é ignorada.

Admin nesta rota também vê só as ações em que é responsável. A fila de moderação continua em `GET /acoes`.

Não há sanitização: `celular` e os e-mails de `usuario_responsavel`/`usuario_alteracao` vêm completos. O envelope e o formato de cada item são os mesmos de `GET /acoes` (`situacao_acao` em texto). A ordenação também é a mesma (`data_acao` crescente, `id` como desempate), porque as duas rotas passam por `listarComPaginacao`.

**Query params:**

| Param | Descrição |
|-------|-----------|
| `page`, `limit` | Paginação |
| `id_categoria` | UUID da categoria |
| `data_acao` | Dia civil em `America/Sao_Paulo`, como em `GET /acoes` |
| `data_acao_inicial` | Início do intervalo, dia civil |
| `data_acao_final` | Fim do intervalo, dia civil |
| `ano` | Opcional. Sem esse param e sem `id_edicao`, devolve todas as edições do dono. `todos` também não filtra |
| `id_edicao` | Opcional. Tem precedência sobre `ano` |
| `search` | Busca case-insensitive em `titulo_acao`, `descricao_acao`, `nome_organizador` e `nome_local_acao` |
| `situacao` | `'0'`, `'1'` ou `'2'`. Omitido = todas as situações do dono |
| `forma_realizacao_acao` | `'0'`, `'1'` ou `'2'` |

| Status | Situação |
|--------|----------|
| `200` | Envelope `{ "actions", "totalPages", "currentPage" }` |
| `401` | Sem token ou sessão inválida |
| `500` | Falha inesperada via `responderErroInterno` |

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

O cadastro só entra se existir edição vigente com `cadastro_aberto`. A `data_acao` continua tendo de ser futura e, além disso, cair no intervalo de realização dessa edição. O título é único dentro da edição, não na base inteira. `id_edicao` vem da vigente; mandar no corpo não tem efeito.

| Status | Corpo |
|--------|-------|
| `201` | `{ "id": "uuid" }` — apenas o id |
| `400` | `{ "error": "<mensagem de validação>" }`, incluindo `"Título já cadastrado."`, `"O cadastro de ações desta edição está fechado."`, `"Não há edição vigente."` e `"A data da ação precisa estar entre dd/mm/aaaa e dd/mm/aaaa."` |
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

`:data` é um dia civil (`2026-11-07`) ou um instante ISO. Dia civil cobre o dia inteiro em `America/Sao_Paulo`. Usuário comum recebe só ações `Aprovada` da edição vigente, sanitizadas. Sem vigente, a resposta é `[]`. Admin recebe todas as edições e situações, completas.

| Status | Corpo |
|--------|-------|
| `200` | `[ { ...ação }, ... ]` |
| `400` | `{ "error": "Data inválida." }` |
| `401` | Sem token |

> **Inconsistência conhecida:** aqui `situacao_acao` volta como **código** (`"1"`), não como texto, ao contrário de `GET /acoes`. Já `forma_realizacao_acao` e `tipo_publico_acao` continuam em texto. Este endpoint também não inclui `categoria`, `usuario_responsavel` nem `usuario_alteracao` preenchidos, porque a consulta do repositório não faz `include`.

### `GET /acoes/:dataInicial/:dataFinal`

Requer autenticação. Array puro, sem paginação. Intervalo inclusivo nas duas pontas. Um valor só com a data (`2026-11-07`) vale o dia civil inteiro em `America/Sao_Paulo`; um instante ISO continua sendo aquele timestamp. Mesmas regras de visibilidade e o mesmo formato de saída de `GET /acoes/:data`, inclusive o recorte da edição vigente para quem não é admin.

Este é o endpoint recomendado para montar a programação de um período — por exemplo, a semana do evento em um ano específico.

| Status | Corpo |
|--------|-------|
| `200` | `[ { ...ação }, ... ]` |
| `400` | `{ "error": "Data inicial inválida." }`, `"Data final inválida."` ou `"A data de início deve ser anterior à data de fim."` |
| `401` | Sem token |

---

## Edições

Uma edição é o ciclo anual. Ela tem dois prazos independentes, ambos `YYYY-MM-DD`:

- **Cadastro** (`data_inicio_cadastro` / `data_fim_cadastro`): quando o organizador pode enviar uma ação.
- **Realização** (`data_inicio_realizacao` / `data_fim_realizacao`): dias que `data_acao` pode usar.

`inscricoes_abertas` é um interruptor manual e não muda sozinho quando a data acaba. `cadastro_aberto` é calculado: o interruptor está ligado e o dia de hoje, em `America/Sao_Paulo`, está dentro do prazo de cadastro, inclusive o dia final.

Só uma edição fica `vigente`. Dá para tornar vigente qualquer ano **maior ou igual** ao calendário atual em `America/Sao_Paulo`, inclusive um menor que a vigente de agora (2026 no lugar de 2027, no mesmo ano civil). Ano já encerrado (2025 em 2026) responde `400` `{ "error": "Não é possível reativar uma edição anterior." }`. Prorrogar, ligar inscrições e ajustar datas só funcionam na vigente.

### `GET /edicoes/vigente`

Público. `404` `{ "error": "Não há edição vigente." }` quando nenhuma está marcada.

**200:**

```json
{
  "id": "uuid",
  "ano": 2026,
  "data_inicio_cadastro": "2026-09-23",
  "data_fim_cadastro": "2026-10-08",
  "data_inicio_realizacao": "2026-11-07",
  "data_fim_realizacao": "2026-11-15",
  "inscricoes_abertas": true,
  "cadastro_aberto": true,
  "vigente": true
}
```

O front usa esse objeto para habilitar o formulário e limitar as datas da ação. A API recusa o `POST /acoes` fora desses prazos mesmo que o front não consulte.

### `GET /edicoes`

Admin. Lista todas, da mais nova para a mais antiga.

**200:** `{ "editions": [ { ...mesmo objeto do vigente } ] }`

### `GET /edicoes/:id`

Admin. O mesmo objeto, mais `prorrogacoes`:

```json
{
  "prorrogacoes": [
    {
      "id": "uuid",
      "data_fim_cadastro_anterior": "2026-10-08",
      "data_fim_cadastro_nova": "2026-10-15",
      "prorrogada_em": "2026-10-07T18:00:00.000Z",
      "id_usuario": "uuid",
      "nome_usuario": "Admin"
    }
  ]
}
```

`404` `{ "error": "Edição não encontrada." }`

### `POST /edicoes`

Admin.

```json
{
  "ano": 2026,
  "data_inicio_cadastro": "2026-09-23",
  "data_fim_cadastro": "2026-10-08",
  "data_inicio_realizacao": "2026-11-07",
  "data_fim_realizacao": "2026-11-15",
  "inscricoes_abertas": true,
  "vigente": true
}
```

`ano` é número inteiro de 2000 a 2100 e tem de ser ≥ o calendário atual em `America/Sao_Paulo`, mesmo com `vigente: false`. As quatro datas têm de ser desse mesmo ano civil (`2026-11-07` numa edição 2026; `2027-01-05` é recusado). Os booleanos não aceitam string. Com `vigente: true`, a vigente anterior deixa de ser vigente — pode ser um ano menor, igual ou maior, desde que não seja anterior ao calendário.

| Status | Corpo |
|--------|-------|
| `201` | Objeto da edição, com `cadastro_aberto` |
| `400` | Validação, `"Ano de edição já cadastrado."`, `"Não é possível cadastrar uma edição de um ano anterior."` ou `"As datas da edição precisam pertencer ao ano <ano>."` |
| `401` / `403` | Sem token / não é admin |

### `PUT /edicoes/:id/prorrogar`

Admin. Só a vigente. Só avança o fim do cadastro e grava o histórico.

```json
{ "data_fim_cadastro": "2026-10-15" }
```

| Status | Corpo |
|--------|-------|
| `200` | Edição atualizada |
| `400` | `"A nova data final do cadastro deve ser posterior à atual."`, `"As datas da edição precisam pertencer ao ano <ano>."` ou `"Só é possível alterar a edição vigente."` |
| `404` | Edição não encontrada |

### `PUT /edicoes/:id/inscricoes`

Admin. Só a vigente.

```json
{ "inscricoes_abertas": false }
```

`200` devolve a edição. Com a data ainda dentro do prazo, `cadastro_aberto` fica `false`.

### `PUT /edicoes/:id/vigente`

Admin. Sem corpo. Torna essa edição a vigente se o ano for maior ou igual ao calendário atual. Pode voltar de 2027 para 2026 no mesmo ano civil. Ano encerrado responde `400` `{ "error": "Não é possível reativar uma edição anterior." }`. Se ela já for a vigente, responde `200` sem alterar nada.

### `PUT /edicoes/:id`

Admin. Só a vigente. Ajusta início do cadastro, realização e, **se a edição não tiver ação**, o fim do cadastro (pode encolher, sem gravar prorrogação). Com ação, o fim do cadastro só muda em `/prorrogar`. O novo intervalo de realização precisa continuar cobrindo as ações já gravadas.

```json
{
  "data_inicio_cadastro": "2026-09-23",
  "data_fim_cadastro": "2026-10-08",
  "data_inicio_realizacao": "2026-11-07",
  "data_fim_realizacao": "2026-11-15"
}
```

Pelo menos um campo. Datas no ano da edição. Com ação, mandar `data_fim_cadastro` responde `400` `"A data final do cadastro só pode ser alterada pela prorrogação."`

### `DELETE /edicoes/:id`

Admin. Sem corpo. Só edição **sem ações** (a vigente vazia também sai). Histórico de prorrogação daquela edição, se houver, é apagado junto. Sem vigente, `GET /edicoes/vigente` passa a `404` e a listagem pública fica vazia.

| Status | Corpo |
|--------|-------|
| `200` | **Vazio** |
| `404` | `{ "error": "Edição não encontrada." }` |
| `409` | `{ "error": "Não é possível excluir uma edição vinculada a ações." }` |
| `401` / `403` | Sem token / não é admin |

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
| `401` | `Sessão inválida.` com `code: TOKEN_EXPIRED` | JWT com `exp` vencido |
| `401` | `Sessão inválida.` (sem `code`) | Token adulterado/malformado, ou usuário excluído/desativado |
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

# Minhas ações (qualquer situação do usuário autenticado)
curl -H "Authorization: Bearer $TOKEN" 'http://localhost:3000/acoes/minhas?page=1&limit=10'

# Fila de moderação (admin)
curl -H "Authorization: Bearer $TOKEN" 'http://localhost:3000/acoes?situacao=0'

# Aprovar uma ação
curl -X PUT "http://localhost:3000/acoes/<id>" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"situacao_acao":"1"}'

# Programação de um período
curl -H "Authorization: Bearer $TOKEN" \
  'http://localhost:3000/acoes/2026-11-07/2026-11-15'

# Edição vigente (prazos do formulário e das ações)
curl 'http://localhost:3000/edicoes/vigente'
```
