# Modelo de dados

PostgreSQL gerenciado por Prisma 5. O schema está em `prisma/schema.prisma` e as migrations em `prisma/migrations/`.

## Diagrama

```
┌─────────────────┐
│    Categoria    │
│─────────────────│
│ id      (uuid)  │◄──────────────┐
│ descricao       │               │
└─────────────────┘               │ id_categoria
                                  │
┌─────────────────┐        ┌──────┴────────────────────────┐
│     Usuario     │        │            Acao               │
│─────────────────│        │───────────────────────────────│
│ id      (uuid)  │◄───────┤ id_usuario_responsavel        │
│ nome            │        │ id_usuario_alteracao          │
│ email    UNIQUE │◄───────┤                               │
│ senha  (bcrypt) │        │ ...campos da ação             │
│ status  (bool)  │        └───────────────────────────────┘
│ tipo  varchar2  │
│ cpf_cnpj UNIQUE │
│ senha_alterada_em│
└────────┬────────┘
         │ 1
         │ N
┌────────┴──────────────┐
│   RedefinicaoSenha    │
│───────────────────────│
│ id                    │
│ id_usuario            │
│ token_hash     UNIQUE │
│ expira_em             │
│ usado_em              │
│ criado_em             │
└───────────────────────┘
```

Seis tabelas, sem tabelas de junção. `Acao` e `RedefinicaoSenha` são N:1 a partir de `Usuario`. `Acao` e `ProrrogacaoEdicao` são N:1 a partir de `Edicao`.

## Tabelas

### `Categoria`

| Coluna | Tipo | Notas |
|--------|------|-------|
| `id` | `TEXT` PK | UUID v4 gerado na aplicação |
| `descricao` | `TEXT` | Máximo de 100 caracteres imposto **na entidade**, não no banco |

Não há índice único em `descricao` — a duplicidade é checada em `CriarCategoria` via `buscarPorDescricao`, o que deixa uma janela de corrida em requisições simultâneas.

### `Usuario`

| Coluna | Tipo | Notas |
|--------|------|-------|
| `id` | `TEXT` PK | UUID v4 |
| `nome` | `TEXT` | |
| `email` | `TEXT` UNIQUE | Também usado como chave em `UsuarioPrismaRepository.atualizar()` |
| `senha` | `TEXT` | Hash bcrypt, custo 10 |
| `status` | `BOOLEAN` default `true` | `false` bloqueia login e derruba sessões ativas |
| `tipo` | `VARCHAR(2)` | `'0'` administrador, `'1'` comum |
| `cpf_cnpj` | `VARCHAR(14)` UNIQUE | Persistido sem máscara e sem validação de formato; `GET /usuarios` devolve mascarado |
| `senha_alterada_em` | `TIMESTAMP(3)` NULL | Preenchido na redefinição de senha. JWT com `iat` anterior a esse instante deixa de valer. Contas antigas ficam `NULL` e mantêm a sessão |

### `RedefinicaoSenha`

| Coluna | Tipo | Notas |
|--------|------|-------|
| `id` | `TEXT` PK | UUID gerado pelo Prisma |
| `id_usuario` | `TEXT` FK | → `Usuario.id` |
| `token_hash` | `TEXT` UNIQUE | SHA-256 do token enviado no e-mail. O valor puro não é gravado |
| `expira_em` | `TIMESTAMP(3)` | 1 hora após o pedido |
| `usado_em` | `TIMESTAMP(3)` NULL | Preenchido no uso ou quando um pedido novo invalida o anterior |
| `criado_em` | `TIMESTAMP(3)` default `now()` | Também serve ao intervalo de 2 minutos entre e-mails da mesma conta |

### `Acao`

| Coluna | Tipo | Notas |
|--------|------|-------|
| `id` | `TEXT` PK + UNIQUE | UUID v4; tem índice único redundante com a PK |
| `nome_organizador` | `TEXT` | Era `VARCHAR(60)` até a migration de out/2025 |
| `celular` | `VARCHAR(11)` | Só dígitos, sem máscara |
| `titulo_acao` | `TEXT` | Único junto com `id_edicao` |
| `descricao_acao` | `TEXT` | |
| `data_acao` | `TIMESTAMP(3)` | Data **e** hora do evento. O dia civil usado nos filtros é `America/Sao_Paulo` |
| `id_edicao` | `TEXT` FK | → `Edicao.id`. Obrigatório |
| `forma_realizacao_acao` | `VARCHAR(2)` | Enum `AcaoFormaRealizacao` |
| `link_divulgacao_acesso_acao` | `TEXT` | Link de acesso (online/híbrida) |
| `nome_local_acao` | `TEXT` | Presencial/híbrida |
| `endereco_local_acao` | `TEXT` | Presencial/híbrida |
| `informacoes_acao` | `TEXT` | Instruções extras |
| `link_para_inscricao_acao` | `TEXT` | Nunca validado |
| `tipo_publico_acao` | `VARCHAR(2)` | Enum `AcaoTipoPublico` |
| `orientacao_divulgacao_acao` | `TEXT` | |
| `numero_organizadores_acao` | `INTEGER` | ≥ 1 |
| `data_cadastro` | `TIMESTAMP(3)` default `now()` | |
| `data_atualizacao` | `TIMESTAMP(3)` `@updatedAt` | Mantida pelo Prisma |
| `situacao_acao` | `VARCHAR(2)` | Enum `AcaoSituacao` |
| `id_categoria` | `TEXT` FK | → `Categoria.id` |
| `id_usuario_responsavel` | `TEXT` FK | → `Usuario.id` |
| `id_usuario_alteracao` | `TEXT` FK | → `Usuario.id`, relação nomeada `usuario_alteracao` |

Todos os campos textuais são `NOT NULL`. Campos condicionalmente irrelevantes (por exemplo, `nome_local_acao` em uma ação online) são gravados como string vazia, não como `NULL`.

### `Edicao`

| Coluna | Tipo | Notas |
|--------|------|-------|
| `id` | `TEXT` PK | UUID |
| `ano` | `INTEGER` UNIQUE | Um registro por ano |
| `data_inicio_cadastro` | `DATE` | Abertura do formulário |
| `data_fim_cadastro` | `DATE` | Encerra o formulário. A prorrogação só avança este dia |
| `data_inicio_realizacao` | `DATE` | Primeiro dia permitido em `data_acao` |
| `data_fim_realizacao` | `DATE` | Último dia permitido em `data_acao` |
| `inscricoes_abertas` | `BOOLEAN` | Interruptor manual. Não vira `false` sozinho no fim do prazo |
| `vigente` | `BOOLEAN` | No máximo uma `true`, por índice único parcial |

`cadastro_aberto` não é coluna. A migration `20260923040000_adiciona_edicao` cria uma edição por ano já presente em `data_acao`, com os dois intervalos cobrindo os dias gravados, `inscricoes_abertas = false` e `vigente = false`. Não inventa a edição do ano corrente se ele ainda não tem ação.

### `ProrrogacaoEdicao`

| Coluna | Tipo | Notas |
|--------|------|-------|
| `id` | `TEXT` PK | UUID |
| `id_edicao` | `TEXT` FK | → `Edicao.id` |
| `data_fim_cadastro_anterior` | `DATE` | Fim do cadastro antes da prorrogação |
| `data_fim_cadastro_nova` | `DATE` | Fim do cadastro depois |
| `prorrogada_em` | `TIMESTAMP(3)` | |
| `id_usuario` | `TEXT` FK | → `Usuario.id`, quem prorrogou |

## Chaves estrangeiras

As FKs de `Acao` (categoria, responsável, alteração e edição), a de `RedefinicaoSenha` e as de `ProrrogacaoEdicao` usam `ON DELETE RESTRICT ON UPDATE CASCADE`. Consequências práticas:

- Não dá para excluir uma categoria que tenha ações.
- Não dá para excluir uma edição que tenha ações ou prorrogações.
- Não dá para excluir um usuário que seja responsável por alguma ação, que tenha sido o último a alterar alguma ação, que tenha linha em `RedefinicaoSenha`, ou que tenha prorrogado uma edição. `DeletarUsuario` antecipa a checagem de ações com `possuiAcaoVinculada()` para devolver um `409` legível; as outras FKs ainda barram no banco.

`id_usuario_alteracao` é `NOT NULL` desde o início, por isso `Acao.criarNovaAcao()` o preenche com o próprio `id_usuario_responsavel` na criação.

## Enums

Não são enums do PostgreSQL nem do Prisma — são colunas `VARCHAR(2)` com enums TypeScript em `src/domain/acao/enum/`. Isso significa que **o banco não impede valores inválidos**; a garantia vem só da validação da entidade.

```ts
enum AcaoSituacao        { Pendente = '0', Aprovada = '1', Reprovada = '2' }
enum AcaoFormaRealizacao { Online = '0', Presencial = '1', Hibrida = '2' }
enum AcaoTipoPublico     { Interno = '0', Externo = '1' }
```

`Usuario.tipo` não tem enum correspondente: os valores `'0'` (admin) e `'1'` (comum) são literais espalhados entre `Usuario.criarNovoUsuario()` e `usuarioEhAdmin()`.

## Índices

Constraints únicas: PKs, `Usuario_email_key`, `Usuario_cpf_cnpj_key`, `Acao_id_key`, `Acao_titulo_acao_id_edicao_key`, `Edicao_ano_key` e `RedefinicaoSenha_token_hash_key`. `RedefinicaoSenha` tem índice em `(id_usuario, criado_em)`. `Edicao_vigente_unica` é um índice único parcial `WHERE vigente = true` — o schema Prisma não o declara; ele mora no SQL da migration.

`Acao` tem índice `(id_edicao, situacao_acao, data_acao)`, que cobre o filtro da listagem pública. Não há índice só em `Acao.id_categoria`. Também não há índice de texto para o `search`, que usa `contains` com `mode: 'insensitive'` em quatro colunas — isso vira `ILIKE '%termo%'`, incapaz de usar índice B-tree convencional. Aceitável no volume atual (dezenas a centenas de ações por ano); é o primeiro lugar a olhar se a listagem ficar lenta.

## Histórico de migrations

| Migration | O que mudou |
|-----------|-------------|
| `20240905022826_inicia_migrations` | Criação inicial: `Categoria`, `Usuario`, `Acao`, `Patrocinador`, `Cota` |
| `20240913012708_adiciona_campos_publico_e_orientacao_divulgacao` | Adiciona `tipo_publico` e `orientacao_divulgacao` |
| `20240915060259_adiciona_campos_necessarios_para_email` | Reformula os campos de local e link para atender aos templates de e-mail |
| `20251007231610_change_field_size_nome_organizador` | `nome_organizador` de `VARCHAR(60)` para `TEXT` |
| `20260611120000_remove_patrocinio_cota` | Remove `Patrocinador`, `Cota` e `Acao.receber_informacao_patrocinio` |
| `20260923014701_adiciona_redefinicao_de_senha` | `Usuario.senha_alterada_em` e tabela `RedefinicaoSenha` |
| `20260923040000_adiciona_edicao` | `Edicao`, `ProrrogacaoEdicao`, `Acao.id_edicao` e backfill por ano de `data_acao` |

Dois pontos de contexto que essa linha do tempo revela:

A migration de setembro/2024 foi uma **reformulação de campos**, não uma adição: `link_organizador`, `local_acao`, `orientacao_divulgacao` e `tipo_publico` foram removidos e substituídos por `link_divulgacao_acesso_acao`, `nome_local_acao`, `endereco_local_acao`, `informacoes_acao`, `link_para_inscricao_acao`, `orientacao_divulgacao_acao` e `tipo_publico_acao`. Por isso os nomes atuais têm o sufixo `_acao` redundante — foi o jeito de desambiguar das colunas antigas.

O projeto **teve** um módulo de patrocínio (patrocinadores e cotas), removido em junho/2026. Se você encontrar referências residuais a patrocínio em código ou em conversas, é dessa feature descontinuada que se trata. Nenhum código da aplicação atual a referencia.

## Operações fora da API

Algumas coisas só são possíveis por SQL direto, porque não existe endpoint correspondente:

```sql
-- Promover um usuário a administrador
UPDATE "Usuario" SET tipo = '0' WHERE email = 'admin@exemplo.com';

-- Desativar uma conta (bloqueia login e invalida sessões ativas)
UPDATE "Usuario" SET status = false WHERE email = 'usuario@exemplo.com';

-- Corrigir dados de uma ação já cadastrada
UPDATE "Acao" SET titulo_acao = '...' WHERE id = '...';
```

O primeiro é obrigatório em qualquer ambiente novo: sem ele não existe nenhum administrador e a fila de moderação fica inacessível.

## Comandos Prisma

| Comando | Uso |
|---------|-----|
| `npx prisma migrate dev --name <nome>` | Cria e aplica migration em desenvolvimento |
| `npx prisma migrate deploy` | Aplica migrations pendentes (roda automaticamente no `npm start`) |
| `npx prisma generate` | Regenera o client após alterar o schema |
| `npx prisma studio` | Interface web para inspecionar e editar os dados |
