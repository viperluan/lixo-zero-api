# Prompt — redefinição de senha no front

A API do Caxias Lixo Zero passou a ter recuperação de senha. Não há confirmação de e-mail. O cadastro e o login que já existem continuam iguais. O trabalho no React é acrescentar o fluxo de “esqueci minha senha” e tratar a sessão que a API invalida depois da troca.

A página é do React. A API só manda o e-mail, com um link para o front. O caminho fixo desse link é `/redefinir-senha`. A origem vem de `URL_FRONT` (hoje, em desenvolvimento, `http://localhost:5173`). Se a rota do front for outra, o link do e-mail abre a página errada.

## O que não muda

- `POST /usuarios` continua criando a conta e respondendo `201` sem corpo.
- `POST /usuarios/autenticar` continua devolvendo `{ token, expires_in, expires_at, usuario }`.
- O `usuario` do login não ganhou campo novo.
- Não existe tela de “confirme seu e-mail”.

## Contrato

Base: a mesma da API atual. JSON. Sem `Authorization` nestes dois endpoints.

### Pedir o link — `POST /usuarios/esqueci-senha`

```json
{ "email": "maria@exemplo.com" }
```

Sucesso, e-mail inexistente, conta desativada e pedido repetido em menos de 2 minutos respondem todos assim:

`200`

```json
{ "message": "Se existir uma conta com esse e-mail, enviaremos instruções para redefinir a senha." }
```

Não existe resposta de “e-mail não encontrado”. A tela de sucesso é sempre a mesma. O texto precisa dizer para esperar alguns minutos e olhar o spam. A fila pode atrasar o envio.

`429`

```json
{ "message": "Muitas requisições. Tente novamente mais tarde." }
```

### Trocar a senha — `POST /usuarios/redefinir-senha`

```json
{ "token": "valor-da-query", "senha": "senha-nova" }
```

`200`

```json
{ "message": "Senha redefinida. Entre novamente com a nova senha." }
```

A API não devolve JWT. Depois do `200`, limpe o token guardado no browser e vá para o login.

`400` — uma destas mensagens, na chave `error`:

- `Link inválido ou expirado.`
- `A senha deve ter entre 10 e 128 caracteres.`

A mensagem de tamanho só aparece quando o token ainda vale. Link inválido, expirado ou já usado é sempre a primeira frase, mesmo se a senha estiver curta.

`429` usa a chave `message`, igual ao pedido do link. `500` usa `error`.

Senha nova: entre 10 e 128 caracteres. Sem obrigar maiúscula, número ou símbolo. Pode colar de um gerenciador. A confirmação da senha (digitar duas vezes) fica só no front; a API recebe um único campo `senha`.

## Páginas

1. No login, um link “Esqueci minha senha” para a página de pedido.
2. Página de pedido: um campo de e-mail. No `200`, mostre a mensagem da API e não ofereça outro estado de erro para e-mail desconhecido. No `429`, mostre `message`.
3. Página `/redefinir-senha`. Leia `token` da query (`?token=`). Não chame a API ao abrir a página: abrir o link não gasta o token, e um `GET` automático queimaria o link se um scanner de e-mail abrisse a URL. O `POST` só acontece no envio do formulário, com `token` e `senha` no corpo. Não mande o token em header.
4. No `200` da troca, apague a sessão local e redirecione ao login. No `400` de link inválido, mostre a mensagem e um caminho para pedir outro link. No `400` de tamanho, mantenha a pessoa na mesma página, com o mesmo `token` da URL, para ela corrigir a senha.

## Sessão antiga

Quem já estava logado e redefiniu a senha fica com o JWT antigo inválido. A próxima rota protegida responde `401` com `{ "message": "Sessão inválida." }`, sem `code`. Trate isso como logout: limpe o storage e mande para o login. Não confunda com `code: "TOKEN_EXPIRED"`, que continua sendo só expiração das 24 horas.

Quem não redefiniu a senha não perde a sessão.

## Refatoração do código atual

- Extraia a chamada HTTP no mesmo lugar em que login e cadastro já ficam. Não invente outro cliente.
- O pedido de link e a troca de senha são rotas públicas, no mesmo estilo de `POST /usuarios/autenticar`.
- Reaproveite o tratamento de `429`, que já existe no login se o rate limit estiver ligado. A chave de sucesso e de limite é `message`. A chave de erro de negócio é `error`.
- Não bloqueie cadastro nem login por e-mail confirmado. Esse estado não existe.
- Não monte a URL do e-mail no front. Quem clica no e-mail já chega em `/redefinir-senha?token=...`.
- O token da query pode vir codificado. Use o valor decodificado da query string no JSON.
