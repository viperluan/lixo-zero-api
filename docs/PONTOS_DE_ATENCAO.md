# Pontos de atenção

Inventário do que está inconsistente, incompleto ou surpreendente no código atual. Serve para dois propósitos: evitar que alguém "conserte" um comportamento intencional, e evitar que alguém construa em cima de um bug achando que é feature.

Nada aqui foi alterado — é um retrato do estado atual.

## Bugs e comportamentos incorretos

### Filtro por data compara timestamp exato

`AcaoPrismaRepository.montarWhere()` faz `where.data_acao = new Date(filtros.data_acao)`, uma igualdade exata contra um `TIMESTAMP(3)` que inclui hora.

Consequência: `GET /acoes?data_acao=2026-09-15` só retorna ações marcadas exatamente para `2026-09-15T00:00:00.000Z`. Uma ação às 14h nunca aparece. Na prática esse filtro quase sempre devolve lista vazia.

A correção seria usar um intervalo `gte`/`lt` cobrindo o dia.

### `UsuarioPrismaRepository.atualizar()` usa o e-mail como chave

```ts
await this.prisma.usuario.update({ where: { email }, data });
```

O método localiza o registro pelo `email` e ao mesmo tempo tenta atualizar o `email` — então nunca conseguiria trocar o endereço de um usuário. Também não é possível atualizar `nome`, `senha` ou `cpf_cnpj` de forma independente. O método é código morto hoje (nenhum caso de uso o chama), mas precisa ser reescrito para usar `id` antes de qualquer feature de edição de perfil.

### Escrita e efeito colateral sem transação

`CriarAcao` salva a ação e só depois busca o usuário responsável; se o usuário não for encontrado, o caso de uso lança e o cliente recebe `400` — mas **a ação já está no banco**. `AtualizarAcao` tem o mesmo formato: gera o template, atualiza a situação, depois envia o e-mail, sem rollback caso um passo posterior falhe.

Na prática o cenário é raro (o usuário acabou de ser autenticado), mas é uma inconsistência real entre resposta de erro e estado persistido.

### Unicidade verificada em duas etapas

Título de ação, descrição de categoria, e-mail e CPF/CNPJ têm a duplicidade checada com um `SELECT` seguido de `INSERT`. Duas requisições simultâneas passam pela checagem antes de qualquer uma inserir. `Usuario.email` e `Usuario.cpf_cnpj` têm índice único no banco, então falham com erro Prisma pouco legível; `titulo_acao` e `Categoria.descricao` **não têm** índice único, então a duplicata simplesmente entra.

## Inconsistências de API

### Formato de erro varia

Controllers respondem `{ error: "..." }`; middlewares e rate limit respondem `{ message: "..." }`. Clientes precisam checar as duas chaves.

### Códigos de status inconsistentes

A maioria dos controllers responde `400` para qualquer exceção, incluindo falhas internas. `UsuarioController.buscarTodos` chega a responder `400` até para erro de banco. O único lugar que diferencia corretamente é `autenticar` (`401`).

Erros de domínio também não têm classes tipadas: a tradução para HTTP é feita comparando strings de mensagem.

### `PUT /acoes/:id` não é um update

Só aceita `situacao_acao`, e só com os valores `'1'` ou `'2'`. Semanticamente é `POST /acoes/:id/aprovar` e `POST /acoes/:id/reprovar`. Nada mais na ação pode ser editado por nenhum endpoint.

### Sem filtro de intervalo de data no endpoint público

`GET /acoes` não tem um filtro do tipo "a partir de X". O query `data_acao` compara timestamp por igualdade exata (ver o primeiro item deste documento) e não serve para recortar um período.

O front contorna isso buscando `page=1&limit=100` e filtrando as futuras no cliente — é o que a faixa "Próximas ações" da home faz. Funciona enquanto o total de ações aprovadas couber em 100. Como a listagem sai ordenada por `data_acao` crescente, quando o histórico acumulado de várias edições passar de 100 a página 1 será só passado e a faixa deixará de aparecer: falha silenciosa, não quebra a página.

- **Correção preferida:** aceitar `data_acao_inicial` (`gte`) em `montarWhere()` do `AcaoPrismaRepository` e expor o query param em `listarTodasAcoes`. Resolve a home, a agenda e a raiz do bug de igualdade exata de uma vez.
- **Paliativo no cliente:** se `totalPages > 1` e nenhuma ação da página 1 for futura, buscar `page=totalPages`.

### Chaves de resposta em inglês, campos em português

`{ "actions": [...], "totalPages": 3, "currentPage": 1 }`, mas cada item tem `titulo_acao`, `nome_organizador`. Idem para `users` e `categories`. O front depende disso; qualquer mudança precisa ser coordenada.

### Respostas vazias em criação

`POST /usuarios` responde `201` sem corpo (`response.status(201).end()`). `POST /acoes` responde só `{ id }`. Um cliente que espere o recurso criado não o recebe.

## Lacunas de validação

Nenhuma biblioteca de validação de schema está instalada. As entidades validam presença e regras de negócio, mas não tipos, então valores com o tipo errado atravessam a camada de domínio e só quebram no Prisma.

O que não é validado em nenhum lugar:

| Campo | Situação |
|-------|----------|
| `email` | Sem verificação de formato |
| `senha` | Sem tamanho mínimo ou requisito de complexidade |
| `cpf_cnpj` | Sem validação de dígito verificador ou de comprimento; só unicidade |
| `celular` | Só o comprimento (11); letras passam |
| `link_para_inscricao_acao` | Nunca validado, nem presença nem formato |
| `link_divulgacao_acesso_acao` | Só presença, e apenas para online/híbrida |
| `id_categoria` | Só presença; não se verifica se a categoria existe (a FK barra depois, com erro obscuro) |
| `titulo_acao`, `descricao_acao` | Sem limite de tamanho (colunas `TEXT`) |
| `page`, `limit` | Normalizados, não validados — valores inválidos caem para o padrão silenciosamente |

## Código morto

| Item | Onde |
|------|------|
| `test/categoria.test.ts` | Importa `supertest` e usa `describe`/`it`, mas nem jest nem supertest estão no `package.json` e não há script `test`. Além disso, o segundo caso de teste espera `201` para uma descrição vazia, que hoje é `400`. O arquivo não roda e está desatualizado. |
| `Acao.validarLocalAcao()` | Método privado nunca chamado; foi substituído por `validarNomeLocalAcao` e `validarEnderecoLocalAcao` |
| `AcaoPrismaRepository.deletar()` | Sem rota correspondente |
| `AcaoPrismaRepository.buscarQuantidadeDeAcoes()` | Substituído por `contarComFiltros`, nunca chamado |
| `CategoriaPrismaRepository.atualizar()` / `deletar()` / `buscarPorId()` | Sem rotas correspondentes |
| `UsuarioPrismaRepository.atualizar()` | Sem rota correspondente, e quebrado (ver acima) |
| `FiltrosListarComPaginacaoType.id_usuario_responsavel` | Declarado no tipo, mas `montarWhere` só lê `id_usuario` |

## Dívidas de arquitetura

### Domínio importando da aplicação

`src/domain/acao/repository/IAcaoRepository.ts` importa `FiltrosListarComPaginacaoType` de `@/application/repositories/AcaoPrismaRepository`. Inverte a direção das dependências: o domínio passa a depender de um detalhe de implementação. O tipo deveria morar em `domain/`.

### `IAcaoRepository.atualizar` recebe `unknown`

A interface declara `atualizar(id: string, campos: unknown)`, enquanto a implementação usa `Pick<Acao, 'situacao_acao' | 'id_usuario_alteracao'>`. O `unknown` anula a checagem de tipo em quem consome a interface.

### Sem middleware de erro central

Cada controller repete `try/catch`. Um `errorHandler` do Express com classes de erro tipadas eliminaria a comparação de mensagens e padronizaria os status.

### Sem camada de logging

Só `console.error` e `console.log`. Não há logger estruturado, correlação de requisições nem níveis de log.

### Instanciação repetida de casos de uso

Casos de uso são construídos a cada requisição dentro do handler. É barato (são objetos leves), mas espalha o wiring de dependências por todos os controllers em vez de concentrá-lo em um ponto.

## Operacional

### Enfileirar e-mail pode falhar depois da ação salva

Não há transactional outbox. `CriarAcao` e `AtualizarAcao` persistem no Postgres e só então publicam o job na fila Redis. Se o Redis estiver fora, `FilaEmailService` registra o erro e não relança — a API responde `201`/`200` e o e-mail não entra na fila. O mesmo vale para timeout de conexão no `queue.add`.

SMTP com erro **é** relançado no worker (`NodemailerService` não engole mais a exceção), então o BullMQ retenta. Depois de esgotar as tentativas o job fica em `failed` no Redis. Retry bem-sucedido após um envio parcial (SMTP aceitou e a conexão caiu) pode duplicar o e-mail; para estes avisos transacionais isso é aceitável.

Para inspecionar: `docker exec -it lixozero-redis redis-cli -a "$REDIS_PASSWORD"` e as chaves BullMQ da fila `emails`.

### Templates dependem de `process.cwd()` e de `NODE_ENV`

`resolveCaminhoArquivoTemplate()` monta o caminho a partir do diretório de trabalho do processo e escolhe entre `src/` e `dist/` conforme `NODE_ENV`. Rodar a aplicação de outro diretório quebra a renderização dos e-mails; e como `GerarTemplate*` retorna `null` em caso de erro, `CriarAcao` falha com `"Erro ao gerar template."` **depois** de já ter salvo a ação.

### Nenhuma suíte de testes

Não há framework de teste instalado nem script `test`. A validação disponível é `npm run typecheck` e `npm run lint`.

### `/health` não verifica o banco

Responde `200` mesmo com o Postgres fora do ar — foi uma decisão explícita (commit `fix: remove a validação do banco para o healthcheck`), provavelmente para evitar que o container fosse reiniciado durante indisponibilidades transitórias do banco. Vale saber que o healthcheck confirma apenas que o processo Node está de pé.

### Variáveis de ambiente do `docker-compose.yml`

O serviço `lixozero-api` repassa `PORT`, `SECRET_KEY`, `CORS_ORIGIN`, `JWT_EXPIRES_IN`, `RATE_LIMIT_ENABLED`, `FILA_EMAIL_TENTATIVAS` e `FILA_EMAIL_BACKOFF_MS`. `GMAIL_USER`/`GMAIL_PASS` e `FILA_EMAIL_CONCORRENCIA` ficam só no `lixozero-worker`.

`DATABASE_URL` e `REDIS_URL` **não** vêm do `.env`: são montadas inline no compose, com os hosts `lixozero-db` e `lixozero-redis` da rede interna. O `.env` guarda as variantes com `localhost`, para o ferramental do host (`prisma studio`, `migrate dev`, `start:dev`). A senha vem do mesmo `DB_PASSWORD`/`REDIS_PASSWORD` que alimenta os containers, então as duas pontas não divergem.

Com `CORS_ORIGIN` vazio, `obterOpcoesCors()` devolve `{}` e libera qualquer origem — é o que permite o front de desenvolvimento (`:5173`) falar com a API. Em produção, defina a lista no `.env`.

### `image: postgres` precisa continuar pinada

A imagem está em `postgres:16`. A tag estava aberta (`postgres`, isto é, `latest`) e isso quebrou: a partir do Postgres 18 o data dir mudou de layout — espera o mount em `/var/lib/postgresql`, não em `/var/lib/postgresql/data` — e o container recusa subir sobre um `pg_data` no formato antigo. Subir a major exige `pg_upgrade`, não só trocar a tag. Também não use a variante `-alpine`: trocar glibc por musl muda a collation e invalida índices de texto de um banco já existente.

### Rate limit em memória

Contadores zeram a cada restart e não são compartilhados entre instâncias. Escalar horizontalmente exige um store externo.

## Comportamentos intencionais que parecem bugs

Não "conserte" nenhum destes sem entender o motivo:

| Comportamento | Por quê |
|---------------|---------|
| Consulta ao banco a cada requisição autenticada | Faz desativação, rebaixamento e exclusão de conta terem efeito imediato, sem esperar o token expirar. Está documentado em `UsuarioAutenticado`. |
| `helmet({ contentSecurityPolicy: false })` | A API só serve JSON; CSP não agrega e pode atrapalhar clientes. |
| `/health` isento do rate limit | O healthcheck do Docker bate a cada 30s e não deve consumir a cota nem ser bloqueado. |
| `app.set('trust proxy', 1)` | A API roda atrás de um proxy reverso; sem isso o rate limit veria só o IP do proxy. |
| Mesma mensagem de erro para e-mail inexistente e senha errada | Evita enumeração de usuários. |
| `algorithms: ['HS256']` fixo no `jwt.verify` | Bloqueia ataque de confusão de algoritmo. |
| Usuários sempre criados com `tipo: '1'` | Impede escalação de privilégio via cadastro público. Admins são promovidos por SQL. |
