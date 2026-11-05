# Atualização de fluxos, negociação e visão administrativa — 04/11/2026

## Fornecedor

- Eventos e envio de propostas exigem cadastro aprovado; a regra é aplicada pela interface e pela API.
- O fornecedor visualiza os serviços requeridos separados entre os que correspondem ao segmento cadastrado e os demais serviços do evento.
- O fornecedor pode consultar o perfil público do organizador e os eventos aprovados dele.
- Uma proposta por fornecedor/evento/serviço: uma nova tentativa duplicada retorna HTTP 409. Propostas em análise podem ser editadas.
- O relatório comercial exibe total enviado, aceitas, recusadas, em análise, valor bruto aceito e histórico. A exportação usa a impressão do navegador para salvar PDF.

## Negociação

- O organizador pode aceitar ou recusar propostas em análise e enviar contraproposta com valor total, quantidade, descrição e observações.
- Enquanto uma contraproposta aguarda resposta, o organizador não pode aceitar/recusar a proposta original nem enviar outra contraproposta.
- O fornecedor pode aceitar ou recusar a contraproposta. Se aceitar, o registro original recebe o novo valor/descrição e passa a `ACEITA`; a atualização é refletida na lista de propostas dos dois perfis quando sincronizada.

## Organizador

- As notificações e contagens de propostas pendentes são recalculadas após as ações de aceitar/recusar e após a atualização do cache pela API.
- Os indicadores de gastos e resultado estimado consolidam custos manuais e propostas aceitas sem duplicar o mesmo serviço.
- A logo de cada dashboard retorna ao início da área correspondente ao perfil autenticado.

## Administração e comissão

- A aba **Financeiro** do gerenciamento de eventos permite definir a taxa da plataforma por evento.
- São exibidas as projeções de comissão e resultado do organizador para público mínimo, médio e máximo.
- A taxa fica restrita às respostas administrativas. Os objetos públicos de evento não expõem `taxaPlataforma` nem `taxa_plataforma`.
- Os scripts `BD/banco.sql` e `Backend/database/schema.sql` incluem `eventos.taxa_plataforma` e o índice único para evitar propostas duplicadas.
- Bancos existentes recebem a coluna automaticamente na inicialização. O índice único só é adicionado se não houver duplicidades legadas; os dados antigos são preservados.

## Tema claro e navegação

Foram acrescentados refinamentos de paleta branca/azul para componentes de oportunidade, eventos, propostas, relatório comercial e financeiro administrativo. As páginas internas dos dashboards apresentam botão de retorno e a logo retorna ao dashboard do perfil.

## Verificações feitas nesta consolidação

- `cd Backend && npm test`: 14 testes aprovados, 0 falhas.
- `node --check Backend/src/server.js` e `node --check Backend/src/db.js`: sem erros.
- Verificação estática de imports relativos do frontend: 203 referências verificadas, 0 ausentes.
- Verificação sintática dos arquivos `.js`/`.jsx` com TypeScript: nenhum diagnóstico de sintaxe; as únicas mensagens foram tipos `react`/`react-dom` ausentes depois da tentativa interrompida de instalação limpa.
- `BD/banco.sql` e `Backend/database/schema.sql`: conteúdo alinhado.

## Limitações

Não foi possível validar uma instância MySQL/XAMPP real nem concluir `vite build`. A instalação limpa do frontend excedeu o tempo disponível e a pasta `node_modules` recebida não possuía o binding nativo Linux do Rolldown. No Windows, execute `npm install` dentro de `Backend` e `Frontend` para instalar dependências compatíveis com a máquina e rode `npm run build` no frontend.
