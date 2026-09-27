# CaxiasLixoZero API Constitution

## Core Principles

### I. Spec antes do código

Pedido de desenvolvimento MUST passar pelo Spec Kit antes de alterar
`src/` ou `prisma/`. Desenvolvimento aqui é feature, endpoint, regra de
negócio, mudança de comportamento ou schema.

A ordem MUST ser: `/speckit-specify`, `/speckit-plan`, `/speckit-tasks`,
`/speckit-implement`, `/speckit-converge`. As skills ficam em
`.cursor/skills/speckit-*`. Os artefatos ficam em `specs/`.

Ambiguidade que mude o comportamento MUST ser resolvida com
`/speckit-clarify` antes do plano. Feature que toca auth, dados
persistidos ou mais de um caso de uso MUST passar por
`/speckit-checklist` depois do plano e por `/speckit-analyze` depois
das tasks, antes de implementar.

Pergunta, revisão e ajuste que não muda comportamento MUST NOT abrir
spec.

### II. Este repositório vence skill genérica

`AGENTS.md`, `docs/` e o código vizinho MUST prevalecer sobre texto de
skill que conflite. O plano da feature MUST repetir a stack e a
arquitetura já existentes. Ele MUST NOT introduzir Zod, Joi, RLS,
Prisma Cloud, OpenAPI inventado, type stripping, Node 22 nem extensão
`.ts` nos imports.

Não há suíte de testes executável. O gate de conclusão MUST ser
`npm run typecheck` e `npm run lint`. TDD obrigatório MUST NOT ser
exigido enquanto não houver framework de testes neste repositório.

### III. Arquitetura limpa já existente

A direção das dependências MUST ser `infrastructure` → `application` →
`domain`. `domain/` MUST NOT importar Express, Prisma, nodemailer,
BullMQ nem código de `application/` ou `infrastructure/`.

Controller MUST só ler `request`, instanciar o caso de uso e traduzir
HTTP. Caso de uso MUST expor `executar(entrada)`. Entidade MUST nascer
por `criarNovaX` ou `carregarXExistente`. Dependências MUST ser
instanciadas no topo do controller, sem container.

### IV. Skills de qualidade já instaladas

Depois da implementação, o agente MUST aplicar as skills já do
projeto, no recorte abaixo:

- Todo código: `code-review-and-quality` (correção, legibilidade,
  arquitetura, segurança, performance).
- HTTP, auth ou rota: `docs/SEGURANCA.md`, `typescript-security-review`
  e o checklist mental de `api-security-review` (BOLA, mass assignment,
  over-exposure, rate limit). Sem exploit, PoC, ZAP ou Burp.
- Schema, migration ou query: `supabase-postgres-best-practices` só
  para tipo de coluna, índice, FK, unicidade, paginação e N+1.
  Autorização MUST permanecer na aplicação.
- Async, shutdown ou erro de processo: da skill `node`, só
  `rules/async-patterns.md`, `error-handling.md` e
  `graceful-shutdown.md`.
- `security-review` só quando o pedido for auditoria de segurança.
- `prisma-postgres` MUST NOT ser carregada.

### V. Escopo mínimo e idioma do domínio

O trabalho MUST caber no pedido. Sem refatoração, lib nova, rename de
convenção ou correção de item em `docs/PONTOS_DE_ATENCAO.md` sem pedido
explícito.

Nomes de domínio MUST seguir o vizinho, em português (`criarNovaX`,
`executar`, `usuarioEhAdmin`). Pastas e papéis já usados (`src`,
`domain`, `usecases`, `controllers`) MUST permanecer em inglês. Payload
MUST usar `snake_case`. Chaves de listagem MUST permanecer `actions`,
`users`, `categories`, `totalPages` e `currentPage`.

## Restrições de stack

Node.js 20, TypeScript strict, Express 4, Prisma 5, PostgreSQL, Redis,
BullMQ, JWT, bcrypt, Nodemailer e EJS. Enums de domínio MUST continuar
strings de um caractere (`'0'`, `'1'`, `'2'`). `Usuario.tipo` `'0'` é
administrador.

Campo sensível novo em ação MUST entrar em `sanitizarAcaoResposta()`.
O usuário autenticado MUST ser recarregado do banco; o payload do JWT
MUST NOT montar o usuário. Admin MUST ser comparado com
`usuarioEhAdmin`.

Documentação afetada MUST ser atualizada no mesmo trabalho, conforme o
mapa de `AGENTS.md`.

## Fluxo de desenvolvimento

Cada pedido de desenvolvimento gera uma feature em `specs/` e segue as
skills do Spec Kit. O implement MUST obedecer ao plano e às tasks.
Depois do converge, os gates de `AGENTS.md` continuam obrigatórios:
autoreview, docs, `npm run typecheck` e `npm run lint`.

A resposta final MUST dizer o que mudou, a spec usada, docs tocados,
skills usadas e o que ficou de fora. Commit só quando o usuário pedir.

## Governance

Esta constituição governa specs, planos e tasks. `AGENTS.md` continua o
guia operacional. Os dois MUST ser alterados juntos quando uma regra
de processo mudar. Em conflito entre um plano de feature e esta
constituição, o plano MUST ser ajustado. Mudar a constituição exige
pedido explícito e incremento de versão: MAJOR para remoção ou
redefinição incompatível, MINOR para princípio novo, PATCH para
clarificação.

**Version**: 1.0.0 | **Ratified**: 2026-09-26 | **Last Amended**: 2026-09-26
