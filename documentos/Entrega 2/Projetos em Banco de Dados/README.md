# TrocaTicket — documentação do banco de dados (Entrega 2)

## 1. Objetivo e escopo

Este documento descreve a estrutura relacional utilizada pela plataforma TrocaTicket, desenvolvida para apoiar o planejamento de eventos, o cadastro de serviços e custos, a troca de propostas entre organizadores e fornecedores e a estimativa do valor do ingresso.

O banco utiliza **MySQL**, com tabelas em **InnoDB** e codificação `utf8mb4`. O script de criação implementa cinco tabelas principais: `usuarios`, `eventos`, `requisicoes_fornecedor`, `itens_custo` e `propostas`. A estrutura documentada abaixo foi conferida com `BD/banco.sql` e com sua cópia `Backend/database/schema.sql`.

O modelo atende ao escopo de persistência do MVP: cada evento é associado a um organizador; serviços e itens de custo pertencem a um evento; e propostas registram o fornecedor, o organizador, o evento e o serviço ao qual a oferta se refere.

## 2. Diagrama entidade-relacionamento

O diagrama apresenta as cinco tabelas implementadas, suas chaves e os relacionamentos definidos por chaves estrangeiras. O vínculo entre `requisicoes_fornecedor` e `itens_custo` é indicado separadamente porque o backend grava o mesmo identificador para os dois registros, mas o SQL **não declara uma chave estrangeira direta entre essas tabelas**.

![Diagrama entidade-relacionamento da TrocaTicket](diagrama_entidade_relacionamento.png)


## 3. Estrutura das tabelas

Os tipos e restrições a seguir refletem o script SQL. `PK` identifica chave primária; `FK` identifica chave estrangeira; `UQ` identifica unicidade. Quando uma coluna é `NULL`, ela pode ficar sem valor. Quando é `NOT NULL`, o banco exige um valor.

### 3.1 `usuarios`

Armazena a identidade, autenticação, perfil e situação de aprovação das pessoas que utilizam a plataforma. Os perfis previstos no esquema são `ORGANIZADOR`, `FORNECEDOR` e `ADMINISTRADOR`.

| Campo | Tipo MySQL | Regra | Finalidade |
|---|---|---|---|
| `id` | `CHAR(36)` | PK, NOT NULL | Identificador UUID do usuário. Usa conjunto de caracteres ASCII e collation binária. |
| `nome` | `VARCHAR(120)` | NOT NULL | Nome principal da pessoa ou conta. |
| `email` | `VARCHAR(190)` | UQ, NOT NULL | E-mail de acesso; não pode se repetir. |
| `senha_hash` | `VARCHAR(255)` | NOT NULL | Hash da senha, não a senha em texto puro. |
| `perfil` | `VARCHAR(20)` | NOT NULL, CHECK | Papel do usuário: organizador, fornecedor ou administrador. |
| `status` | `VARCHAR(20)` | NOT NULL, DEFAULT `'INCOMPLETO'` | Situação cadastral e de aprovação. |
| `dados_json` | `LONGTEXT` | NOT NULL | Dados complementares específicos do perfil, serializados em JSON pela API. |
| `criado_em` | `TIMESTAMP` | NOT NULL, DEFAULT `CURRENT_TIMESTAMP` | Data/hora de criação do registro. |
| `atualizado_em` | `TIMESTAMP` | NOT NULL, DEFAULT `CURRENT_TIMESTAMP`, ON UPDATE | Data/hora da última atualização. |

**Índices e validações:** `uq_usuarios_email` impede e-mails duplicados; `idx_usuarios_perfil_status` auxilia consultas por perfil e situação; `chk_usuarios_perfil` limita o campo `perfil` aos três valores previstos.

### 3.2 `eventos`

Registra os eventos planejados pelo organizador, incluindo período, local, público estimado, margem e estados do planejamento e da aprovação administrativa.

| Campo | Tipo MySQL | Regra | Finalidade |
|---|---|---|---|
| `id` | `CHAR(36)` | PK, NOT NULL | Identificador UUID do evento. |
| `organizador_id` | `CHAR(36)` | FK, NOT NULL | Usuário responsável; referencia `usuarios.id`. |
| `nome` | `VARCHAR(180)` | NOT NULL | Nome do evento. |
| `categoria` | `VARCHAR(100)` | NULL | Categoria ou tipo do evento. |
| `descricao` | `TEXT` | NULL | Descrição complementar. |
| `data_inicio` | `VARCHAR(20)` | NULL | Data inicial, armazenada como texto no formato adotado pela aplicação. |
| `hora_inicio` | `VARCHAR(10)` | NULL | Horário inicial. |
| `data_fim` | `VARCHAR(20)` | NULL | Data final. |
| `hora_fim` | `VARCHAR(10)` | NULL | Horário final. |
| `local` | `VARCHAR(180)` | NULL | Local de realização. |
| `cidade` | `VARCHAR(120)` | NULL | Cidade do evento. |
| `publico_minimo` | `INT` | NULL | Cenário mínimo de público. |
| `publico_maximo` | `INT` | NULL | Cenário máximo de público. |
| `margem_lucro` | `DECIMAL(8,2)` | NOT NULL, DEFAULT `0` | Margem definida pelo organizador, em percentual. |
| `taxa_plataforma` | `DECIMAL(8,2)` | NOT NULL, DEFAULT `0` | Taxa percentual da plataforma, utilizada na visão administrativa. |
| `capa` | `LONGTEXT` | NULL | Conteúdo ou referência da imagem de capa. |
| `status` | `VARCHAR(40)` | NOT NULL, DEFAULT `'Planejamento'` | Etapa operacional do evento. |
| `status_aprovacao` | `VARCHAR(20)` | NOT NULL, DEFAULT `'PENDENTE'` | Estado da análise administrativa do evento. |
| `dados_json` | `LONGTEXT` | NOT NULL | Dados complementares do evento serializados pela API. |
| `criado_em` | `TIMESTAMP` | NOT NULL, DEFAULT `CURRENT_TIMESTAMP` | Data/hora de criação. |
| `atualizado_em` | `TIMESTAMP` | NOT NULL, DEFAULT `CURRENT_TIMESTAMP`, ON UPDATE | Data/hora da última atualização. |

**Relacionamento:** `eventos.organizador_id` referencia `usuarios.id`. A regra `ON DELETE CASCADE` remove os eventos dependentes quando o usuário organizador é excluído.

**Índices:** `idx_eventos_organizador`, `idx_eventos_data` e `idx_eventos_aprovacao` apoiam consultas por organizador, data inicial e estado de aprovação.

### 3.3 `requisicoes_fornecedor`

Armazena a descrição do que o organizador solicita aos fornecedores para determinado evento. É a parte descritiva da necessidade de cotação.

| Campo | Tipo MySQL | Regra | Finalidade |
|---|---|---|---|
| `id` | `CHAR(36)` | PK, NOT NULL | Identificador UUID da requisição. |
| `evento_id` | `CHAR(36)` | FK, NOT NULL | Evento ao qual a requisição pertence; referencia `eventos.id`. |
| `categoria` | `VARCHAR(100)` | NOT NULL | Categoria do serviço ou produto solicitado. |
| `descricao` | `VARCHAR(500)` | NOT NULL | Descrição do que o organizador precisa. |
| `dados_json` | `LONGTEXT` | NOT NULL | Informações complementares da requisição. |
| `criado_em` | `TIMESTAMP` | NOT NULL, DEFAULT `CURRENT_TIMESTAMP` | Data/hora de criação. |

**Relacionamento:** um evento pode possuir várias requisições. A chave estrangeira utiliza `ON DELETE CASCADE`.

### 3.4 `itens_custo`

Registra os serviços e itens que compõem o orçamento do evento. Além da descrição, mantém o estado da cotação, a estimativa financeira e a regra de visibilidade do orçamento de referência para fornecedores.

| Campo | Tipo MySQL | Regra | Finalidade |
|---|---|---|---|
| `id` | `CHAR(36)` | PK, NOT NULL | Identificador UUID do item de custo. |
| `evento_id` | `CHAR(36)` | FK, NOT NULL | Evento ao qual o custo pertence; referencia `eventos.id`. |
| `categoria` | `VARCHAR(100)` | NOT NULL | Categoria do custo ou serviço. |
| `descricao` | `VARCHAR(500)` | NOT NULL | Descrição do item/serviço. |
| `status` | `VARCHAR(40)` | NOT NULL, DEFAULT `'Rascunho'` | Situação do item no processo de cotação. |
| `valor_estimado` | `DECIMAL(12,2)` | NULL | Valor total estimado pelo organizador. |
| `exibir_orcamento_fornecedor` | `TINYINT(1)` | NOT NULL, DEFAULT `0` | Indica se o orçamento de referência pode ser exibido aos fornecedores. `0` mantém privado; `1` permite exibição. |
| `dados_json` | `LONGTEXT` | NOT NULL | Dados complementares do item, serializados pela API. |
| `criado_em` | `TIMESTAMP` | NOT NULL, DEFAULT `CURRENT_TIMESTAMP` | Data/hora de criação. |

**Relacionamento:** um evento pode possuir vários itens de custo. A chave estrangeira utiliza `ON DELETE CASCADE`. Propostas podem referenciar um item de custo por `propostas.item_id`.

### 3.5 `propostas`

Armazena as ofertas enviadas pelos fornecedores. Cada proposta identifica o evento, o serviço cotado, o fornecedor e o organizador responsável, além do valor e das condições comerciais.

| Campo | Tipo MySQL | Regra | Finalidade |
|---|---|---|---|
| `id` | `CHAR(36)` | PK, NOT NULL | Identificador UUID da proposta. |
| `evento_id` | `CHAR(36)` | FK, NOT NULL | Evento relacionado; referencia `eventos.id`. |
| `item_id` | `CHAR(36)` | FK, NULL | Serviço/ item de custo relacionado; referencia `itens_custo.id`. |
| `fornecedor_id` | `CHAR(36)` | FK, NOT NULL | Fornecedor que enviou a proposta; referencia `usuarios.id`. |
| `organizador_id` | `CHAR(36)` | FK, NOT NULL | Organizador responsável; referencia `usuarios.id`. |
| `valor` | `DECIMAL(12,2)` | NOT NULL, CHECK `> 0` | Valor total ofertado. |
| `validade` | `VARCHAR(30)` | NOT NULL | Prazo ou data de validade informado para a proposta. |
| `descricao` | `VARCHAR(1000)` | NOT NULL | Descrição das condições da oferta. |
| `observacoes` | `TEXT` | NULL | Observações adicionais. |
| `status` | `VARCHAR(20)` | NOT NULL, DEFAULT `'EM ANÁLISE'`, CHECK | Situação: `EM ANÁLISE`, `ACEITA` ou `RECUSADA`. |
| `dados_json` | `LONGTEXT` | NOT NULL | Informações complementares e dados de negociação, serializados pela API. |
| `criada_em` | `TIMESTAMP` | NOT NULL, DEFAULT `CURRENT_TIMESTAMP` | Data/hora de criação. |
| `atualizada_em` | `TIMESTAMP` | NOT NULL, DEFAULT `CURRENT_TIMESTAMP`, ON UPDATE | Data/hora da última atualização. |

**Relacionamentos:** a proposta referencia um evento, um fornecedor, um organizador e, quando informado, um item de custo. As FKs de evento e usuários usam `ON DELETE CASCADE`; a FK do item usa `ON DELETE SET NULL`, preservando o registro da proposta caso o item seja removido.

**Unicidade e validações:** `uq_proposta_fornecedor_servico` combina `fornecedor_id`, `evento_id` e `item_id` para impedir propostas repetidas do mesmo fornecedor para o mesmo serviço/evento quando `item_id` está preenchido. Como o MySQL permite mais de uma ocorrência de `NULL` em índices únicos compostos, o índice isoladamente não impediria duplicidades com `item_id` nulo. No fluxo normal, porém, o endpoint da API exige um item existente e não aceita proposta sem `item_id`; a aplicação também consulta duplicidades antes da gravação. `chk_propostas_valor` exige valor maior que zero e `chk_propostas_status` restringe os estados permitidos.

## 4. Relacionamentos e cardinalidades

| Tabela de origem | Campo de referência | Tabela de destino | Cardinalidade | Regra de exclusão |
|---|---|---|---|---|
| `eventos` | `organizador_id` | `usuarios.id` | Um usuário organizador pode ter vários eventos (1:N). | `CASCADE` |
| `requisicoes_fornecedor` | `evento_id` | `eventos.id` | Um evento pode ter várias requisições (1:N). | `CASCADE` |
| `itens_custo` | `evento_id` | `eventos.id` | Um evento pode ter vários itens de custo (1:N). | `CASCADE` |
| `propostas` | `evento_id` | `eventos.id` | Um evento pode receber várias propostas (1:N). | `CASCADE` |
| `propostas` | `item_id` | `itens_custo.id` | Um item pode estar associado a várias propostas (1:N); a referência é opcional no esquema. | `SET NULL` |
| `propostas` | `fornecedor_id` | `usuarios.id` | Um fornecedor pode enviar várias propostas (1:N). | `CASCADE` |
| `propostas` | `organizador_id` | `usuarios.id` | Um organizador pode ser responsável por várias propostas (1:N). | `CASCADE` |

### Observação sobre requisição e item de custo

No fluxo atual do backend, cada serviço requerido é gravado em `requisicoes_fornecedor` e em `itens_custo` usando o mesmo UUID. Assim, a API mantém os dois registros pareados. Entretanto, não existe uma FK direta entre `requisicoes_fornecedor.id` e `itens_custo.id` no SQL; a integridade desse pareamento é mantida pela lógica da aplicação, não por uma restrição relacional do MySQL.

## 5. Integridade, índices e decisões de modelagem

- **Identificadores:** as cinco tabelas usam `CHAR(36)` para UUIDs, facilitando a geração de identificadores pela aplicação e a referência entre tabelas.
- **Integridade referencial:** as FKs impedem que eventos, requisições, itens e propostas apontem para registros inexistentes.
- **Exclusão em cascata:** a exclusão de um evento remove seus registros dependentes; a exclusão do item de custo define `propostas.item_id` como `NULL`, preservando a proposta.
- **Unicidade:** o e-mail é único em `usuarios`; a combinação fornecedor/evento/item é única em `propostas`.
- **Validações no banco:** existem `CHECK` para perfil do usuário, valor positivo da proposta e estado da proposta. As FKs de `propostas.fornecedor_id` e `propostas.organizador_id` apontam para `usuarios.id`; a validação de que cada participante possui o perfil correto é feita pela API, não por uma FK específica de perfil.
- **Índices de consulta:** foram definidos índices para perfil/status, organizador, data, aprovação, evento e participantes das propostas.
- **Campos complementares:** `dados_json` é `LONGTEXT` preenchido pela API com conteúdo serializado em JSON para dados adicionais de cada entidade. Os campos essenciais usados em relacionamentos, filtros e cálculos permanecem em colunas próprias. O SQL não declara `dados_json` como tipo nativo `JSON`.
- **Datas de evento:** `data_inicio` e `data_fim` estão definidos como `VARCHAR(20)` e os horários como `VARCHAR(10)` no esquema atual; esta documentação preserva os tipos realmente implementados.

## 6. Instalação do banco

### Nova instalação

1. Inicie o MySQL pelo XAMPP (ou outro servidor MySQL compatível).
2. Acesse o phpMyAdmin ou um cliente MySQL.
3. Importe **apenas um** dos scripts equivalentes: `BD/banco.sql` ou `Backend/database/schema.sql`.
4. Confirme a criação do banco `TrocaTicket` e das cinco tabelas descritas neste documento.
5. Configure as variáveis `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER` e `DB_PASSWORD` em `Backend/.env`, usando `Backend/.env.example` como referência.

Os dois scripts de criação estão alinhados e devem ser mantidos idênticos quando houver alterações no esquema.

### Banco já existente

Não exclua o banco nem reimporte o script de criação sobre dados existentes sem necessidade. Ao iniciar, `Backend/src/db.js` executa verificações para acrescentar, quando ausentes, as colunas `eventos.status_aprovacao`, `eventos.taxa_plataforma`, `itens_custo.valor_estimado` e `itens_custo.exibir_orcamento_fornecedor`, além dos índices correspondentes. Também verifica a criação do índice único de propostas; caso encontre duplicidades antigas, preserva os registros e registra um aviso em vez de apagar dados.

O arquivo `BD/migracao_status_aprovacao_eventos.sql` é uma migração manual antiga e pontual para acrescentar `status_aprovacao` e seu índice. Execute-o somente se confirmar que a coluna e o índice ainda não existem. Não é necessário executá-lo em bancos nos quais a inicialização do backend já aplicou essa alteração.

## 7. Rastreabilidade com a entrega

| Exigência da Entrega 2 de Banco de Dados | Evidência no projeto |
|---|---|
| Implementar ao menos duas tabelas com campos adequados | Cinco tabelas implementadas em `BD/banco.sql`. |
| Definir chaves primárias | Todas as cinco tabelas possuem `PRIMARY KEY (id)`. |
| Definir chaves estrangeiras quando necessárias | Relacionamentos entre usuários, eventos, requisições, itens de custo e propostas, descritos nas seções 2 e 4. |
| Descrever estrutura, campos e tipos de dados no README da pasta BD | Este arquivo, `BD/README.md`, documenta todas as colunas e restrições. |
| Disponibilizar link no README principal | O README da raiz aponta para `BD/README.md` e para o diagrama do modelo. |
| Manter documentação coerente com a modelagem | As tabelas e restrições foram conferidas com os dois scripts SQL; os scripts são idênticos nesta versão. |

## 8. Arquivos relacionados

- [`banco.sql`](banco.sql) — criação do banco e das cinco tabelas.
- [`../Backend/database/schema.sql`](../Backend/database/schema.sql) — cópia utilizada como referência de instalação pelo backend.
- [`migracao_status_aprovacao_eventos.sql`](migracao_status_aprovacao_eventos.sql) — migração manual pontual para bancos antigos.
- [`../Backend/src/db.js`](../Backend/src/db.js) — conexão MySQL, verificações de migração e funções de acesso aos dados.
- [`modelo_relacional.dbml`](modelo_relacional.dbml) — fonte textual editável do modelo relacional.

---

**Nota de validação:** esta documentação foi conferida estaticamente com os arquivos SQL e o código do projeto enviado. A execução em um servidor MySQL ativo deve ser realizada pela equipe no ambiente de desenvolvimento, especialmente após alterações futuras no esquema.
