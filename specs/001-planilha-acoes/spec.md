# Feature Specification: Planilha de ações por edição

**Feature Branch**: `001-planilha-acoes`

**Created**: 2026-09-27

**Status**: Draft

**Input**: User description: "Admin baixa planilha Excel das acoes da edicao selecionada"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Baixar a edição selecionada (Priority: P1)

Uma administradora, na lista de ações, escolhe a edição vigente ou um ano e baixa um arquivo já formatado com todas as ações daquela edição, independente da página de 10 linhas que está na tela.

**Why this priority**: O arquivo atual só contém a página visível. O trabalho delas é o cadastro completo da edição.

**Independent Test**: Com a edição vigente selecionada e filtros de categoria ou situação preenchidos na tela, o arquivo traz todas as ações dessa edição e ignora aqueles filtros.

**Acceptance Scenarios**:

1. **Given** uma edição com ações em mais de uma página, **When** a administradora baixa a planilha dessa edição, **Then** o arquivo contém todas as ações, ordenadas da data mais antiga para a mais recente, com hora.
2. **Given** filtros de categoria, situação, usuário, forma ou pesquisa aplicados na lista, **When** ela baixa a planilha, **Then** esses filtros não reduzem o arquivo.
3. **Given** um usuário comum ou uma visita sem login, **When** pede o arquivo, **Then** não recebe as ações.

---

### User Story 2 - Uma aba por ano (Priority: P2)

Quando o seletor está em todas as edições, o arquivo traz uma tabela por ano. Cada edição é anual e há no máximo uma por ano.

**Why this priority**: O caso usual é a vigente. Todas as edições precisa existir, sem misturar anos na mesma tabela.

**Independent Test**: Com ações em dois anos, o arquivo de todas as edições abre com duas abas, cada uma nomeada pelo ano, só com as ações daquele ano.

**Acceptance Scenarios**:

1. **Given** ações em 2025 e 2026, **When** a administradora baixa todas as edições, **Then** o arquivo tem uma aba `2025` e outra `2026`, nesta ordem.
2. **Given** um ano sem ações, **When** ela baixa todas as edições, **Then** esse ano não vira aba.
3. **Given** um ano escolhido e sem ações, **When** ela baixa essa edição, **Then** o arquivo traz a aba daquele ano só com o cabeçalho.

---

### Edge Cases

- Não há edição vigente e o seletor pede a vigente: arquivo com cabeçalho e sem linhas de ação.
- Edição informada que não existe: a API recusa com a mesma mensagem de edição não encontrada da listagem.
- Várias baixadas seguidas: o limite da rota responde antes de gerar outro arquivo.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Só administradora autenticada baixa o arquivo.
- **FR-002**: O recorte é o da edição: vigente, um ano, ou todas. Categoria, situação, usuário, forma de realização, pesquisa e datas da tela não entram.
- **FR-003**: O arquivo inclui todas as ações desse recorte, sem paginação.
- **FR-004**: Cada ano com ação fica numa aba própria, nomeada pelo ano, em ordem crescente. Dentro da aba, a ordem é data da ação e, no empate, o identificador.
- **FR-005**: As colunas repetem o arquivo que a tela já gera hoje, com data e hora no fuso de São Paulo.
- **FR-006**: O arquivo mostra celular e e-mail do responsável, como a lista do admin. Não mostra senha nem CPF/CNPJ.
- **FR-007**: Cada aba é uma tabela formatada do Excel: cabeçalho destacado, linhas em faixas de verde e a primeira linha congelada.
- **FR-008**: O nome do arquivo identifica o ano, ou que são todas as edições, e termina com o momento do download em ano, mês, dia, hora e minuto, sem separadores.

### Key Entities

- **Ação**: cadastro ambiental exportado, com situação, local, organizador e responsável.
- **Edição**: ano da campanha. Uma por ano. Define a aba e o recorte do arquivo.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Uma administradora obtém todas as ações da edição escolhida num único download, sem percorrer páginas.
- **SC-002**: Com "todas" selecionado, cada ano ocupado aparece numa aba separada, na ordem do ano.
- **SC-003**: Usuário comum e visita sem login não recebem o arquivo.
- **SC-004**: Filtros da grade, se enviados junto, não mudam o conjunto de linhas.

## Assumptions

- O volume cabe num arquivo montado de uma vez. Stream fica para dezenas de milhares de ações.
- A troca do botão na aplicação web é um passo seguinte, fora desta API. O contrato do download já deixa o nome do arquivo num cabeçalho que o navegador pode ler.
