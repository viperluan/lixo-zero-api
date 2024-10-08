
## Create beautiful REST API docs authored in Markdown

#### Buscar todos os usuários

<details>
 <summary><code>GET</code> <code><b>/usuarios</b></code> </summary>

##### Response

    [
       {
          "id":1,
          "nome":"Daniel Silva",
          "email":"dani@outlook.com",
          "senha":"cd137e5443e4e970c93cee9e208da17b",
          "status":true,
          "tipo":"A",
          "cpf_cnpj":"12345678910244"
       },
       {
          "id":2,
          "nome":"Roberto Oliveira",
          "email":"robliveira@gmail.com",
          "senha":"cd137e5443e4e970c93cee9e208da17b",
          "status":true,
          "tipo":"A",
          "cpf_cnpj":"12345678910244"
       }
    ]

</details>

------------------------------------------------------------------------------------------

#### Cadastrar usuário

<details>
 <summary><code>POST</code> <code><b>/usuarios</b></code> </summary>

##### Request

    {
       "nome":"Daniel Silva",
       "email":"dani@outlook.com",
       "senha":"Senha@1234",
       "status":true,
       "tipo":"A",
       "cpf_cnpj":"01234567891"
    }
    
##### Sucesso

    {
	    "id": 2
    }


##### Erro
    {
	    "error":  "Mensagem de erro."
    }
</details>

------------------------------------------------------------------------------------------

#### Remover usuário

<details>
 <summary><code>DELETE</code> <code><b>/usuarios/{id}</b></code> </summary>
   
##### Sucesso
    {
	    "id":  2,
	    "nome":  "Daniel Silva",
	    "email":  "dani@outlook.com",
	    "senha":  "cd137e5443e4e970c93cee9e208da17b",
	    "status":  true,
	    "tipo":  "A",
	    "cpf_cnpj":  "98765432101"
    }
##### Erro
    {
	    "error":  "Mensagem de erro."
    }

</details>

------------------------------------------------------------------------------------------

#### Autenticar

<details>
 <summary><code>POST</code> <code><b>/usuarios/autenticar</b></code> </summary>
   
##### Request

    {
	    "email":  "dani@outlook.com",
	    "senha":  "Senha@1234"
    }

##### Sucesso
    {
	    "id":  2,
	    "nome":  "Daniel Silva",
	    "tipo":  "A",
	    "email":  "dani@outlook.com"
    }
#### Erro
    {
	    "error":  "Mensagem de erro."
    }
</details>

------------------------------------------------------------------------------------------

#### Cadastrar ação

<details>
 <summary><code>POST</code> <code><b>/acao</b></code> </summary>
   
##### Request
    {
	    "id_usuario_responsavel":  7,
	    "celular":  "12345678901",
	    "nome_organizador":  "Nome do Organizador",
	    "link_organizador":  "http://link.com",
	    "titulo_acao":  "Título da Ação",
	    "descricao_acao":  "Descrição da Ação",
	    "id_categoria":  1,
	    "data_acao":  "2024-06-01T00:00:00.000Z",
	    "forma_realizacao_acao":  "AB",
	    "local_acao":  "Local da Ação",
	    "numero_organizadores_acao":  5,
	    "receber_informacao_patrocionio":  false,
	    "situacao_acao":  "AT",
	    "id_usuario_alteracao":  1
    }

##### Sucesso
    {
	    "id":  2
    }
#### Erro
    {
	    "error":  "Mensagem de erro."
    }
</details>

------------------------------------------------------------------------------------------

#### Buscar ação por data

<details>
 <summary><code>GET</code> <code><b>/acao/{data}</b></code> - formato: yyyy-MM-dd </summary>
   
##### Sucesso
    [
       {
          "titulo_acao":"Título da Ação",
          "descricao_acao":"Descrição da Ação",
          "nome_organizador":"Nome do Organizador",
          "link_organizador":"http://link.com",
          "data_acao":"2024-05-27T00:00:00.000Z",
          "forma_realizacao_acao":"AB",
          "local_acao":"Local da Ação",
          "situacao_acao":"AT",
          "numero_organizadores_acao":5,
          "celular":"12345678901",
          "receber_informacao_patrocionio":false,
          "data_cadastro":"2024-05-28T23:19:27.513Z",
          "data_atualizacao":"2024-05-28T23:19:27.513Z",
          "categoria":{
             "id":1,
             "descricao":"categoria 1"
          },
          "usuario_responsavel":{
             "id":1,
             "nome":"Nome Usuario",
             "email":"email@outlook.com",
             "senha":"cd137e5443e4e970c93cee9e208da17b",
             "status":true,
             "tipo":"A",
             "cpf_cnpj":"12345678910244"
          },
          "usuario_alteracao":{
             "id":1,
             "nome":"Nome Usuario",
             "email":"email@outlook.com",
             "senha":"cd137e5443e4e970c93cee9e208da17b",
             "status":true,
             "tipo":"A",
             "cpf_cnpj":"12345678910244"
          }
       }
    ]

#### Erro
    {
	    "error":  "Mensagem de erro."
    }
</details>

------------------------------------------------------------------------------------------

#### Buscar todas as ações

<details>
 <summary><code>GET</code> <code><b>/acao</b></code></summary>
   
##### Sucesso

      [
       {
          "titulo_acao":"Ação 1",
          "descricao_acao":"Descrição da Ação",
          "nome_organizador":"Nome do Organizador",
          "link_organizador":"http://link.com",
          "data_acao":"2024-07-23T00:00:00.000Z",
          "forma_realizacao_acao":"AB",
          "local_acao":"Local da Ação",
          "situacao_acao":"AT",
          "numero_organizadores_acao":5,
          "celular":"12345678901",
          "receber_informacao_patrocionio":false,
          "data_cadastro":"2024-05-28T23:54:13.855Z",
          "data_atualizacao":"2024-05-28T23:54:13.855Z",
          "categoria":{
             "id":1,
             "descricao":"categoria 1"
          },
          "usuario_responsavel":{
             "id":1,
             "nome":"Nome Usuario",
             "email":"usuario@gmail.com",
             "senha":"cd137e5443e4e970c93cee9e208da17b",
             "status":true,
             "tipo":"A",
             "cpf_cnpj":"12345678910244"
          },
          "usuario_alteracao":{
             "id":1,
             "nome":"Nome Usuario",
             "email":"usuario@gmail.com",
             "senha":"cd137e5443e4e970c93cee9e208da17b",
             "status":true,
             "tipo":"A",
             "cpf_cnpj":"12345678910244"
          }
       },
       {
          "titulo_acao":"Ação 2",
          "descricao_acao":"Descrição da Ação",
          "nome_organizador":"Nome do Organizador",
          "link_organizador":"http://link.com",
          "data_acao":"2024-05-27T00:00:00.000Z",
          "forma_realizacao_acao":"AB",
          "local_acao":"Local da Ação",
          "situacao_acao":"AT",
          "numero_organizadores_acao":5,
          "celular":"12345678901",
          "receber_informacao_patrocionio":false,
          "data_cadastro":"2024-05-28T23:19:27.513Z",
          "data_atualizacao":"2024-05-28T23:19:27.513Z",
          "categoria":{
             "id":1,
             "descricao":"categoria 1"
          },
          "usuario_responsavel":{
             "id":1,
             "nome":"Nome Usuario",
             "email":"usuario@gmail.com",
             "senha":"cd137e5443e4e970c93cee9e208da17b",
             "status":true,
             "tipo":"A",
             "cpf_cnpj":"12345678910244"
          },
          "usuario_alteracao":{
             "id":1,
             "nome":"Nome Usuario",
             "email":"usuario@gmail.com",
             "senha":"cd137e5443e4e970c93cee9e208da17b",
             "status":true,
             "tipo":"A",
             "cpf_cnpj":"12345678910244"
          }
       }
    ]

#### Erro
    {
	    "error":  "Mensagem de erro."
    }
</details>

------------------------------------------------------------------------------------------

#### Buscar ação por data

<details>
 <summary><code>GET</code> <code><b>/acao/{data}</b></code> - formato: yyyy-MM-dd </summary>
   
##### Sucesso
    [
       {
          "titulo_acao":"Título da Ação",
          "descricao_acao":"Descrição da Ação",
          "nome_organizador":"Nome do Organizador",
          "link_organizador":"http://link.com",
          "data_acao":"2024-05-27T00:00:00.000Z",
          "forma_realizacao_acao":"AB",
          "local_acao":"Local da Ação",
          "situacao_acao":"AT",
          "numero_organizadores_acao":5,
          "celular":"12345678901",
          "receber_informacao_patrocionio":false,
          "data_cadastro":"2024-05-28T23:19:27.513Z",
          "data_atualizacao":"2024-05-28T23:19:27.513Z",
          "categoria":{
             "id":1,
             "descricao":"categoria 1"
          },
          "usuario_responsavel":{
             "id":1,
             "nome":"Nome Usuario",
             "email":"email@outlook.com",
             "senha":"cd137e5443e4e970c93cee9e208da17b",
             "status":true,
             "tipo":"A",
             "cpf_cnpj":"12345678910244"
          },
          "usuario_alteracao":{
             "id":1,
             "nome":"Nome Usuario",
             "email":"email@outlook.com",
             "senha":"cd137e5443e4e970c93cee9e208da17b",
             "status":true,
             "tipo":"A",
             "cpf_cnpj":"12345678910244"
          }
       }
    ]

#### Erro
    {
	    "error":  "Mensagem de erro."
    }
</details>

------------------------------------------------------------------------------------------

#### Buscar ação por intervalo de datas

<details>
 <summary><code>GET</code> <code><b>/acao/{data_inicial}/{data_final}</b></code> - formato: yyyy-MM-dd </summary>
   
##### Sucesso

      [
       {
          "titulo_acao":"Ação 1",
          "descricao_acao":"Descrição da Ação",
          "nome_organizador":"Nome do Organizador",
          "link_organizador":"http://link.com",
          "data_acao":"2024-07-23T00:00:00.000Z",
          "forma_realizacao_acao":"AB",
          "local_acao":"Local da Ação",
          "situacao_acao":"AT",
          "numero_organizadores_acao":5,
          "celular":"12345678901",
          "receber_informacao_patrocionio":false,
          "data_cadastro":"2024-05-28T23:54:13.855Z",
          "data_atualizacao":"2024-05-28T23:54:13.855Z",
          "categoria":{
             "id":1,
             "descricao":"categoria 1"
          },
          "usuario_responsavel":{
             "id":1,
             "nome":"Nome Usuario",
             "email":"usuario@gmail.com",
             "senha":"cd137e5443e4e970c93cee9e208da17b",
             "status":true,
             "tipo":"A",
             "cpf_cnpj":"12345678910244"
          },
          "usuario_alteracao":{
             "id":1,
             "nome":"Nome Usuario",
             "email":"usuario@gmail.com",
             "senha":"cd137e5443e4e970c93cee9e208da17b",
             "status":true,
             "tipo":"A",
             "cpf_cnpj":"12345678910244"
          }
       },
       {
          "titulo_acao":"Ação 2",
          "descricao_acao":"Descrição da Ação",
          "nome_organizador":"Nome do Organizador",
          "link_organizador":"http://link.com",
          "data_acao":"2024-05-27T00:00:00.000Z",
          "forma_realizacao_acao":"AB",
          "local_acao":"Local da Ação",
          "situacao_acao":"AT",
          "numero_organizadores_acao":5,
          "celular":"12345678901",
          "receber_informacao_patrocionio":false,
          "data_cadastro":"2024-05-28T23:19:27.513Z",
          "data_atualizacao":"2024-05-28T23:19:27.513Z",
          "categoria":{
             "id":1,
             "descricao":"categoria 1"
          },
          "usuario_responsavel":{
             "id":1,
             "nome":"Nome Usuario",
             "email":"usuario@gmail.com",
             "senha":"cd137e5443e4e970c93cee9e208da17b",
             "status":true,
             "tipo":"A",
             "cpf_cnpj":"12345678910244"
          },
          "usuario_alteracao":{
             "id":1,
             "nome":"Nome Usuario",
             "email":"usuario@gmail.com",
             "senha":"cd137e5443e4e970c93cee9e208da17b",
             "status":true,
             "tipo":"A",
             "cpf_cnpj":"12345678910244"
          }
       }
    ]

#### Erro
    {
	    "error":  "Mensagem de erro."
    }
</details>
