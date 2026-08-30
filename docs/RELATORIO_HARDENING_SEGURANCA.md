# Relatório de Implementação — Hardening de Segurança

> **Projeto:** Lixo Zero API (`lixo-zero-api`)  
> **Rodadas:** duas, ambas em agosto/2026
>
> - **Rodada 1** (seções 1 a 7): itens 1, 2, 3, 5, 6, 9, 10 e 12 do backlog original.
> - **Rodada 2** (seção 8): correções da reanálise, com foco na origem da informação de privilégio.

---

# Rodada 1

## 1. Resumo executivo

Foram implementadas **9 melhorias de segurança** com impacto direto em autorização, exposição de dados, autenticação e endurecimento HTTP. O código passou em `npm run lint` e `npm run build` sem erros.

| # | Item | Status |
|---|------|--------|
| 1 | IDOR em `POST /acoes` | ✅ Implementado |
| 2 | Listagem pública restrita + sanitização | ✅ Implementado |
| 3 | JWT com algoritmo explícito HS256 | ✅ Implementado |
| 5 | Limite de body JSON (500kb) | ✅ Implementado |
| 6 | Helmet (headers HTTP) | ✅ Implementado |
| 9 | Verificação de `status` no login | ✅ Implementado |
| 10 | Teto de paginação (máx. 100) | ✅ Implementado |
| 12 | Erros 500 genéricos em produção | ✅ Implementado |

**Itens deliberadamente fora do escopo** (conforme decisão anterior): validação de `SECRET_KEY` no boot (4), CORS obrigatório em produção (7), remoção da porta do Postgres (8), política de senha (11).

---

## 2. Detalhamento por item

### 2.1 — IDOR em `POST /acoes`

**Problema:** O cliente podia enviar `id_usuario_responsavel` no body e criar ações em nome de outro usuário.

**Solução:**
- `AcaoController.criarAcao` usa `UsuarioRequest` e define `id_usuario_responsavel` a partir de `request.usuario.id`.
- Contrato público separado em `CriarAcaoDadosDTO` (sem campos de usuário).
- Use case `CriarAcao` recebe `CriarAcaoEntradaDTO` com `id_usuario_responsavel` obrigatório (preenchido pelo controller).

**Arquivos alterados:**
- `src/application/usecases/acao/CriarAcao.ts`
- `src/infrastructure/http/controllers/AcaoController.ts`

**Breaking change:** Frontend não deve mais enviar `id_usuario_responsavel` nem `id_usuario_alteracao` no body.

---

### 2.2 — Listagem pública de ações

**Problema:** `GET /acoes` expunha ações pendentes/reprovadas e dados sensíveis (celular, e-mails).

**Solução:**
- Novo middleware `AutenticacaoOpcionalMiddleware` em `GET /acoes`.
- Função `montarOpcoesListagemAcoes` no controller:
  - **Sem token ou usuário comum:** filtro fixo `situacao = Aprovada`; parâmetro `situacao` da query ignorado.
  - **Admin (`tipo === '0'`):** todas as situações; filtro `situacao` respeitado.
- Sanitização via `sanitizarAcaoResposta` / `sanitizarListaAcoesResposta`:
  - Remove `celular`.
  - Em `usuario_responsavel` e `usuario_alteracao`, mantém apenas `{ nome }`.
- Mesma lógica aplicada em `GET /acoes/:data` e `GET /acoes/:dataInicial/:dataFinal` para usuários não admin.
- Repositório atualizado para aceitar filtro `situacao` nas consultas por data/intervalo.

**Arquivos criados:**
- `src/infrastructure/http/middlewares/AutenticacaoOpcionalMiddleware.ts`
- `src/shared/utils/sanitizarAcaoResposta.ts`
- `src/shared/utils/usuarioEhAdmin.ts`

**Arquivos alterados:**
- `src/infrastructure/http/routes/acaoRoutes.ts`
- `src/infrastructure/http/controllers/AcaoController.ts`
- `src/application/usecases/acao/ListarAcoes.ts`
- `src/application/usecases/acao/ListarAcoesPorData.ts`
- `src/application/usecases/acao/ListarAcoesPorIntervaloData.ts`
- `src/application/repositories/AcaoPrismaRepository.ts`
- `src/domain/acao/repository/IAcaoRepository.ts`

**Breaking change:** Listagem pública não retorna mais ações pendentes. Admin precisa enviar token para ver todas as situações.

---

### 2.3 — JWT HS256 explícito

**Problema:** `jwt.sign` / `jwt.verify` sem restrição de algoritmo.

**Solução:**
- `GerarTokenUsuario`: `{ expiresIn, algorithm: 'HS256' }`
- `VerificarTokenUsuario`: `{ algorithms: ['HS256'] }`

**Arquivos alterados:**
- `src/application/usecases/usuario/GerarTokenUsuario.ts`
- `src/application/usecases/usuario/VerificarTokenUsuario.ts`

---

### 2.4 — Limite de body JSON (500kb)

**Problema:** `express.json()` sem limite permitia payloads grandes (risco de DoS por memória).

**Solução:** `express.json({ limit: '500kb' })` em `app.ts`.

**Arquivo alterado:** `src/app.ts`

---

### 2.5 — Helmet

**Problema:** Ausência de headers de segurança HTTP.

**Solução:**
- Dependência `helmet` adicionada ao `package.json`.
- `app.use(helmet({ contentSecurityPolicy: false }))` antes das rotas.

**Arquivos alterados:** `src/app.ts`, `package.json`, `package-lock.json`

---

### 2.6 — Verificação de `status` no login

**Problema:** Contas com `status: false` ainda autenticavam.

**Solução:**
- `AutenticarUsuario` verifica `usuario.status` após validar senha.
- Mensagem genérica de erro (mesma de credenciais inválidas).
- `UsuarioController.autenticar` retorna `401` em falha de autenticação.

**Arquivos alterados:**
- `src/application/usecases/usuario/AutenticarUsuario.ts`
- `src/infrastructure/http/controllers/UsuarioController.ts`

---

### 2.7 — Teto de paginação

**Problema:** `limit` sem validação permitia queries com milhares de registros.

**Solução:**
- Utilitário `normalizarPaginacao(page, limit)` com `LIMITE_MAXIMO = 100`.
- Aplicado em `AcaoController`, `UsuarioController` e `CategoriaController`.
- Valores acima de 100 são silenciosamente reduzidos a 100.

**Arquivos criados:** `src/shared/utils/normalizarPaginacao.ts`

**Arquivos alterados:**
- `src/infrastructure/http/controllers/AcaoController.ts`
- `src/infrastructure/http/controllers/UsuarioController.ts`
- `src/infrastructure/http/controllers/CategoriaController.ts`

---

### 2.8 — Erros 500 genéricos em produção

**Problema:** Mensagens de erro internas (banco, stack) expostas ao cliente em HTTP 500.

**Solução:**
- Utilitário `responderErroInterno(response, error)`:
  - `NODE_ENV=production` → `{ error: 'Erro interno do servidor.' }`
  - Desenvolvimento → mensagem original
  - Sempre loga com `console.error`

**Arquivos criados:** `src/shared/utils/responderErroInterno.ts`

**Arquivos alterados:**
- `src/infrastructure/http/controllers/AcaoController.ts`
- `src/infrastructure/http/controllers/CategoriaController.ts`

---

## 3. Arquivos novos (resumo)

| Arquivo | Função |
|---------|--------|
| `src/shared/utils/normalizarPaginacao.ts` | Normaliza `page`/`limit` com teto de 100 |
| `src/shared/utils/responderErroInterno.ts` | Resposta 500 segura em produção |
| `src/shared/utils/sanitizarAcaoResposta.ts` | Remove PII da resposta pública de ações |
| `src/shared/utils/usuarioEhAdmin.ts` | Verifica `tipo === '0'` |
| `src/infrastructure/http/middlewares/AutenticacaoOpcionalMiddleware.ts` | JWT opcional para rotas públicas com contexto de usuário |

---

## 4. Impacto no frontend

| Endpoint | Mudança |
|----------|---------|
| `POST /acoes` | Remover `id_usuario_responsavel` e `id_usuario_alteracao` do body |
| `GET /acoes` | Sem token: só ações aprovadas, sem `celular`/e-mails. Admin: enviar `Authorization` + `?situacao=0` para pendentes |
| `POST /usuarios/autenticar` | Conta desativada → `401` (antes `400`) |
| `GET /usuarios`, `GET /categorias`, `GET /acoes` | `limit` acima de 100 é truncado silenciosamente |

---

## 5. Verificação

```bash
npm run lint   # ✅ sem erros
npm run build  # ✅ compilação OK
```

---

## 6. Documentação atualizada

- `docs/SEGURANCA.md` — itens corrigidos marcados; backlog atualizado
- `docs/DOCUMENTACAO_TECNICA.md` — contratos de API, JWT, middlewares e paginação
- `docs/RELATORIO_HARDENING_SEGURANCA.md` — este relatório

---

## 7. Próximos passos recomendados (fora do escopo atual)

1. Exigir `CORS_ORIGIN` em produção (falhar no boot se ausente)
2. Remover exposição da porta `5432` do Postgres no `docker-compose.yml`
3. Validar `SECRET_KEY` no startup (mínimo 32 caracteres em produção)
4. Política mínima de senha no cadastro
5. Atualizar testes automatizados para refletir o novo comportamento

---

# Rodada 2

> **Motivação:** reanálise solicitada após a Rodada 1, questionando **de onde vem a informação de que o usuário é administrador**. A suspeita se confirmou e revelou a falha mais séria do conjunto.

## 8. Resumo executivo

Três correções implementadas, mais um erro de tipagem latente descoberto no processo. Código validado com `npm run lint`, `npx tsc --noEmit` e `npm run build`.

| Fase | Item | Status |
|------|------|--------|
| 1 | Revalidação de privilégio e status no banco | ✅ Implementado |
| 3 | IDOR e validação de enum em `PUT /acoes/:id` | ✅ Implementado |
| — | Erro de tipo latente em `Acao`/`CriarAcao` | ✅ Corrigido |
| 2 | Validação de `SECRET_KEY` no boot | ⏸️ Não implementado (decisão de projeto) |
| 4 | Enumeração de e-mail/CPF no cadastro | ⏸️ Risco aceito |
| 5 | Robustez (exclusão de usuário, FK de categoria, etc.) | ⏸️ Adiado |

---

## 9. Detalhamento

### 9.1 — Privilégio e status confiados apenas ao JWT

**Diagnóstico.** `tipo` e `status` eram lidos do banco uma única vez, no login, e congelados no token por 24h. `AdminMiddleware` e `usuarioEhAdmin` liam `request.usuario.tipo`, que vinha do payload — nenhum ponto da aplicação reconsultava o banco.

Isso abria uma janela de até 24h em que uma conta desativada mantinha acesso total, um admin rebaixado continuava aprovando ações e listando CPF/CNPJ, e um usuário excluído seguia com token válido. Na prática, **a verificação de `status` adicionada na Rodada 1 só protegia novos logins** — justamente o cenário menos urgente, já que revogar acesso costuma ser uma ação imediata.

**Solução.** O token passou a ser tratado apenas como portador de identidade. A cada requisição autenticada, `carregarUsuarioAutenticado` extrai o `id`, busca o usuário no banco e monta `request.usuario` com os dados atuais.

| Arquivo | Mudança |
|---------|---------|
| `src/shared/types/UsuarioAutenticado.ts` | **Novo.** Tipo do usuário conforme o banco |
| `AutenticacaoMiddleware.ts` | Helper `carregarUsuarioAutenticado` + hidratação; `401` para sessão inválida |
| `AutenticacaoOpcionalMiddleware.ts` | Mesma hidratação; qualquer falha segue anônima |
| `AdminMiddleware.ts` | Passa a usar `usuarioEhAdmin` em vez de comparar `tipo` na mão |
| `usuarioEhAdmin.ts` | Assinatura passa a exigir `UsuarioAutenticado` |

**Separação de erros:** token inválido, conta inexistente ou inativa retornam `401`; falha de banco propaga como `500` via `responderErroInterno`. Indisponibilidade de infraestrutura não é mascarada como problema de autenticação.

**Guardrail contra regressão.** O payload do JWT continua carregando `nome`, `email` e `tipo` (decisão de projeto), mas a aplicação os ignora. Para impedir que alguém volte a lê-los por engano, `UsuarioRequest` e `usuarioEhAdmin` passaram a exigir `UsuarioAutenticado`: passar um `TokenDecodificado` cru agora é erro de compilação. Verificado — `TokenDecodificado` só aparece dentro de `VerificarTokenUsuario`.

**Custo:** uma consulta por chave primária por requisição autenticada.

---

### 9.2 — IDOR e integridade em `PUT /acoes/:id`

**Diagnóstico.** A correção de IDOR da Rodada 1 cobriu apenas a criação. O update continuava fazendo `const campos = request.body` e repassando ao repositório, que gravava `id_usuario_alteracao` com o valor do cliente. O admin podia atribuir a aprovação a qualquer outro usuário, forjando a auditoria; omitir o campo fazia o Prisma manter silenciosamente o valor anterior.

Havia ainda um segundo problema: a gravação acontecia **antes** da geração do template. Uma `situacao_acao` inválida (ou `'0'`) não gerava template, a função lançava erro e a API respondia `400` — mas o registro já tinha sido alterado. Como o update ia direto ao Prisma sem passar pela entidade, qualquer string era aceita na coluna.

**Solução.**

| Arquivo | Mudança |
|---------|---------|
| `AcaoController.ts` | Monta os campos explicitamente: `situacao_acao` do body, `id_usuario_alteracao` de `request.usuario.id`; guard de `401` |
| `AtualizarAcao.ts` | `validarSituacao` antes de qualquer escrita (aceita só `'1'` ou `'2'`); ordem reordenada para gerar template → gravar → enviar e-mail |

A ordem foi escolhida deliberadamente: se o e-mail falhar, a ação fica atualizada sem notificação, o que é recuperável. O inverso — notificar sobre uma mudança que não persistiu — seria pior.

---

### 9.3 — Erro de tipo latente desde a Rodada 1

Descoberto ao rodar `npx tsc --noEmit`: `CriarAcaoEntradaDTO` não satisfazia `NovaAcaoProps`, porque `id_usuario_alteracao` havia sido removido do DTO na Rodada 1 mas continuava obrigatório na entidade `Acao`.

**Não era bug de runtime** — `Acao.criarNovaAcao` sobrescreve o campo com `id_usuario_responsavel`, então `POST /acoes` sempre funcionou. Mas o tipo estava mentindo sobre o contrato.

Passou despercebido porque, na época, **`npm run build` usava tsup/esbuild**, que transpila sem checar tipos. Corrigido incluindo `id_usuario_alteracao` em `OmitirDadosNovaAcaoProps`, alinhando o tipo ao comportamento real da fábrica: o campo é derivado, nunca fornecido por quem chama.

**Atualização posterior (agosto/2026):** o build passou a `tsc` (`noEmitOnError`) e existe `"typecheck": "tsc --noEmit"`. Erro de tipo volta a falhar o compile.

---

## 10. Impacto no frontend

| Endpoint | Mudança |
|----------|---------|
| `PUT /acoes/:id` | Remover `id_usuario_alteracao` do body (passa a ser ignorado). Só `'1'` e `'2'` são aceitos em `situacao_acao`; outros valores retornam `400` |
| Todas as rotas autenticadas | Conta desativada, rebaixada ou excluída passa a receber `401`/`403` imediatamente, sem esperar a expiração do token — o app deve tratar `401` redirecionando ao login |

---

## 11. Roteiro de verificação manual

| Cenário | Passos | Esperado |
|---------|--------|----------|
| Revogação por desativação | Logar, definir `status = false` no banco, repetir requisição com o mesmo token | `401` |
| Rebaixamento de admin | Logar como admin, alterar `tipo` para `'1'`, chamar `GET /usuarios` | `403` |
| Exclusão de usuário | Logar, excluir o registro, repetir requisição | `401` |
| Listagem pública com token revogado | `GET /acoes` com token de conta desativada | `200` com apenas ações aprovadas (anônimo) |
| Auditoria no update | Aprovar ação enviando `id_usuario_alteracao` de outro usuário no body | Campo ignorado; grava o admin autenticado |
| Situação inválida | `PUT /acoes/:id` com `situacao_acao: '0'` ou `'xyz'` | `400` e registro **inalterado** no banco |

---

## 12. Verificação executada

```bash
npm run lint      # ✅ sem erros
npx tsc --noEmit  # ✅ sem erros
npm run build     # ✅ compilação OK
```

---

## 13. Backlog atualizado

| Prioridade | Item |
|------------|------|
| **Alta** | Validar `SECRET_KEY` no boot — com a revalidação no banco, a assinatura do token virou o único elo de identidade; chave fraca é escalada de privilégio direta |
| Média | CORS obrigatório em produção; remover porta pública do Postgres |
| Baixa | Política de senha; mascarar CPF em `GET /usuarios`; enumeração no cadastro; itens de robustez (exclusão de usuário, FK de categoria, consistência de `ListarAcoesPorData`) |
