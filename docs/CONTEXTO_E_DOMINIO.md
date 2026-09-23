# Contexto e domínio

## O problema que a aplicação resolve

O **CaxiasLixoZero** é uma iniciativa ambiental de Caxias do Sul (RS). Todos os anos, dentro de um período específico do calendário, empresas, escolas, ONGs e cidadãos organizam ações voltadas à redução de resíduos: mutirões de limpeza, oficinas de compostagem, palestras, feiras de troca, coletas seletivas.

Antes deste sistema, o cadastro dessas ações era manual e a curadoria acontecia fora de qualquer ferramenta. A API existe para centralizar três coisas:

1. **Captação** — organizadores se cadastram e submetem suas ações com todos os dados necessários para divulgação.
2. **Curadoria** — administradores revisam cada submissão e decidem se ela entra ou não na programação oficial.
3. **Publicação** — apenas ações aprovadas são expostas publicamente, com dados de contato pessoais removidos.

Toda comunicação com o organizador acontece por e-mail transacional, disparado automaticamente em cada mudança de estado.

## Papéis

Só existem dois papéis, distinguidos pelo campo `Usuario.tipo`:

| Papel | `tipo` | O que faz |
|-------|--------|-----------|
| **Administrador** | `'0'` | Aprova e reprova ações, vê todas as ações em qualquer situação com dados completos, cria categorias, lista e remove usuários |
| **Organizador (comum)** | `'1'` | Cadastra ações, consulta as próprias em qualquer situação (`GET /acoes/minhas`) e a programação pública (só aprovadas) |

Cuidado com a inversão: `'0'` é o administrador, não o usuário comum. A verificação está centralizada em `src/shared/utils/usuarioEhAdmin.ts`.

**Não existe caminho pela API para criar um administrador.** `Usuario.criarNovoUsuario()` grava `tipo: '1'` fixo. Promover alguém exige `UPDATE` direto no banco. O mesmo vale para desativar contas: o campo `status` (boolean) bloqueia login e invalida sessões em andamento, mas nenhum endpoint o altera.

Existe também o **visitante anônimo**, que não é um papel modelado: é qualquer requisição sem token. Ele consegue listar categorias e listar ações aprovadas.

## Entidades

### Ação (`Acao`)

O agregado central. Uma ação é um evento único, com data e hora marcadas, pertencente a uma categoria e a um usuário responsável.

Campos, agrupados por propósito:

| Grupo | Campos |
|-------|--------|
| Identificação | `id`, `titulo_acao`, `descricao_acao`, `id_categoria` |
| Organizador | `nome_organizador`, `celular`, `numero_organizadores_acao`, `id_usuario_responsavel` |
| Quando | `data_acao` (data **e** hora em um único `DateTime`) |
| Como | `forma_realizacao_acao`, `tipo_publico_acao` |
| Onde | `nome_local_acao`, `endereco_local_acao` (presencial/híbrida), `link_divulgacao_acesso_acao` (online/híbrida) |
| Divulgação | `orientacao_divulgacao_acao`, `link_para_inscricao_acao`, `informacoes_acao` |
| Controle | `situacao_acao`, `data_cadastro`, `data_atualizacao`, `id_usuario_alteracao` |

### Categoria

Apenas `id` e `descricao` (máximo 100 caracteres, única). Classifica as ações — reciclagem, compostagem, educação ambiental etc. Só administradores criam categorias, e não há endpoint para editar nem excluir.

### Usuário

`id`, `nome`, `email` (único), `senha` (hash bcrypt, custo 10), `cpf_cnpj` (único, `VarChar(14)`), `status`, `tipo`. Aceita tanto pessoa física quanto jurídica no mesmo campo de documento. O documento é gravado inteiro; a listagem admin (`GET /usuarios`) devolve só a forma mascarada.

### E-mail

Não é persistido. É um value object (`src/domain/email/entity/Email.ts`) com `from`, `to`, `subject` e `html`, criado no momento do envio.

## Ciclo de vida da ação

```
                                       ┌──────────────────────────┐
[organizador] POST /acoes              │ e-mail: ação cadastrada  │
        │                              └──────────────────────────┘
        ▼                                           ▲
   ┌──────────┐                                     │
   │ Pendente │ ────────────────────────────────────┘
   │   '0'    │
   └────┬─────┘
        │  [admin] PUT /acoes/:id
        │
        ├── situacao_acao = '1' ──►  ┌──────────┐  ──►  e-mail: ação aprovada
        │                            │ Aprovada │       visível publicamente
        │                            └──────────┘
        │
        └── situacao_acao = '2' ──►  ┌───────────┐ ──►  e-mail: ação reprovada
                                     │ Reprovada │      invisível publicamente
                                     └───────────┘
```

Características do fluxo, todas verificáveis em `src/application/usecases/acao/`:

- Uma ação **sempre** nasce `Pendente`. O cliente não escolhe a situação inicial.
- O organizador responsável vê as próprias ações em qualquer situação em `GET /acoes/minhas`. A programação pública (`GET /acoes`) continua expondo só `Aprovada`.
- As transições não são restritas por estado de origem. Um admin pode reprovar uma ação já aprovada, ou reaprovar uma reprovada, quantas vezes quiser. Cada transição dispara um novo e-mail.
- Só os valores `'1'` e `'2'` são aceitos em `PUT /acoes/:id`. Tentar voltar para `'0'` (Pendente) é rejeitado com erro de "Situação inválida".
- `id_usuario_alteracao` registra quem fez a última mudança. Na criação, ele é preenchido com o próprio `id_usuario_responsavel`.
- Não há exclusão de ações pela API. `AcaoPrismaRepository.deletar()` existe, mas nenhuma rota o usa.

## Regras de validação da ação

Concentradas em `Acao.validacao()`, executada apenas por `criarNovaAcao()`. `carregarAcaoExistente()` não valida nada — é o caminho de hidratação a partir do banco.

**Sempre obrigatórios:**

| Campo | Regra | Mensagem de erro |
|-------|-------|------------------|
| `nome_organizador` | não vazio | "A ação deve possuir um nome de organizador." |
| `celular` | não vazio e exatamente 11 caracteres | "Número de celular inválido." |
| `titulo_acao` | não vazio | "A ação deve possuir um título." |
| `descricao_acao` | não vazio | "A ação deve possuir uma descrição." |
| `id_categoria` | não vazio | "A ação deve possuir uma categoria informada." |
| `data_acao` | data válida e **posterior ao momento atual** | "Data de ação deve ser posterior a data atual." |
| `forma_realizacao_acao` | `'0'`, `'1'` ou `'2'` | "Forma de realização inválida." |
| `tipo_publico_acao` | `'0'` ou `'1'` | "Tipo de público inválido." |
| `numero_organizadores_acao` | número ≥ 1 | "A ação deve possuir o número aproximado de organizadores" |
| `orientacao_divulgacao_acao` | não vazio | "...orientações de como será divulgada." |
| `id_usuario_responsavel` | não vazio (vem do token, não do body) | "A ação deve possuir um usuário responsável." |

**Condicionais, conforme `forma_realizacao_acao`:**

| Forma | Campos adicionais exigidos |
|-------|----------------------------|
| Online (`'0'`) | `link_divulgacao_acesso_acao` |
| Presencial (`'1'`) | `nome_local_acao`, `endereco_local_acao` |
| Híbrida (`'2'`) | `link_divulgacao_acesso_acao`, `nome_local_acao`, `endereco_local_acao`, `informacoes_acao` |

**Regra de unicidade:** `CriarAcao` rejeita títulos já existentes (`buscarPorTitulo`), com a mensagem "Título já cadastrado.". A checagem é feita na aplicação, sem índice único no banco, e vale para toda a base — inclusive ações de anos anteriores.

Duas observações sobre o que **não** é validado: `link_para_inscricao_acao` é aceito vazio ou em qualquer formato, e `celular` só tem o comprimento conferido (não há verificação de que sejam dígitos).

## Regras de usuário e categoria

`CriarUsuario` verifica duplicidade de `email` e de `cpf_cnpj`, e nada mais — não há validação de formato de e-mail, de dígito verificador de CPF/CNPJ, nem qualquer exigência de força de senha. A senha é hasheada com bcrypt dentro da própria entidade, em `criarNovoUsuario()`.

`DeletarUsuario` bloqueia a exclusão quando o usuário está vinculado a alguma ação, seja como responsável ou como autor da última alteração (`possuiAcaoVinculada`), respondendo `409`. O repositório ainda captura os códigos Prisma `P2003`/`P2014` como rede de segurança contra violação de chave estrangeira.

`RedefinirSenha` exige senha nova entre 10 e 128 caracteres, sem regra de maiúscula, número ou símbolo. A senha anterior permanece válida até essa troca. O e-mail do pedido é o mesmo já gravado na conta, inclusive para quem cadastrou em anos anteriores.

`CriarCategoria` rejeita descrições duplicadas e descrições acima de 100 caracteres.

## E-mails transacionais

Cinco templates EJS em `src/infrastructure/smtp/templates/`. Os três primeiros vão para o e-mail do **usuário responsável** pela ação (não para o `nome_organizador`, que é apenas um texto informativo). Os dois últimos vão para o e-mail da conta que pediu a redefinição de senha:

| Template | Disparado por | Assunto |
|----------|---------------|---------|
| `NotificacaoAcaoCriada.ejs` | `CriarAcao` | `CaxiasLixoZero <ano> - Cadastro da ação: <título>` |
| `NotificacaoAcaoAprovada.ejs` | `AtualizarAcao` com `'1'` | `CaxiasLixoZero <ano> - Informação de ação aprovada!` |
| `NotificacaoAcaoReprovada.ejs` | `AtualizarAcao` com `'2'` | `CaxiasLixoZero <ano> - Informação de ação reprovada!` |
| `RedefinicaoSenha.ejs` | `SolicitarRedefinicaoSenha` | `CaxiasLixoZero <ano> - Redefinição de senha` |
| `SenhaAlterada.ejs` | `RedefinirSenha` | `CaxiasLixoZero <ano> - Sua senha foi alterada` |

O remetente é `caxiaslixozero@gmail.com`, escrito diretamente no código dos casos de uso. O e-mail de criação recebe a data formatada em `dd/mm/aaaa` e o horário em `hh:mm` (via `adicionaZeroAEsquerda`), além das versões textuais dos enums; os de aprovação/reprovação recebem só o nome do usuário. O de redefinição leva o nome e o link `{URL_FRONT}/redefinir-senha?token=...`. O de senha alterada leva só o nome, sem a senha.

Os casos de uso renderizam o template EJS e chamam `IEmailService.enviarEmail()`; a implementação injetada na API (`FilaEmailService`) publica o e-mail já montado na fila Redis `emails`. O worker (`src/worker.ts`) consome o job e envia via Gmail SMTP (`GMAIL_USER`/`GMAIL_PASS`), com até 5 tentativas e backoff exponencial.

Se o Redis estiver indisponível no `queue.add`, a falha é só logada: a ação já foi persistida e a API ainda responde sucesso. Falha de SMTP no worker relança o erro para o BullMQ retentar; jobs esgotados ficam em `failed` no Redis. Retry pode reenviar o mesmo e-mail. Não há transactional outbox.

## O que o modelo de domínio não cobre

Contexto importante ao planejar features, porque essas ausências são frequentemente confundidas com bugs:

- **Não existe conceito de edição anual do evento.** Nenhuma entidade guarda "ano" ou "período de inscrições". O ano é derivado de `data_acao`, e os assuntos dos e-mails usam o ano corrente do servidor. Filtrar a programação de um ano específico exige usar `GET /acoes/:dataInicial/:dataFinal`.
- **Não há janela de inscrição.** A única restrição temporal é que a data da ação seja futura.
- **Não há histórico de auditoria.** Só se sabe quem fez a *última* alteração; aprovações e reprovações anteriores se perdem.
- **Não há motivo de reprovação.** O e-mail de reprovação é genérico, sem campo para justificativa.
- **Não há edição de ação pelo organizador.** Depois de criada, só a situação pode mudar, e apenas por um admin. Corrigir um erro de digitação exige intervenção no banco.
