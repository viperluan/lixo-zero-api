# Segurança

Este documento descreve os controles implementados, as decisões por trás deles e o que ainda não está coberto. O histórico de commits mostra que a API passou por um trabalho dedicado de hardening (`feat: adiciona rate limit`, `chore: adiciona helmet para mais segurança`, `refactor: adiciona expiração de token e cors`), então boa parte do que está aqui é intencional.

## Autenticação

JWT assinado com **HS256** usando `SECRET_KEY`, com expiração de `JWT_EXPIRES_IN` (padrão `24h`).

O login (`POST /usuarios/autenticar`) devolve, além do `token`, `expires_in` (segundos) e `expires_at` (ISO 8601), derivados dos claims `exp` e `iat` do JWT já assinado — o cliente não precisa parsear a string `24h`.

O payload carrega `id`, `nome`, `email` e `tipo`. A assinatura é gerada em `GerarTokenUsuario` e verificada em `VerificarTokenUsuario`, sempre com o algoritmo fixado explicitamente:

```ts
jwt.verify(token, process.env.SECRET_KEY as string, { algorithms: ['HS256'] });
```

Fixar `algorithms` é o que impede o ataque de confusão de algoritmo (um token forjado com `alg: none` ou `alg: RS256`). Não remova esse parâmetro.

### A decisão mais importante: o token não é a fonte de verdade

`AutenticacaoMiddleware` verifica a assinatura e, em seguida, **recarrega o usuário do banco** a cada requisição:

```ts
const usuario = await usuarioRepository.buscarPorId(idUsuario);
if (!usuario || !usuario.status) return { autenticado: false, motivo: 'sessao_invalida' };
```

Isso existe porque `tipo` e `status` mudam sem invalidar tokens já emitidos. Sem essa consulta, um admin rebaixado continuaria administrador até o token expirar, e um usuário desativado ou excluído continuaria autenticado por até 24 horas. O tipo `UsuarioAutenticado` traz esse aviso escrito no próprio arquivo:

> Nunca deve ser montado a partir do payload do JWT: `tipo` e `status` mudam sem invalidar tokens já emitidos.

O custo é uma consulta por requisição autenticada. É um trade-off deliberado — se for otimizar isso algum dia, faça com cache invalidável, não voltando a confiar no payload.

Outro detalhe do middleware: falhas de verificação do JWT viram resultado discriminado (`token_expirado` ou `sessao_invalida` → `401`), mas falhas de **infraestrutura** (banco indisponível) são propagadas e viram `500`. Um banco fora do ar não deve se disfarçar de credencial inválida. JWT expirado responde `{ message: 'Sessão inválida.', code: 'TOKEN_EXPIRED' }`; as demais sessões inválidas mantêm só a mensagem.

### Os três middlewares

| Middleware | Comportamento sem token | Comportamento com token inválido |
|------------|-------------------------|----------------------------------|
| `AutenticacaoMiddleware` | `401 Autenticação necessária...` | `401 Sessão inválida.` (`code: TOKEN_EXPIRED` se o JWT expirou) |
| `AutenticacaoOpcionalMiddleware` | Segue adiante como anônimo | Segue como anônimo e envia `X-Session-Expired: true` |
| `AdminMiddleware` | `401 Usuário não autenticado` | — |

`AutenticacaoOpcionalMiddleware` é usado só em `GET /acoes` e nunca rejeita ninguém: ele apenas popula `request.usuario` quando o token é válido, para que a listagem possa decidir o nível de detalhe. Bearer presente mas inválido/expirado não vira `401` — a rota segue anônima e o header `X-Session-Expired` avisa o front para limpar o storage. `AdminMiddleware` sempre vem **depois** de `AutenticacaoMiddleware` na cadeia da rota, e responde `403 Acesso negado.` para quem está autenticado mas não é admin.

### Senhas

bcrypt com custo 10, hasheadas dentro de `Usuario.criarNovoUsuario()` — nunca no controller. A comparação usa `bcrypt.compareSync`, que é resistente a timing attack.

Ambas as operações são **síncronas** e bloqueiam o event loop por algumas dezenas de milissegundos. É aceitável no volume atual e o rate limit de autenticação limita o abuso, mas é um vetor de DoS teórico.

`AutenticarUsuario` devolve a mesma mensagem `'Email ou senha incorretos'` para e-mail inexistente, senha errada e conta desativada, evitando enumeração de usuários. Note que a checagem de `status` acontece **depois** da comparação de senha, então o custo de tempo é o mesmo nos três casos.

### Redefinição de senha

`POST /usuarios/esqueci-senha` responde sempre a mesma mensagem, exista ou não a conta. Conta desativada não recebe e-mail. O token tem 32 bytes, vai no link como `base64url` e o banco guarda só o SHA-256. Vale 1 hora, é de uso único, e um pedido novo invalida o anterior. A mesma conta só gera outro e-mail depois de 2 minutos; dentro desse intervalo a API responde sucesso e não enfileira.

O link é `{URL_FRONT}/redefinir-senha?token=...`. `URL_FRONT` precisa ser `http://` ou `https://`. A API não usa o header `Host`. Abrir a página não consome o token: o gasto ocorre em `POST /usuarios/redefinir-senha`.

A senha nova tem entre 10 e 128 caracteres, sem regra de maiúscula, número ou símbolo. O bcrypt só entra no cálculo com os primeiros 72 bytes; o limite de 128 evita um corpo enorme, e o que diferencia senhas maiores que isso é esse prefixo. O cadastro público continua sem esse piso. A troca e a marcação do token acontecem na mesma transação. Em seguida a API enfileira um aviso de senha alterada, sem a senha no corpo. Falha ao renderizar ou ao enfileirar é só logada.

`senha_alterada_em` derruba JWTs cujo `iat`, em segundos, é anterior a essa data. A checagem está em `carregarUsuarioAutenticado`, então vale para o middleware obrigatório e para o opcional. Conta antiga, com o campo vazio, não perde a sessão.

## Autorização

Modelo binário, sem RBAC ou permissões granulares. A única verificação é `usuario?.tipo === '0'`, centralizada em `src/shared/utils/usuarioEhAdmin.ts`. Use essa função — não compare `tipo` diretamente em código novo.

Além do `AdminMiddleware`, a autorização aparece em um segundo lugar: `AcaoController.montarOpcoesListagemAcoes()`, que decide o que cada perfil enxerga na listagem.

```ts
function montarOpcoesListagemAcoes(request: UsuarioRequest) {
  const admin = usuarioEhAdmin(request.usuario);
  return {
    admin,
    situacao: admin ? undefined : AcaoSituacao.Aprovada,
    sanitizarSaida: !admin,
  };
}
```

Não-admin tem a situação **forçada** para `Aprovada`, o que também neutraliza a tentativa de passar `?situacao=0` na query para espiar a fila de moderação. Essa regra vale para `GET /acoes` e para as listagens por data — a vitrine pública.

`GET /acoes/minhas` é o outro caminho: exige token, filtra pelo `id` do usuário autenticado (query `id_usuario` é ignorada) e devolve as ações do dono em qualquer situação, **sem** sanitizar. Admin nesta rota também vê só as ações em que é responsável; a fila de moderação permanece em `GET /acoes`.

## Sanitização das respostas públicas

`sanitizarAcaoResposta()` remove dados pessoais das ações mostradas a quem não é admin:

- `celular` é deletado do objeto;
- `usuario_responsavel` e `usuario_alteracao` são reduzidos a `{ nome }`, sem `email`.

Aplicada em `GET /acoes`, `GET /acoes/:data` e `GET /acoes/:dataInicial/:dataFinal` sempre que `sanitizarSaida` é verdadeiro. `GET /acoes/minhas` não sanitiza: o dono autenticado recebe `celular` e e-mails. **Qualquer campo sensível novo em `Acao` precisa ser adicionado a essa função** — ela é a única barreira entre o banco e a resposta pública.

Repare que `nome_organizador`, `nome_local_acao` e `endereco_local_acao` continuam visíveis: são dados de divulgação do evento, expostos de propósito.

`GET /usuarios` (admin) não devolve o hash da senha. O `cpf_cnpj` passa por `mascararCpfCnpj()`: CPF vira `123.***.***-01`, CNPJ vira `12.***.***/****-91`, e tamanho inesperado vira `***`. E-mail e nome seguem inteiros — o admin precisa deles para falar com o organizador. Não existe endpoint que devolva o documento completo.

## Rate limiting

`express-rate-limit`, configurado em `src/infrastructure/http/config/rateLimit.ts`. Seis perfis, todos por IP e todos ajustáveis por variável de ambiente:

| Perfil | Aplicado em | Padrão | Variáveis |
|--------|-------------|--------|-----------|
| Global | Todas as rotas, exceto `/health` | 200 / 15 min | `RATE_LIMIT_GLOBAL_MAX`, `RATE_LIMIT_GLOBAL_WINDOW_MS` |
| Autenticação | `POST /usuarios/autenticar` | 10 / 15 min | `RATE_LIMIT_AUTH_*` |
| Cadastro | `POST /usuarios` | 5 / hora | `RATE_LIMIT_REGISTER_*` |
| Pedido de redefinição de senha | `POST /usuarios/esqueci-senha` | 5 / hora | `RATE_LIMIT_PASSWORD_RESET_MAX`, `RATE_LIMIT_PASSWORD_RESET_WINDOW_MS` |
| Troca de senha | `POST /usuarios/redefinir-senha` | 10 / 15 min | `RATE_LIMIT_PASSWORD_RESET_CONFIRM_*` |
| Leitura pública | `GET /acoes`, `GET /categorias` | 60 / min | `RATE_LIMIT_PUBLIC_READ_*` |

Os limites específicos são cumulativos com o global. `RATE_LIMIT_ENABLED=false` substitui todos os middlewares por um no-op — útil em testes de carga, nunca em produção. Valores não numéricos ou ≤ 0 nas variáveis caem silenciosamente para o padrão.

`/health` é isento para que o healthcheck do Docker não consuma a cota e não seja bloqueado.

O armazenamento é **em memória**, o que traz duas limitações: os contadores zeram a cada restart e não são compartilhados entre réplicas. Escalar horizontalmente exige um store externo (Redis).

### `trust proxy`

`app.set('trust proxy', 1)` em `src/app.ts` faz o Express confiar em **um** salto de proxy e usar o primeiro IP de `X-Forwarded-For` como IP do cliente. Sem isso, atrás do `proxy-manager` do Docker Compose, todos os clientes apareceriam com o mesmo IP e o rate limit puniria todo mundo junto.

O valor `1` é o correto para a topologia atual (um proxy reverso na frente). Se uma CDN for adicionada, esse número precisa acompanhar — confiar em saltos demais permitiria que um cliente forjasse o próprio IP via header.

## Cabeçalhos HTTP

`helmet()` com `contentSecurityPolicy: false`. O CSP está desligado porque a API só serve JSON, e um CSP restritivo não agrega nada num endpoint sem HTML — mas as demais proteções (`X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security`, remoção do `X-Powered-By`) continuam ativas.

## CORS

```ts
const corsOrigin = process.env.CORS_ORIGIN?.trim();
if (!corsOrigin || corsOrigin === '*') return { exposedHeaders: ['X-Session-Expired'] };
return {
  origin: corsOrigin.split(',').map((origin) => origin.trim()),
  exposedHeaders: ['X-Session-Expired'],
};
```

Vazio ou `*` libera qualquer origem. Em produção, defina a lista explícita de domínios do front separados por vírgula. Note que `CORS_ORIGIN` **não está no `docker-compose.yml`** — se o deploy for por compose, adicione a variável ao serviço `lixozero-api` ou a API subirá com CORS aberto.

`exposedHeaders` inclui `X-Session-Expired` nos dois ramos: sem isso, um front em outra origem não consegue ler o header de `GET /acoes`.

## Superfície de entrada

| Controle | Estado |
|----------|--------|
| Tamanho do corpo | Limitado a 500 kB em `express.json()` |
| Injeção de SQL | Mitigada pelo Prisma (queries parametrizadas, sem SQL cru no projeto) |
| Validação de tipos do payload | **Ausente** — não há Zod, Joi ou class-validator |
| Sanitização de HTML/XSS | **Ausente** — texto do usuário vai direto para os templates EJS |

A ausência de validação de schema é a lacuna mais relevante. As entidades validam presença e regras de negócio, mas não tipos: `numero_organizadores_acao: "abc"` ou um objeto onde se espera string passam pela validação e chegam ao Prisma, que devolve um erro de banco traduzido como `400` genérico.

Sobre XSS: os templates EJS usam interpolação de dados fornecidos pelo usuário em e-mails HTML. O risco é limitado (clientes de e-mail não executam JavaScript), mas convém usar `<%= %>` — que escapa — em vez de `<%- %>` ao editar os templates.

## Vazamento de informação em erros

`responderErroInterno()` protege detalhes internos em produção:

```ts
if (process.env.NODE_ENV === 'production') {
  return response.status(500).json({ error: 'Erro interno do servidor.' });
}
return response.status(500).json({ error: (error as Error).message });
```

Isso depende de `NODE_ENV=production` estar setado. O `Dockerfile` o define, e `npm start` também via `cross-env` — mas uma execução manual com `node dist/server.js` sem a variável exporia mensagens internas. Nem todos os controllers usam essa função: `UsuarioController.buscarTodos` e vários outros respondem `400` com a mensagem crua do erro, independentemente do ambiente.

## Segredos

Todos vêm de variáveis de ambiente, sem valores padrão no código. `.env` está no `.gitignore`. `.env.example` documenta todas as chaves: defaults não-secretos (`PORT`, `NODE_ENV`, `JWT_EXPIRES_IN`, fila e rate limit) e segredos vazios (`SECRET_KEY`, `DB_PASSWORD`, `DATABASE_URL`, `REDIS_URL`, `REDIS_PASSWORD`, `GMAIL_USER`, `GMAIL_PASS`).

`SECRET_KEY` não tem fallback: se estiver ausente, `jwt.sign` lança e a autenticação falha inteira — falha fechada, que é o comportamento desejado. Não adicione um valor padrão.

O remetente `caxiaslixozero@gmail.com` está hardcoded em `CriarAcao` e `AtualizarAcao`, mas isso é um endereço público, não um segredo. As credenciais SMTP (`GMAIL_USER`/`GMAIL_PASS`) vêm do ambiente, devem ser uma senha de app do Google e existem **somente no worker** — a API não as recebe no Compose.

O Redis da fila exige senha (`REDIS_PASSWORD` / `REDIS_URL`) e não é publicado na interface pública (só `127.0.0.1:6379` para desenvolvimento no host). Worker e Redis ficam fora da rede `proxy-manager`. Jobs na fila carregam o HTML do e-mail (incluindo dados da ação); quem tem acesso ao Redis lê essa fila. Não exponha a porta nem deixe `REDIS_PASSWORD` vazio.

## O que não está implementado

Nenhum destes é bug — são decisões conscientes ou lacunas conhecidas, listadas para que ninguém presuma que existem:

- **Refresh token / revogação.** Um token válido permanece válido até expirar. O login informa `expires_in`/`expires_at` e o 401 distingue expiração (`TOKEN_EXPIRED`), mas não há renovação. A mitigação parcial é a recarga do usuário a cada requisição, que cobre desativação e rebaixamento, mas não um token roubado de uma conta ainda ativa.
- **Verificação de e-mail no cadastro.** Qualquer e-mail é aceito sem confirmação.
- **Política de senha no cadastro.** Nenhum tamanho mínimo ou requisito de complexidade. A redefinição de senha exige entre 10 e 128 caracteres.
- **Bloqueio de conta após tentativas falhas.** Só o rate limit por IP protege o login.
- **Logs de auditoria.** `id_usuario_alteracao` guarda apenas o autor da última alteração; não há trilha de quem aprovou o quê e quando.
- **Rate limit distribuído.** Contadores em memória, por instância.
