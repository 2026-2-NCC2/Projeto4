# Ajustes do dashboard do organizador

## Dashboard inicial

O indicador **Gastos estimados — todos os eventos** soma os valores estimados dos serviços requeridos de cada evento e as propostas aceitas que compõem o orçamento. Quando uma proposta aceita está vinculada a um serviço, o valor da proposta substitui a estimativa manual desse serviço. Propostas aceitas sem serviço vinculado são somadas como valores adicionais. Propostas em análise ou recusadas não entram no total.

O valor é apresentado em reais e arredondado a centavos, sem representar pagamento ou despesa já realizada.

## Meus eventos

- A métrica “Propostas recebidas para verificar” conta propostas no status `EM ANÁLISE` do organizador conectado.
- A métrica “Serviços requeridos” conta os registros associados aos eventos do organizador.
- Cada card apresenta o total de propostas recebidas daquele evento e uma indicação adicional quando há propostas que aguardam análise.

As listas são atualizadas a partir dos endpoints autenticados `/api/events` e `/api/proposals`; o cache local é usado como fallback caso a API falhe.

## Detalhes do evento

A área “Planejamento e fornecedores” foi promovida para uma seção de acesso rápido em largura total, com quatro ações sem destinos repetidos: Serviços requeridos, Calcular valor do ticket, Propostas recebidas e Procurar fornecedores. Foi removida a repetição de links para editar o mesmo evento; permanece apenas o botão principal do topo.

## Terminologia

A interface utiliza “Serviços requeridos” para representar o que o organizador precisa para realizar o evento. Os nomes técnicos das tabelas e colunas existentes no MySQL foram preservados, para não exigir migração do banco.

## Banco de dados

As alterações desta entrega não alteram a estrutura MySQL e não exigem reimportar `BD/banco.sql` ou `Backend/database/schema.sql`.
