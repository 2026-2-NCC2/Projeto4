# Banco de dados da TrocaTicket

O projeto utiliza **MySQL** (por exemplo, pelo XAMPP). O esquema oficial está em [`banco.sql`](./banco.sql) e sua cópia usada pelo backend está em [`Backend/database/schema.sql`](../Backend/database/schema.sql). Mantenha os dois scripts alinhados.

## Importação

1. Inicie MySQL no XAMPP.
2. Abra `http://localhost/phpmyadmin`.
3. Selecione **Importar**, escolha `BD/banco.sql` e execute.
4. Confirme o banco `TrocaTicket` e suas cinco tabelas principais.

Se o banco já contém dados, não o apague nem reimporte sem necessidade. O backend executa migrações compatíveis para novas colunas e índices. Faça backup antes de alterações no esquema.

## Estrutura das tabelas

### `usuarios`

| Campo | Tipo | Chave / regra | Descrição |
|---|---|---|---|
| `id` | `CHAR(36)` | PK | Identificador UUID. |
| `nome` | `VARCHAR(120)` | NOT NULL | Nome da pessoa ou usuário. |
| `email` | `VARCHAR(190)` | UNIQUE, NOT NULL | E-mail de acesso. |
| `senha_hash` | `VARCHAR(255)` | NOT NULL | Hash seguro da senha; nunca armazena senha em texto puro. |
| `perfil` | `VARCHAR(20)` | NOT NULL, CHECK | `ORGANIZADOR`, `FORNECEDOR` ou `ADMINISTRADOR`. |
| `status` | `VARCHAR(20)` | NOT NULL | Estado do cadastro: incompleto, pendente, aprovado ou rejeitado. |
| `dados_json` | `LONGTEXT` | NOT NULL | Dados complementares do perfil. |
| `criado_em`, `atualizado_em` | `TIMESTAMP` | defaults | Auditoria básica de criação/atualização. |

### `eventos`

| Campo | Tipo | Chave / regra | Descrição |
|---|---|---|---|
| `id` | `CHAR(36)` | PK | Identificador UUID. |
| `organizador_id` | `CHAR(36)` | FK → `usuarios.id` | Organizador responsável; exclusão em cascata. |
| `nome` | `VARCHAR(180)` | NOT NULL | Nome do evento. |
| `categoria` | `VARCHAR(100)` | NULL | Categoria do evento. |
| `descricao` | `TEXT` | NULL | Descrição. |
| `data_inicio`, `data_fim` | `VARCHAR(20)` | NULL | Período do evento (data ISO). |
| `hora_inicio`, `hora_fim` | `VARCHAR(10)` | NULL | Horários. |
| `local` | `VARCHAR(180)` | NULL | Local do evento. |
| `cidade` | `VARCHAR(120)` | NULL | Cidade. |
| `publico_minimo`, `publico_maximo` | `INT` | NULL | Cenários de público. |
| `margem_lucro` | `DECIMAL(8,2)` | NOT NULL, default 0 | Margem do organizador em percentual. |
| `taxa_plataforma` | `DECIMAL(8,2)` | NOT NULL, default 0 | Comissão percentual definida pelo administrador; exibida apenas na área administrativa. |
| `capa` | `LONGTEXT` | NULL | Imagem/capa cadastrada. |
| `status` | `VARCHAR(40)` | NOT NULL | Etapa de planejamento. |
| `status_aprovacao` | `VARCHAR(20)` | NOT NULL | Aprovação administrativa independente do planejamento. |
| `dados_json` | `LONGTEXT` | NOT NULL | Campos complementares. |
| `criado_em`, `atualizado_em` | `TIMESTAMP` | defaults | Datas de controle. |

### `requisicoes_fornecedor`

| Campo | Tipo | Chave / regra | Descrição |
|---|---|---|---|
| `id` | `CHAR(36)` | PK | Identificador da solicitação. |
| `evento_id` | `CHAR(36)` | FK → `eventos.id` | Evento que precisa do serviço; exclusão em cascata. |
| `categoria` | `VARCHAR(100)` | NOT NULL | Categoria/segmento requerido. |
| `descricao` | `VARCHAR(500)` | NOT NULL | Descrição do que o organizador precisa. |
| `dados_json` | `LONGTEXT` | NOT NULL | Campos adicionais da solicitação. |
| `criado_em` | `TIMESTAMP` | default | Data de criação. |

### `itens_custo`

| Campo | Tipo | Chave / regra | Descrição |
|---|---|---|---|
| `id` | `CHAR(36)` | PK | Identificador do serviço/custo. |
| `evento_id` | `CHAR(36)` | FK → `eventos.id` | Evento ao qual o serviço pertence; exclusão em cascata. |
| `categoria` | `VARCHAR(100)` | NOT NULL | Categoria do serviço. |
| `descricao` | `VARCHAR(500)` | NOT NULL | Serviço requerido. |
| `status` | `VARCHAR(40)` | NOT NULL | Situação da cotação. |
| `valor_estimado` | `DECIMAL(12,2)` | NULL | Orçamento total de referência, definido pelo organizador. |
| `exibir_orcamento_fornecedor` | `TINYINT(1)` | NOT NULL, default 0 | Controla se o valor de referência pode ser mostrado ao fornecedor. |
| `dados_json` | `LONGTEXT` | NOT NULL | Campos complementares. |
| `criado_em` | `TIMESTAMP` | default | Data de criação. |

### `propostas`

| Campo | Tipo | Chave / regra | Descrição |
|---|---|---|---|
| `id` | `CHAR(36)` | PK | Identificador da proposta. |
| `evento_id` | `CHAR(36)` | FK → `eventos.id` | Evento cotado. |
| `item_id` | `CHAR(36)` | FK → `itens_custo.id`, NULL permitido | Serviço ao qual a proposta está vinculada; ao excluir o item, fica NULL. |
| `fornecedor_id` | `CHAR(36)` | FK → `usuarios.id` | Fornecedor proponente. |
| `organizador_id` | `CHAR(36)` | FK → `usuarios.id` | Organizador responsável pelo evento. |
| `valor` | `DECIMAL(12,2)` | CHECK > 0 | Valor total ofertado. |
| `validade` | `VARCHAR(30)` | NOT NULL | Validade da proposta. |
| `descricao` | `VARCHAR(1000)` | NOT NULL | Condições/descrição da proposta. |
| `observacoes` | `TEXT` | NULL | Observações. |
| `status` | `VARCHAR(20)` | CHECK | `EM ANÁLISE`, `ACEITA` ou `RECUSADA`. |
| `dados_json` | `LONGTEXT` | NOT NULL | Dados adicionais, incluindo contraproposta e resposta. |
| `criada_em`, `atualizada_em` | `TIMESTAMP` | defaults | Datas de controle. |

## Relacionamentos principais

- Um usuário organizador pode ter vários eventos (`usuarios` 1:N `eventos`).
- Um evento pode possuir várias solicitações de fornecedor e vários serviços/custos (1:N).
- Um evento/serviço pode receber propostas de diferentes fornecedores.
- Cada proposta identifica o evento, o fornecedor, o organizador e, quando aplicável, o serviço requerido.
- O índice único `uq_proposta_fornecedor_servico` impede mais de uma proposta do mesmo fornecedor para o mesmo serviço/evento. A API também retorna HTTP 409 para nova tentativa duplicada.

## Índices e integridade

O esquema possui índices para e-mail, perfil/status de usuários, organizador e data/aprovação de eventos, evento de cada serviço/requisição e fornecedor/organizador/evento das propostas. Chaves estrangeiras evitam registros órfãos. As exclusões em cascata de eventos removem registros dependentes conforme o relacionamento; a exclusão do serviço deixa a referência da proposta como NULL.

## Migrações automáticas

Em bancos existentes, `Backend/src/db.js` verifica a existência de `status_aprovacao`, `valor_estimado`, `exibir_orcamento_fornecedor`, `taxa_plataforma` e índices correspondentes antes de executar `ALTER TABLE`/`CREATE INDEX`. Para criar o índice único de propostas, a migração verifica primeiro se existem duplicidades antigas; se houver, preserva os registros e registra aviso, enquanto a API continua fazendo a validação de duplicidade.
