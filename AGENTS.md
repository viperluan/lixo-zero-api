# AGENTS.md — Lixo Zero API

Ponto de entrada para agentes de IA. Leia este arquivo antes de alterar qualquer coisa e siga os links quando precisar de profundidade.

## O que é este projeto

Back-end (API REST) do **CaxiasLixoZero**, iniciativa ambiental de Caxias do Sul/RS. Todo ano, durante um período determinado, organizações e pessoas realizam ações ambientais (mutirões, oficinas, palestras, coletas). Este sistema é onde essas ações são **cadastradas pelos organizadores** e **aprovadas ou reprovadas por administradores** antes de aparecerem publicamente.

O ciclo de vida central é: organizador se cadastra → autentica → cadastra uma ação (nasce `Pendente`) → recebe e-mail de confirmação → admin aprova ou reprova → organizador recebe e-mail do resultado → ações aprovadas ficam visíveis no endpoint público.

Detalhes de negócio, glossário e regras de validação: [`docs/CONTEXTO_E_DOMINIO.md`](docs/CONTEXTO_E_DOMINIO.md).

## Stack

Node.js 20 · TypeScript (strict) · Express 4 · Prisma 5 + PostgreSQL · JWT (`jsonwebtoken`) · bcrypt · Nodemailer + EJS · Helmet · CORS · `express-rate-limit`. Sem framework de testes instalado.

## Mapa do repositório

```
src/
  server.ts                      # bootstrap: app.listen(PORT)
  app.ts                         # middlewares globais + montagem das rotas
  domain/                        # entidades, enums e interfaces de repositório (sem dependências externas)
    acao/ categoria/ usuario/ email/
  application/                   # casos de uso, implementações de repositório e serviços
    usecases/<contexto>/<Acao>.ts
    repositories/<Entidade>PrismaRepository.ts
    services/email/NodemailerService.ts
  infrastructure/
    http/routes/                 # roteadores Express por recurso
    http/controllers/            # funções exportadas (não classes)
    http/middlewares/            # autenticação, autenticação opcional, admin
    http/config/                 # cors.ts, rateLimit.ts
    smtp/templates/*.ejs         # 3 templates de e-mail
  shared/                        # utils, tipos e instâncias de pacotes (prisma, nodemailer)
prisma/schema.prisma             # 3 modelos: Categoria, Usuario, Acao
prisma/migrations/               # 5 migrations
test/categoria.test.ts           # órfão: não roda (ver Pontos de atenção)
```

## Regras de arquitetura (Clean Architecture)

A direção das dependências é **de fora para dentro** e nunca o contrário:

`infrastructure` → `application` → `domain`

- `domain/` não importa Express, Prisma, nodemailer nem nada de `application`/`infrastructure`. Ele define as interfaces (`IAcaoRepository`, `IUsuarioRepository`, `ICategoriaRepository`, `IEmailService`); as implementações vivem em `application/`.
- Controllers não contêm regra de negócio: só leem `request`, instanciam o caso de uso e traduzem o retorno/erro para HTTP.
- Casos de uso recebem dependências pelo construtor e expõem um único método `executar(entrada)`. Assinatura definida em `src/application/usecases/usecase.ts`.
- Entidades têm construtor privado e dois factories: `criarNovaX(...)` (valida e gera UUID) e `carregarXExistente(props)` (hidrata do banco sem validar). Estado exposto só por getters.
- Injeção de dependência é manual, sem container. Repositórios e serviços são instanciados no topo do arquivo do controller.

Descrição completa do fluxo de uma requisição: [`docs/ARQUITETURA.md`](docs/ARQUITETURA.md).

## Convenções de código

- **Todo o código é em português**: nomes de arquivos, classes, variáveis, mensagens de erro e comentários. Mantenha assim.
- Casos de uso: `executar()`. Tipos de entrada/saída: `XEntradaDTO` / `XSaidaDTO` (alguns usam `...Type`).
- Colunas e campos de payload em `snake_case` (`titulo_acao`, `id_usuario_responsavel`) porque espelham o schema Prisma. Variáveis TypeScript internas em `camelCase`.
- **Chaves de resposta em inglês**: as listagens devolvem `actions` / `users` / `categories`, `totalPages`, `currentPage` — embora os campos internos de cada item sejam em português. É inconsistente, mas o front depende disso; não renomeie sem alinhar.
- Import alias `@/*` aponta para `src/*` (definido em `tsconfig.json`, reescrito no build por `tsc-alias`). Alguns arquivos antigos em `application/repositories/` ainda usam caminhos relativos; prefira `@/` em código novo.
- Enums de domínio são strings numéricas de 1 caractere (`'0'`, `'1'`, `'2'`) porque as colunas são `VarChar(2)`. Nunca compare com números.
- Sem middleware global de erro: cada controller tem seu próprio `try/catch`. Erros de domínio viram `400` na maioria dos casos; use `responderErroInterno()` para falhas inesperadas.

## Enums (decore estes valores)

| Enum | `'0'` | `'1'` | `'2'` |
|------|-------|-------|-------|
| `AcaoSituacao` | Pendente | Aprovada | Reprovada |
| `AcaoFormaRealizacao` | Online | Presencial | Híbrida |
| `AcaoTipoPublico` | Interno | Externo | — |
| `Usuario.tipo` | **Administrador** | Comum | — |

Atenção à inversão: em `Usuario.tipo`, `'0'` é admin e `'1'` é usuário comum. Todo cadastro nasce como `'1'`; não existe endpoint para promover alguém a admin.

## Comandos

| Comando | Uso |
|---------|-----|
| `npm run start:dev` | Desenvolvimento com hot reload (`tsx watch`) |
| `npm run typecheck` | `tsc --noEmit` — **rode sempre após editar TypeScript** |
| `npm run lint` | ESLint com `--max-warnings 0` |
| `npm run build` | `tsc` + `tsc-alias` + cópia dos `.ejs` para `dist/` |
| `npm run start` | Produção: `prisma migrate deploy` e depois `node dist/server.js` |
| `npx prisma migrate dev --name <nome>` | Nova migration em desenvolvimento |
| `npx prisma generate` | Regenerar o client após mexer no schema |

Não há suíte de testes executável. Valide mudanças com `npm run typecheck` e `npm run lint`.

## Ao mexer em cada área

- **Novo endpoint**: crie o caso de uso em `application/usecases/`, a função no controller, e registre a rota em `infrastructure/http/routes/`. Decida explicitamente os middlewares (`AutenticacaoMiddleware`, `AutenticacaoOpcionalMiddleware`, `AdminMiddleware`) e se precisa de rate limit próprio.
- **Novo campo em `Acao`**: são pelo menos 8 pontos a tocar — `prisma/schema.prisma` + migration, `AcaoProps`, validação na entidade, getter, `CriarAcaoDadosDTO`, `AcaoPrismaRepository.salvar()`, os DTOs de saída dos três casos de uso de listagem, e possivelmente os templates `.ejs`. Não esqueça de nenhum.
- **Templates de e-mail**: ficam em `src/infrastructure/smtp/templates/`. São resolvidos em runtime por `resolveCaminhoArquivoTemplate()`, que monta o caminho a partir de `process.cwd()` e alterna entre `src/` e `dist/` conforme `NODE_ENV`. Se criar um template novo, garanta que `npm run copy-ejs` o inclua.
- **Segurança**: leia [`docs/SEGURANCA.md`](docs/SEGURANCA.md) antes. O middleware de autenticação recarrega o usuário do banco a cada requisição de propósito — não substitua isso pelo payload do JWT.
- **Resposta pública de ações**: usuários não-admin recebem apenas ações `Aprovada` e passam por `sanitizarAcaoResposta()`, que remove `celular` e os e-mails dos usuários. Qualquer campo sensível novo precisa entrar nessa função.

## Documentação

| Documento | Conteúdo |
|-----------|----------|
| [`docs/CONTEXTO_E_DOMINIO.md`](docs/CONTEXTO_E_DOMINIO.md) | Domínio, papéis, ciclo de vida da ação, regras de validação, e-mails |
| [`docs/ARQUITETURA.md`](docs/ARQUITETURA.md) | Camadas, fluxo de requisição, inventário de casos de uso, build e deploy |
| [`docs/API.md`](docs/API.md) | Todos os endpoints com payloads, filtros, respostas e códigos de erro |
| [`docs/MODELO_DE_DADOS.md`](docs/MODELO_DE_DADOS.md) | Schema Prisma, enums, relacionamentos e histórico de migrations |
| [`docs/SEGURANCA.md`](docs/SEGURANCA.md) | JWT, autorização, rate limiting, CORS, sanitização de saída |
| [`docs/PONTOS_DE_ATENCAO.md`](docs/PONTOS_DE_ATENCAO.md) | Bugs conhecidos, dívidas técnicas, código morto e armadilhas |

## Armadilhas mais comuns

Leia [`docs/PONTOS_DE_ATENCAO.md`](docs/PONTOS_DE_ATENCAO.md) para a lista completa. As que mais causam confusão:

1. O filtro `data_acao` e a rota `GET /acoes/:data` comparam o `DateTime` por **igualdade exata**, incluindo hora. Buscar por `2026-09-15` não retorna uma ação marcada para `2026-09-15T14:00:00`.
2. `situacao_acao` volta como texto (`"Aprovada"`) em `GET /acoes` e `PUT /acoes/:id`, mas como código (`"1"`) em `GET /acoes/:data` e `GET /acoes/:dataInicial/:dataFinal`.
3. `PUT /acoes/:id` não é um update genérico: só aceita `situacao_acao` com valor `'1'` ou `'2'`. É o endpoint de aprovar/reprovar.
4. Não existe entidade de "edição"/"ano" do evento. O ano é implícito em `data_acao`, e títulos de ação são únicos globalmente — inclusive entre anos diferentes.
5. Falhas no envio de e-mail são engolidas por `NodemailerService` (só `console.log`). A requisição responde sucesso mesmo sem e-mail enviado.
