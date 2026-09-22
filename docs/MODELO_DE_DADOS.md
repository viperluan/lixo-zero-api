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
└─────────────────┘
```

Três tabelas, sem tabelas de junção. Toda relação é 1:N a partir de `Acao`.

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

### `Acao`

| Coluna | Tipo | Notas |
|--------|------|-------|
| `id` | `TEXT` PK + UNIQUE | UUID v4; tem índice único redundante com a PK |
| `nome_organizador` | `TEXT` | Era `VARCHAR(60)` até a migration de out/2025 |
| `celular` | `VARCHAR(11)` | Só dígitos, sem máscara |
| `titulo_acao` | `TEXT` | Unicidade **apenas na aplicação** |
| `descricao_acao` | `TEXT` | |
| `data_acao` | `TIMESTAMP(3)` | Data **e** hora do evento |
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

## Chaves estrangeiras

As três FKs de `Acao` usam `ON DELETE RESTRICT ON UPDATE CASCADE`. Consequências práticas:

- Não dá para excluir uma categoria que tenha ações.
- Não dá para excluir um usuário que seja responsável por alguma ação **ou** que tenha sido o último a alterar alguma ação. `DeletarUsuario` antecipa essa checagem com `possuiAcaoVinculada()` para devolver um `409` legível, e `UsuarioPrismaRepository.deletar()` ainda captura os códigos Prisma `P2003`/`P2014` como rede de segurança.

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

Só existem os criados pelas constraints: PKs, `Usuario_email_key`, `Usuario_cpf_cnpj_key` e `Acao_id_key`.

Não há índice em `Acao.data_acao`, `Acao.situacao_acao` nem `Acao.id_categoria`, que são exatamente as colunas mais filtradas em `GET /acoes`. Também não há índice de texto para o `search`, que usa `contains` com `mode: 'insensitive'` em quatro colunas — isso vira `ILIKE '%termo%'`, incapaz de usar índice B-tree convencional. Aceitável no volume atual (dezenas a centenas de ações por ano); é o primeiro lugar a olhar se a listagem ficar lenta.

## Histórico de migrations

| Migration | O que mudou |
|-----------|-------------|
| `20240905022826_inicia_migrations` | Criação inicial: `Categoria`, `Usuario`, `Acao`, `Patrocinador`, `Cota` |
| `20240913012708_adiciona_campos_publico_e_orientacao_divulgacao` | Adiciona `tipo_publico` e `orientacao_divulgacao` |
| `20240915060259_adiciona_campos_necessarios_para_email` | Reformula os campos de local e link para atender aos templates de e-mail |
| `20251007231610_change_field_size_nome_organizador` | `nome_organizador` de `VARCHAR(60)` para `TEXT` |
| `20260611120000_remove_patrocinio_cota` | Remove `Patrocinador`, `Cota` e `Acao.receber_informacao_patrocinio` |

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
