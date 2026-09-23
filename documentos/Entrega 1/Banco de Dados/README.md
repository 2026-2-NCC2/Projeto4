# Banco de Dados

## Diagrama

![Diagrama do Banco](diagrama.png)

## Tabelas

### Administrador
- idAdministrador (PK)
- senha

### Organizador
- idOrganizador (PK)
- nome
- senha
- cnpj
- whatsapp
- cidade
- telefone
- email
- estado
- descricao

### Evento
- idEvento (PK)
- idOrganizador (FK)
- nome
- descricao
- capacidade
- endereco
- estado
- cidade
- dataEvento
- status

### Requerimento
- idRequerimento (PK)
- idEvento (FK)
- quantidade
- categoria
- descricao
- status

### Fornecedor
- idFornecedor (PK)
- nome
- email
- senha
- telefone
- cnpjCpf
- categoria
- estado
- cidade
- descricao
- cep

### Proposta
- idProposta (PK)
- idRequerimento (FK)
- idFornecedor (FK)
- quantidade
- valor
- descricao
- status
- dataEnvio

## Relacionamentos

**Organizador - Cria - Evento**
- Organizador: (0,n)
- Evento: (1,1)

**Evento - Possui - Requerimento**
- Evento: (1,n)
- Requerimento: (1,1)

**Requerimento - Recebe - Proposta**
- Requerimento: (0,n)
- Proposta: (1,1)

**Fornecedor - Cria - Proposta**
- Fornecedor: (0,n)
- Proposta: (1,1)

## SQL

Link para o
README da pasta BD:  [banco.sql](banco.sql)
