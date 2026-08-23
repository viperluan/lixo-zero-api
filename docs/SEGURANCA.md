# Análise de Segurança — Lixo Zero API

> Documento gerado a partir da análise do código-fonte (agosto/2026).  
> Foco em problemas **atuais** com soluções **viáveis de implementar** sem grandes refatorações.  
> **Atualizado em agosto/2026** após duas rodadas de hardening — itens marcados como **✅ Corrigido** já foram implementados.

---

## Legenda

| Prioridade | Significado |
|------------|-------------|
| **Alta** | Risco relevante; corrigir antes ou logo após ir para produção no Dokploy |
| **Média** | Risco moderado; vale corrigir em sprint curta |
| **Baixa** | Endurecimento recomendado; não é urgente |

| Esforço | Significado |
|---------|-------------|
| **Baixo** | Horas, poucos arquivos |
| **Médio** | 1–2 dias, pode tocar use cases/controllers |
| **Alto** | Mudança arquitetural ou de produto |

---

## Resumo executivo

| Prioridade | Quantidade |
|------------|------------|
| Alta | 5 |
| Média | 8 |
| Baixa | 5 |

**Já mitigado no projeto:** hash de senha (bcrypt), ORM parametrizado (Prisma — sem SQL injection clássico), JWT com expiração (24h) e algoritmo explícito HS256, revalidação de privilégio e status no banco a cada requisição, rate limiting por rota, `.env` no `.gitignore`, middleware de autenticação/admin, Helmet, limite de body JSON (500kb), paginação com teto de 100 itens, erros 500 genéricos em produção.

**Maiores gaps restantes:** validação de `SECRET_KEY` no boot (prioridade elevada — ver 2.5), CORS permissivo por default quando `CORS_ORIGIN` está vazio, Postgres exposto no Docker Compose, política de senha fraca.

---

## 1. Problemas de alta prioridade

### 1.1 — IDOR na criação de ações ✅ Corrigido

**Problema:** `POST /acoes` exige autenticação, mas o body aceita `id_usuario_responsavel` vindo do cliente. Um usuário autenticado pode criar ações em nome de outro usuário.

**Onde:** `AcaoController.criarAcao`, `CriarAcao` — não usa `request.usuario.id`.

**Impacto:** Ações e e-mails de notificação associados ao usuário errado; violação de integridade e privacidade.

**Correção aplicada (agosto/2026):**
- `criarAcao` usa `UsuarioRequest` e define `id_usuario_responsavel` a partir de `request.usuario.id`.
- `id_usuario_responsavel` e `id_usuario_alteracao` removidos do contrato público do body (`CriarAcaoDadosDTO`).

---

### 1.2 — Listagem pública expõe ações pendentes e dados sensíveis ✅ Corrigido

**Problema:** `GET /acoes` é público e, sem filtro de `situacao`, retorna ações **pendentes**, **reprovadas** e **aprovadas**, incluindo e-mail do responsável, celular, endereço etc.

**Onde:** `acaoRoutes.ts` (rota pública), `ListarAcoes`, `AcaoPrismaRepository.listarComPaginacao`.

**Impacto:** Vazamento de PII e de ações ainda não moderadas antes da aprovação administrativa.

**Correção aplicada (agosto/2026):**
- `GET /acoes` usa `AutenticacaoOpcionalMiddleware` — sem token ou usuário comum: apenas ações **aprovadas**; parâmetro `situacao` ignorado.
- Admin (`tipo === '0'`) com token pode filtrar por `situacao` e recebe resposta completa.
- Resposta pública sanitizada via `sanitizarAcaoResposta` — omite `celular` e e-mails de `usuario_responsavel` / `usuario_alteracao`.
- Mesma lógica aplicada em `GET /acoes/:data` e `GET /acoes/:dataInicial/:dataFinal` para usuários não admin.

---

### 1.3 — CORS permissivo quando `CORS_ORIGIN` está vazio

**Problema:** Se `CORS_ORIGIN` não for definido (como no `.env` atual), `obterOpcoesCors()` retorna `{}` e o `cors()` aceita **qualquer origem**.

**Onde:** `src/infrastructure/http/config/cors.ts`

**Impacto:** Em produção no Dokploy, qualquer site pode fazer requests cross-origin à API (com credenciais limitadas pelo browser, mas ainda é risco para APIs sem cookie — ex.: token no header via frontend malicioso induzindo usuário).

**Solução (esforço baixo):**
- Em `NODE_ENV=production`, exigir `CORS_ORIGIN` definido; falhar no boot se ausente.
- Em desenvolvimento, manter comportamento permissivo.
- Documentar URL do frontend no Dokploy.

---

### 1.4 — PostgreSQL com porta exposta no Docker Compose

**Problema:** `lixozero-db` publica `5432:5432` no host. Se a VPS não tiver firewall restritivo, o banco fica acessível na internet.

**Onde:** `docker-compose.yml`

**Impacto:** Ataque de força bruta ao Postgres, acesso direto aos dados se credenciais vazarem.

**Solução (esforço baixo):**
- Remover `ports` do serviço `lixozero-db` (comunicação só pela rede interna `lixozero-network`).
- No Dokploy, usar serviço de banco interno sem exposição pública.
- Garantir firewall na VPS (só 80/443).

---

### 1.5 — JWT sem algoritmo explícito na verificação ✅ Corrigido

**Problema:** `jwt.verify(token, SECRET_KEY)` não restringe `algorithms`. Em cenários com chaves mal configuradas, há risco histórico de **algorithm confusion** (`none` / RS256 vs HS256).

**Onde:** `VerificarTokenUsuario.ts`, `GerarTokenUsuario.ts`

**Impacto:** Bypass de autenticação (baixa probabilidade com setup atual, mas correção é trivial).

**Correção aplicada (agosto/2026):**
```typescript
jwt.sign(payload, SECRET_KEY, { expiresIn, algorithm: 'HS256' });
jwt.verify(token, SECRET_KEY, { algorithms: ['HS256'] });
```

---

### 1.6 — Privilégio e status confiados exclusivamente ao JWT ✅ Corrigido

**Problema:** `tipo` e `status` eram lidos do banco uma única vez, no login, e congelados dentro do token por 24h. Nenhum ponto da aplicação reconsultava o banco depois disso — `AdminMiddleware` e `usuarioEhAdmin` liam `request.usuario.tipo`, que vinha do payload do JWT.

**Onde:** `AutenticacaoMiddleware.ts`, `AutenticacaoOpcionalMiddleware.ts`, `AdminMiddleware.ts`, `usuarioEhAdmin.ts`

**Impacto:** Janela de até 24h em que:
- Conta desativada (`status: false`) continuava com acesso total — anulando na prática a correção 2.1, que só cobre novos logins.
- Admin rebaixado para `tipo: '1'` continuava aprovando ações e listando usuários com CPF/CNPJ.
- Usuário excluído mantinha token válido.
- Não havia forma de revogar sessão (logout real).

**Correção aplicada (agosto/2026):**
- Novo tipo `UsuarioAutenticado` representando o usuário conforme o banco.
- `carregarUsuarioAutenticado(token)` resolve o `id` do token e busca o usuário no banco a cada requisição; devolve `null` se o token for inválido, o usuário não existir ou `status === false`.
- `request.usuario` passa a ser preenchido com dados do banco, nunca do payload.
- Falha de infraestrutura propaga como `500`, separada do `401` de sessão inválida.
- `UsuarioRequest` e `usuarioEhAdmin` passam a exigir `UsuarioAutenticado`, tornando erro de compilação qualquer tentativa de voltar a ler o `tipo` do token.

> O payload do JWT ainda carrega `nome`, `email` e `tipo` por decisão de projeto, mas a aplicação os ignora. `TokenDecodificado` ficou restrito ao interior de `VerificarTokenUsuario`.

---

### 1.7 — IDOR remanescente em `PUT /acoes/:id` ✅ Corrigido

**Problema:** A correção 1.1 cobriu a criação, mas o update continuava repassando `request.body` cru até o repositório, que gravava `id_usuario_alteracao` com o valor enviado pelo cliente.

**Onde:** `AcaoController.atualizarAcao`, `AcaoPrismaRepository.atualizar`

**Impacto:** O admin que aprova ou reprova podia atribuir a alteração a qualquer outro usuário, forjando a trilha de auditoria. Omitir o campo fazia o Prisma ignorar a coluna e manter silenciosamente o valor anterior.

**Correção aplicada (agosto/2026):** O controller monta os campos explicitamente — `situacao_acao` vem do body e `id_usuario_alteracao` de `request.usuario.id`. Guard de `401` adicionado.

---

## 2. Problemas de média prioridade

### 2.1 — Usuário desativado ainda autentica ✅ Corrigido

**Problema:** `AutenticarUsuario` não verifica `usuario.status`. Conta com `status: false` continua logando.

**Onde:** `AutenticarUsuario.ts`

**Correção aplicada (agosto/2026):** Após validar senha, checa `usuario.status`; se `false`, lança erro genérico. `UsuarioController` retorna `401`.

---

### 2.2 — Ausência de headers de segurança HTTP (Helmet) ✅ Corrigido

**Problema:** Não há `helmet` nem headers como `X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security` (via proxy).

**Onde:** `app.ts`

**Impacto:** Endurecimento menor contra XSS clickjacking e MIME sniffing (API JSON tem risco menor, mas é boa prática).

**Correção aplicada (agosto/2026):** `helmet` instalado e registrado em `app.ts` com `contentSecurityPolicy: false`.

---

### 2.3 — Body JSON sem limite de tamanho ✅ Corrigido

**Problema:** `express.json()` sem `limit`. Payloads enormes podem consumir memória (DoS).

**Onde:** `app.ts`

**Correção aplicada (agosto/2026):** `express.json({ limit: '500kb' })` em `app.ts`.

---

### 2.4 — Paginação sem teto máximo (`limit`) ✅ Corrigido

**Problema:** `limit` na query é convertido com `Number(limit)` sem validação. Cliente pode enviar `limit=100000` e forçar queries pesadas.

**Onde:** Controllers de `Usuario`, `Categoria`, `Acao`.

**Correção aplicada (agosto/2026):** Utilitário `normalizarPaginacao` com teto silencioso de 100 itens (`LIMITE_MAXIMO`).

---

### 2.5 — `SECRET_KEY` sem validação no startup

**Problema:** Se `SECRET_KEY` estiver ausente ou fraca (ex.: `"batata"`), a API sobe e JWT fica inseguro.

**Onde:** `GerarTokenUsuario`, `VerificarTokenUsuario`, boot da aplicação.

**Solução (esforço baixo):** Módulo `config/env.ts` que valida no startup:
- `SECRET_KEY` existe e tem ≥ 32 caracteres em produção.
- Falhar rápido (`process.exit(1)`) com mensagem clara.

> **Prioridade elevada após a correção 1.6.** Com a revalidação no banco, a assinatura do token passou a ser o único elo entre a requisição e a identidade do usuário. Uma `SECRET_KEY` fraca deixa de ser endurecimento recomendado e vira escalada de privilégio direta: quem adivinhar a chave forja um `id` de admin e não encontra segunda barreira. Item pendente por decisão de projeto.

---

### 2.6 — Mensagens de erro internas expostas em HTTP 500 ✅ Corrigido

**Problema:** Controllers retornam `(error as Error).message` em respostas 500, podendo vazar detalhes de banco/infra.

**Onde:** `AcaoController`, `CategoriaController`, etc.

**Correção aplicada (agosto/2026):** Utilitário `responderErroInterno` — em `NODE_ENV=production` retorna mensagem genérica; em desenvolvimento mantém detalhe. Erro completo logado com `console.error`.

---

### 2.7 — Cadastro público sem política de senha

**Problema:** `CriarUsuario` aceita qualquer string como senha (ex.: `"1"`, `"123"`).

**Onde:** `CriarUsuario.ts` / entidade `Usuario`.

**Solução (esforço baixo):** Validar mínimo (ex.: 8 caracteres, 1 maiúscula, 1 número) na entidade ou use case.

---

### 2.8 — Endpoint `/health` público com detalhe do banco

**Problema:** `GET /health` retorna `{ database: 'up' | 'down' }` sem autenticação.

**Impacto:** Information disclosure para reconhecimento de infra.

**Solução (esforço baixo):**
- **Opção A:** Resposta mínima `{ status: 'ok' }` publicamente; checagem de DB só em rota interna ou com token.
- **Opção B:** Manter como está (comum em health checks) e restringir acesso por rede no Dokploy.

---

### 2.9 — Atualização com situação inválida corrompia o registro ✅ Corrigido

**Problema:** Em `AtualizarAcao`, a gravação acontecia antes da geração do template. Uma `situacao_acao` fora de Aprovada/Reprovada não produzia template, a função lançava `'Erro ao gerar template.'` e a API respondia `400` — **mas o banco já havia sido alterado**. Além disso, o update ia direto ao Prisma sem passar pela entidade `Acao`, então qualquer string era persistida na coluna.

**Onde:** `AtualizarAcao.ts`, `AcaoPrismaRepository.atualizar`

**Impacto:** Corrupção silenciosa de dados combinada com resposta de erro, e ausência total de validação de enum na atualização.

**Correção aplicada (agosto/2026):**
- `validarSituacao` roda antes de qualquer escrita e aceita apenas `'1'` (aprovar) ou `'2'` (reprovar), com mensagem de erro explícita.
- Ordem das etapas invertida: gerar template → gravar → enviar e-mail. Falha de template não chega mais ao banco.

> Ordem escolhida deliberadamente: se o envio do e-mail falhar, a ação fica aprovada sem notificação (recuperável). O inverso — notificar sobre uma mudança que não persistiu — seria pior.

---

### 2.10 — Enumeração de e-mail e CPF/CNPJ no cadastro ⚠️ Aceito

**Problema:** `CriarUsuario` retorna mensagens distintas para e-mail e CPF/CNPJ duplicados, permitindo sondar quais estão cadastrados.

**Onde:** `CriarUsuario.ts`

**Impacto:** Enumeração de base de usuários; no caso do CPF/CNPJ, exposição indireta de dado sensível sob LGPD.

**Mitigação atual:** Rate limit de 5 cadastros por hora por IP.

**Status:** Risco aceito por decisão de projeto (agosto/2026), priorizando o feedback de cadastro ao usuário. Reavaliar se a base crescer.

---

### 2.11 — Build não executa checagem de tipos ✅ Corrigido pontualmente

**Problema:** `npm run build` usa `tsup`/esbuild, que transpila sem checar tipos. Erros de tipagem passam despercebidos e chegam a produção.

**Onde:** `package.json`, `tsup.config.ts`

**Impacto:** Um erro real ficou latente desde a sprint anterior — `CriarAcaoEntradaDTO` não satisfazia `NovaAcaoProps` porque `id_usuario_alteracao` fora removido do DTO mas continuava obrigatório na entidade. Não quebrou em runtime apenas porque `Acao.criarNovaAcao` sobrescreve o campo, mas o contrato de tipo estava mentindo.

**Correção aplicada (agosto/2026):** `id_usuario_alteracao` incluído em `OmitirDadosNovaAcaoProps`, alinhando o tipo ao comportamento real da fábrica (o campo é derivado, nunca fornecido por quem chama).

**Recomendação em aberto:** adicionar script `"typecheck": "tsc --noEmit"` e executá-lo no CI, para que essa classe de erro não volte a passar.

---

## 3. Problemas de baixa prioridade

### 3.1 — Login retorna HTTP 400 em vez de 401 ✅ Corrigido

**Problema:** Credenciais inválidas retornam `400`; semanticamente deveria ser `401 Unauthorized`.

**Onde:** `UsuarioController.autenticar`

**Correção aplicada (agosto/2026):** Falhas de autenticação (credenciais inválidas ou conta desativada) retornam `401`.

---

### 3.2 — Listagem de usuários (admin) expõe CPF/CNPJ

**Problema:** `GET /usuarios` retorna `cpf_cnpj` para admins. Pode ser necessário ao negócio, mas é dado sensível (LGPD).

**Solução (esforço médio):** Mascarar na listagem (`***.***.***-**`) e expor completo só em detalhe auditado; registrar acesso.

---

### 3.3 — Payload JWT com dados desnecessários

**Problema:** Token carrega `nome` e `email` além de `id` e `tipo`. Aumenta superfície se token vazar.

**Solução (esforço médio):** JWT só com `{ sub: id, tipo }`; frontend busca perfil via endpoint dedicado.

---

### 3.4 — Deploy CI com `StrictHostKeyChecking=no`

**Problema:** Workflow SSH desabilita verificação de host key — risco de MITM no deploy.

**Onde:** `.github/workflows/deploy.yml`

**Solução (esforço baixo):** Adicionar host key conhecida aos `known_hosts` do runner ou usar secret `SSH_KNOWN_HOSTS`.

---

### 3.5 — Ausência de logging de eventos de segurança

**Problema:** Falhas de login, bloqueios 429 e tentativas admin negadas não são logados de forma estruturada.

**Solução (esforço médio):** Log mínimo com IP, rota, timestamp (sem senha/token).

---

## 4. Itens já endereçados (não reabrir)

| Item | Status |
|------|--------|
| Senhas em texto puro | Mitigado — bcrypt |
| SQL Injection | Mitigado — Prisma parametrizado |
| JWT sem expiração | Corrigido — `JWT_EXPIRES_IN` (24h) |
| JWT algorithm confusion | Corrigido — HS256 explícito |
| IDOR em POST /acoes | Corrigido — responsável = usuário do token |
| Listagem pública de ações | Corrigido — só aprovadas + sanitização |
| Helmet / headers HTTP | Corrigido |
| Limite de body JSON | Corrigido — 500kb |
| Teto de paginação | Corrigido — máx. 100 |
| Login conta desativada | Corrigido — 401 genérico |
| Erros 500 em produção | Corrigido — mensagem genérica |
| Privilégio/status congelados no JWT | Corrigido — revalidação no banco por requisição |
| IDOR em PUT /acoes/:id | Corrigido — auditoria vem do token |
| Situação inválida corrompendo registro | Corrigido — valida antes de gravar |
| Rate limiting | Implementado — ver `config/rateLimit.ts` |
| `.env` no repositório | Mitigado — `.gitignore` |
| Autenticação em rotas admin | Implementado — middlewares |

---

## 5. Backlog sugerido — correções fáceis primeiro

Ordem recomendada para máximo impacto com mínimo esforço:

| # | Item | Esforço | Seção | Status |
|---|------|---------|-------|--------|
| 1 | IDOR em `POST /acoes` | Baixo | 1.1 | ✅ Feito |
| 2 | Filtrar ações públicas (só aprovadas) | Baixo | 1.2 | ✅ Feito |
| 3 | JWT `algorithm: 'HS256'` | Baixo | 1.5 | ✅ Feito |
| 4 | Validar `SECRET_KEY` no boot | Baixo | 2.5 | Pendente |
| 5 | `express.json({ limit })` | Baixo | 2.3 | ✅ Feito (500kb) |
| 6 | Helmet | Baixo | 2.2 | ✅ Feito |
| 7 | CORS obrigatório em produção | Baixo | 1.3 | Pendente |
| 8 | Remover porta pública do Postgres | Baixo | 1.4 | Pendente |
| 9 | Checar `usuario.status` no login | Baixo | 2.1 | ✅ Feito |
| 10 | Teto em `limit` de paginação | Baixo | 2.4 | ✅ Feito |
| 11 | Política mínima de senha | Baixo | 2.7 | Pendente |
| 12 | Erros 500 genéricos em produção | Baixo | 2.6 | ✅ Feito |
| 13 | Revalidar privilégio/status no banco | Médio | 1.6 | ✅ Feito |
| 14 | IDOR em `PUT /acoes/:id` | Baixo | 1.7 | ✅ Feito |
| 15 | Validar situação antes de gravar | Baixo | 2.9 | ✅ Feito |
| 16 | Script de `typecheck` no CI | Baixo | 2.11 | Pendente |

**Próximo item recomendado:** #4 (validar `SECRET_KEY` no boot) — ver nota de prioridade elevada em 2.5.

> Detalhes da implementação: ver `docs/RELATORIO_HARDENING_SEGURANCA.md`.

---

## 6. Considerações para deploy no Dokploy

| Tópico | Recomendação |
|--------|--------------|
| **TLS/HTTPS** | Terminar SSL no Dokploy/Traefik; API não precisa lidar com certificado |
| **Secrets** | `SECRET_KEY`, `DATABASE_URL`, `GMAIL_PASS` só via env do Dokploy — nunca no repositório |
| **CORS** | Definir `CORS_ORIGIN` com URL exata do frontend antes do go-live |
| **Rate limit** | Manter `RATE_LIMIT_ENABLED=true`; validar IP real com `trust proxy` |
| **Banco** | Serviço Postgres interno, sem porta pública |
| **Health** | Apontar health check do Dokploy para `GET /health` |
| **Firewall VPS** | Expor apenas 80/443 (e SSH restrito) |

---

## 7. O que fica fora do escopo “fácil”

Estes itens foram identificados mas exigem mais planejamento:

| Item | Motivo |
|------|--------|
| Fila de e-mail com retry | Arquitetura nova (já planejado) |
| Revogação de JWT / logout | Exige blacklist ou refresh tokens |
| 2FA | Feature de produto |
| Auditoria LGPD completa | Processo + código |
| WAF / rate limit no Dokploy | Configuração de infra separada |
| Store Redis para rate limit multi-réplica | Só necessário com escala horizontal |

---

## 8. Referências no código

| Arquivo | Relevância |
|---------|------------|
| `src/app.ts` | CORS, JSON, rate limit global, trust proxy |
| `src/infrastructure/http/config/cors.ts` | Política CORS |
| `src/infrastructure/http/config/rateLimit.ts` | Rate limiting |
| `src/infrastructure/http/middlewares/AutenticacaoMiddleware.ts` | JWT |
| `src/application/usecases/usuario/AutenticarUsuario.ts` | Login |
| `src/infrastructure/http/controllers/AcaoController.ts` | IDOR, exposição de dados |
| `docker-compose.yml` | Exposição Postgres |
| `.github/workflows/deploy.yml` | Deploy SSH |

---

*Documento para apoio a decisões de segurança. Revisar após cada sprint de hardening.*
