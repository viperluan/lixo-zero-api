# Arquitetura

## Visão geral

O projeto segue Clean Architecture com três camadas e uma camada transversal de utilitários. A regra que sustenta tudo: **dependências apontam para dentro**.

```
┌─────────────────────────────────────────────────────────┐
│ infrastructure/                                         │
│   http/routes → http/controllers → http/middlewares     │
│   http/config (cors, rateLimit) · smtp/templates · fila (BullMQ)        │
└───────────────────────┬─────────────────────────────────┘
                        │ instancia e chama
┌───────────────────────▼─────────────────────────────────┐
│ application/                                            │
│   usecases/    (regra de aplicação, orquestração)       │
│   repositories/ (implementações Prisma)                 │
│   services/     (FilaEmailService · NodemailerService)  │
└───────────────────────┬─────────────────────────────────┘
                        │ depende de abstrações
┌───────────────────────▼─────────────────────────────────┐
│ domain/                                                 │
│   entity/     Acao · Usuario · Categoria · Edicao · Email   │
│   enum/       AcaoSituacao · AcaoFormaRealizacao ·      │
│               AcaoTipoPublico                            │
│   repository/ IAcaoRepository · IUsuarioRepository ·    │
│               ICategoriaRepository · IEdicaoRepository   │
│   service/    IEmailService                              │
└─────────────────────────────────────────────────────────┘

shared/  utils · types · package (instâncias de prisma e nodemailer)
```

`domain/` é puro TypeScript: não importa Express, Prisma, nodemailer, nem nada das outras camadas. A única exceção prática são as bibliotecas `uuid` e `bcrypt`, usadas dentro das entidades para gerar identificadores e hashear senha.

Há um vazamento conhecido no sentido contrário: `IAcaoRepository` (em `domain/`) importa o tipo `FiltrosListarComPaginacaoType` de `application/repositories/AcaoPrismaRepository`. É um acoplamento indevido de domínio para aplicação — está listado em [`PONTOS_DE_ATENCAO.md`](PONTOS_DE_ATENCAO.md).

## Fluxo de uma requisição

Exemplo com `POST /acoes`, o caminho mais completo do sistema:

```
1. src/app.ts            helmet → cors → express.json (500kb) → rate limit global
2. routes/index.ts       roteia /acoes para acaoRoutes
3. routes/acaoRoutes.ts  AutenticacaoMiddleware
4.   ↳ middleware        extrai o Bearer token, verifica a assinatura JWT,
                         recarrega o usuário do banco, popula request.usuario
                         (JWT expirado → 401 com code TOKEN_EXPIRED)
5. controllers/AcaoController.criarAcao
                         lê request.body, injeta id_usuario_responsavel do token,
                         instancia CriarAcao com repositórios e FilaEmailService
6. usecases/acao/CriarAcao.executar
                         exige edição vigente com cadastro aberto
                         exige data_acao dentro da realização
                         verifica título duplicado na edição
                         Acao.criarNovaAcao() → valida e gera o UUID
                         acaoRepository.salvar()
                         busca o usuário, formata data/hora
                         renderiza o template EJS
                         emailService.enviarEmail() → publica job na fila Redis
7. controller            responde 201 { id }  |  catch → 400 { error: mensagem }
8. worker.ts             consome a fila `emails` e envia via Nodemailer/Gmail SMTP
```

`GET /acoes/minhas` reusa o caso de uso `ListarAcoes`, sem classe nova — inclusive a ordenação de `listarComPaginacao` (`data_acao` crescente, `id` como desempate). A rota estática é registrada **antes** de `GET /acoes/:data` em `acaoRoutes.ts`; se ficar depois, `"minhas"` cai no parser de data e vira `400`. O controller `listarMinhasAcoes` exige `AutenticacaoMiddleware`, injeta `id_usuario` a partir de `request.usuario.id` (ignora a query), não sanitiza a saída e respeita `?situacao=` quando informado.

Os middlewares globais são aplicados na ordem exata declarada em `src/app.ts`:

```ts
app.set('trust proxy', 1);

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors(obterOpcoesCors()));
app.use(express.json({ limit: '500kb' }));
app.use(criarRateLimitGlobal());

app.use(routes);
```

`src/server.ts` só chama `app.listen(process.env.PORT || 3000)`. Manter o `app` separado do `server` permite importar a aplicação em testes sem subir o servidor.

## Injeção de dependência

Manual, sem container. Cada controller instancia os repositórios uma única vez, no escopo do módulo, e cria o caso de uso a cada requisição:

```ts
// src/infrastructure/http/controllers/AcaoController.ts
const acaoPrismaRepository = new AcaoPrismaRepository(prisma);
const usuarioPrismaRepository = new UsuarioPrismaRepository(prisma);
const filaEmailService = new FilaEmailService(filaEmail);
```

Os repositórios recebem o `PrismaClient` singleton de `src/shared/package/prisma`. Os casos de uso de ação recebem `IEmailService`: o controller injeta `FilaEmailService` (publica o job) e o worker injeta `NodemailerService` (SMTP). Os casos de uso dependem apenas das **interfaces** de domínio, o que permitiria trocar Prisma por outra persistência sem tocar em `application/usecases/`.

## Padrão das entidades

Todas as entidades seguem a mesma forma:

- Construtor `private`, então não é possível fazer `new Acao(...)` fora da classe.
- `criarNovaX(props)` — factory de criação. Valida os dados, gera `id` via `uuid`, aplica defaults (situação inicial, timestamps, `tipo: '1'` para usuário).
- `carregarXExistente(props)` — factory de hidratação a partir do banco. **Não valida**, porque o dado já foi validado quando entrou.
- Estado guardado em `private readonly props` e exposto só por getters.
- `Acao` tem getters derivados que traduzem enums para texto: `situacao_acao_texto`, `forma_realizacao_acao_texto`, `tipo_publico_acao_texto`.

## Padrão dos casos de uso

Contrato único, em `src/application/usecases/usecase.ts`:

```ts
export interface Usecase<EntradaDto, SaidaDto> {
  executar(entrada: EntradaDto): Promise<SaidaDto>;
}
```

Cada caso de uso exporta seus tipos `XEntradaDTO` e `XSaidaDTO` (os de e-mail usam o sufixo `Type` em vez de `DTO`), recebe dependências pelo construtor e frequentemente tem um método privado `objetoDeSaida()`/`objetoSaida()` que mapeia entidades para o DTO de resposta.

### Inventário

| Contexto | Caso de uso | Responsabilidade |
|----------|-------------|------------------|
| `acao` | `CriarAcao` | Exige edição vigente com cadastro aberto, data dentro da realização, título único na edição, cria a ação e envia o e-mail |
| | `AtualizarAcao` | Aprova ou reprova, envia o e-mail com o ano da edição |
| | `ListarAcoes` | Listagem paginada com filtros, edição e sanitização opcional (`GET /acoes` e `GET /acoes/minhas`) |
| | `ListarAcoesPorData` | Ações de um dia civil, restritas à vigente para quem não é admin |
| | `ListarAcoesPorIntervaloData` | Ações entre duas datas, com a mesma regra de edição |
| `edicao` | `CriarEdicao` | Cria o ano com os dois prazos, datas só daquele ano |
| | `ObterEdicaoVigente` | Lê a vigente e calcula `cadastro_aberto` |
| | `ListarEdicoes` | Lista os anos para o admin |
| | `BuscarEdicao` | Detalhe com histórico de prorrogações |
| | `ProrrogarEdicao` | Avança só o fim do cadastro da vigente |
| | `AlterarInscricoesEdicao` | Liga ou desliga `inscricoes_abertas` na vigente |
| | `TornarEdicaoVigente` | Troca a vigente para qualquer ano ≥ calendário atual |
| | `AtualizarEdicao` | Ajusta as datas da vigente; fim do cadastro no PUT só sem ação |
| | `DeletarEdicao` | Exclui edição sem ações (inclusive vigente), com o histórico de prorrogação |
| | `ResolverFiltroEdicao` | Decide o `id_edicao` das listagens de ações |
| `usuario` | `CriarUsuario` | Verifica e-mail e CPF/CNPJ duplicados, persiste com senha hasheada |
| | `AutenticarUsuario` | Confere credenciais e `status`, delega a geração do token |
| | `GerarTokenUsuario` | Assina o JWT (HS256) e devolve `expires_in` / `expires_at` |
| | `VerificarTokenUsuario` | Valida a assinatura; token expirado lança `ERRO_TOKEN_EXPIRADO` |
| | `ListarUsuarios` | Listagem paginada |
| | `DeletarUsuario` | Bloqueia exclusão de usuário vinculado a ações |
| | `SolicitarRedefinicaoSenha` | Gera token de uso único e enfileira o e-mail com o link, sem revelar se a conta existe |
| | `RedefinirSenha` | Valida o token, grava a senha nova e enfileira o aviso de senha alterada |
| `categoria` | `CriarCategoria` | Verifica descrição duplicada |
| | `ListarCategorias` | Listagem paginada |
| `email` | `GerarTemplateAcaoCadastrada` | Renderiza EJS com os dados completos da ação |
| | `GerarTemplateAcaoAprovada` | Renderiza EJS de aprovação |
| | `GerarTemplateAcaoReprovada` | Renderiza EJS de reprovação |
| | `GerarTemplateRedefinicaoSenha` | Renderiza EJS com o link de redefinição |
| | `GerarTemplateSenhaAlterada` | Renderiza EJS do aviso de senha alterada |

## Tratamento de erros

Não existe middleware de erro do Express. Cada função de controller tem seu `try/catch`, e a tradução para HTTP é feita comparando a **mensagem** do erro — não há classes de erro tipadas.

O padrão predominante é responder `400` com `{ error: mensagem }`. Os lugares que fogem disso e servem de referência para código novo:

- `UsuarioController.remover` compara com as constantes exportadas `ERRO_USUARIO_NAO_EXISTE` (→ `404`) e `ERRO_USUARIO_VINCULADO_A_ACOES` (→ `409`).
- `UsuarioController.autenticar` mapeia `'Email ou senha incorretos'` para `401`.
- `AutenticacaoMiddleware` compara `ERRO_TOKEN_EXPIRADO` para `401` com `code: TOKEN_EXPIRED`.
- Falhas inesperadas usam `responderErroInterno()`, que loga no console e responde `500` — com a mensagem real fora de produção e com um texto genérico quando `NODE_ENV=production`.

Exportar a mensagem como constante e comparar contra ela, como em `DeletarUsuario`, é o caminho mais robusto entre os que existem hoje.

## Utilitários compartilhados

| Arquivo | Função |
|---------|--------|
| `shared/utils/normalizarPaginacao.ts` | Converte `page`/`limit` da query, com default 10 e teto de 100 |
| `shared/utils/sanitizarAcaoResposta.ts` | Remove `celular` e os e-mails de usuários das respostas públicas |
| `shared/utils/usuarioEhAdmin.ts` | Única fonte de verdade para `tipo === '0'` |
| `shared/utils/responderErroInterno.ts` | Resposta 500 padronizada, com detalhe só fora de produção |
| `shared/utils/resolveCaminhoArquivoTemplate.ts` | Caminho do `.ejs` conforme `NODE_ENV` (`src/` ou `dist/`) |
| `shared/utils/adicionaZeroAEsquerda.ts` | Formatação de data/hora nos e-mails |
| `shared/types/UsuarioAutenticado.ts` | Formato de `request.usuario` |
| `shared/package/prisma/index.ts` | Singleton do `PrismaClient` |
| `shared/package/nodemailer/index.ts` | Transporter Gmail SMTP (usado pelo worker) |

## Build e execução

TypeScript em modo `strict`, `module`/`moduleResolution` = `Node16`, saída em `dist/`. O alias `@/*` → `./src/*` é resolvido por `tsx` em desenvolvimento e reescrito para caminhos relativos por `tsc-alias` no build.

```
npm run build
  ├── rimraf dist          limpa a saída anterior
  ├── tsc                  compila (noEmitOnError: true)
  ├── tsc-alias            reescreve os imports @/ no JS gerado
  └── copy-ejs             copia src/infrastructure/smtp/templates/**/*.ejs para dist/
```

O passo `copy-ejs` é obrigatório porque `tsc` ignora arquivos não-TypeScript e os templates são lidos do disco em runtime. Se um e-mail parar de sair em produção com erro de template, é aqui que se investiga primeiro.

Em produção, `npm start` roda `prisma migrate deploy` antes de subir o processo — as migrations são aplicadas automaticamente no boot. O worker sobe à parte com `npm run start:worker` (`node dist/worker.js`) e não aplica migrations.

## Worker de e-mail

Processo separado em `src/worker.ts`. Consome a fila BullMQ `emails`, monta a entidade `Email` a partir do payload e chama `NodemailerService`. Concorrência padrão 1 (`FILA_EMAIL_CONCORRENCIA`, só no worker), no máximo 5 envios por minuto (limite do Gmail). Tentativas e backoff (`FILA_EMAIL_TENTATIVAS` / `FILA_EMAIL_BACKOFF_MS`) são gravados pela API no `queue.add`, não pelo worker. `SIGTERM`/`SIGINT` esperam o job corrente (`worker.close()`) antes de encerrar a conexão Redis.

## Docker

`Dockerfile` multi-stage sobre `node:20.17.0-alpine3.20`. O estágio `builder` instala dependências, roda `prisma generate` e `npm run build`; o `runner` copia apenas `package.json`, `node_modules`, `dist/` e `prisma/`, fixa `TZ=America/Sao_Paulo` e `NODE_ENV=production`, e define um `HEALTHCHECK` que faz `fetch` em `/health`.

O timezone importa: `data_acao` é comparada com `new Date()` na validação e formatada para os e-mails sem conversão de fuso, então o fuso do container influencia diretamente o comportamento.

`docker-compose.yml` sobe quatro serviços — `lixozero-db` (Postgres, volume em `./pg_data`), `lixozero-redis` (fila, volume nomeado), `lixozero-api` e `lixozero-worker` (mesma imagem, `CMD` `node dist/worker.js`). API e banco usam as redes `lixozero-network` (interna) e a API também entra em `proxy-manager` (externa, para o proxy reverso). Redis e worker ficam só na rede interna; o Redis publica `127.0.0.1:6379` para o `start:dev` no host, sem expor a porta na interface pública. O worker desliga o `HEALTHCHECK` da imagem (não há HTTP). O `app.set('trust proxy', 1)` existe por causa do proxy: sem ele o rate limiting enxergaria o IP do proxy em vez do IP real do cliente.

O worker **não** executa `prisma migrate deploy` — só a API faz isso no boot, para os dois containers não disputarem a migration.
