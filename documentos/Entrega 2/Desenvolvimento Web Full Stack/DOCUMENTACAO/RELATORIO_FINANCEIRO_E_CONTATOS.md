# Relatório financeiro e contatos de fornecedores

## Contatos após aceitar uma proposta

A API `GET /api/proposals` só inclui `contatoFornecedor` para chamadas autenticadas de um Organizador, e somente quando a proposta desse organizador está com status `ACEITA`. A resposta não inclui contatos nas propostas `EM ANÁLISE` ou `RECUSADA`. O endpoint filtra propostas pelo `organizador_id` da sessão autenticada.

A tela **Organizador > Propostas recebidas** exibe e-mail, telefone/WhatsApp e dados comerciais disponíveis depois que a proposta é aceita. Não requer uma cópia manual dos dados de fornecedor.

## Relatório do evento

- Tela: `/organizador/eventos/:id/relatorio`.
- API: `GET /api/events/:id/report`.
- A API exige perfil `ORGANIZADOR` e valida se o evento pertence à sessão atual.
- O relatório pode ser consultado durante o planejamento como **preliminar**, com a lista de serviços sem custo definido. Passa para **consolidado** quando todos os serviços requeridos registrados têm valor estimado positivo ou proposta aceita vinculada.
- Uma proposta aceita substitui o valor estimado do mesmo serviço para fins de precificação, evitando dupla contagem.
- Propostas aceitas aparecem com os contatos comerciais do fornecedor no relatório; não há dados de contato em linhas de propostas ainda pendentes.
- O botão **Exportar / imprimir PDF** abre a janela de impressão do navegador. Selecione “Salvar como PDF” para gerar o arquivo.

## Regras da projeção

O relatório usa a função de precificação centralizada na API para custo total consolidado, ticket de equilíbrio e ticket-alvo. O cálculo reserva tanto a margem desejada pelo organizador quanto a comissão da TrocaTicket, ambas como percentuais da receita bruta. O público esperado é editável no relatório e inicializa com a média entre público mínimo e máximo do evento porque não existe um campo próprio para público esperado no formulário atual. O preço de ingresso de referência também pode ser editado para simular metas de ingressos para cobrir os custos e alcançar a margem desejada.

As projeções não representam venda real nem pagamento. O MVP não registra transações financeiras.
