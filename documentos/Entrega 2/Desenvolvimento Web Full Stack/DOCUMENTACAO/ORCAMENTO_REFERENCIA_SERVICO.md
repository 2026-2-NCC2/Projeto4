# Orçamento de referência por serviço

## O que significa

O campo **Orçamento de referência (R$)** registra o valor total que o organizador estima gastar com aquele serviço específico (por exemplo, o total do buffet ou da segurança), e não uma média de mercado nem um preço por unidade. É uma estimativa de planejamento que pode alimentar o orçamento e o cálculo do ticket.

Quando uma proposta é aceita para o mesmo serviço, o cálculo financeiro usa a proposta aceita no lugar da estimativa manual, evitando a dupla contagem.

## Visibilidade para fornecedores

O orçamento é **privado por padrão**. O organizador pode marcar “Compartilhar este orçamento de referência com os fornecedores” para divulgar o valor aos fornecedores que consultam aquele evento. O fornecedor verá que se trata de uma referência opcional e pode apresentar sua própria cotação.

A API remove o valor de referência das respostas destinadas ao fornecedor quando o compartilhamento está desativado. Isso é aplicado tanto na listagem de eventos quanto no detalhe do evento, incluindo os objetos de serviços/requisições.

## Banco de dados

A coluna `itens_custo.exibir_orcamento_fornecedor` é adicionada automaticamente na inicialização do backend, com `DEFAULT 0`. Portanto, os serviços existentes permanecem privados para fornecedores, sem apagar dados. Novos bancos também recebem a coluna pelo `schema.sql` e pelo script `BD/banco.sql`.
