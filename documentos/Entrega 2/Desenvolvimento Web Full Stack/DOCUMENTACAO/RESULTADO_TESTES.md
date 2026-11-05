# Resultado das verificações da atualização de 04/11/2026

## Testes automatizados executados

Comando: `cd Backend && npm test`.

Resultado atualizado após a regra de dois tickets: **19 testes aprovados, 0 falhas**.

Os testes cobrem privacidade do orçamento de referência, cenários de ticket mínimo/máximo, substituição de custos estimados por propostas aceitas sem dupla contagem, validações de público/margem, seleção da proposta aceita mais recente e classificação de relatório preliminar/consolidado.

Também foram executados `node --check` nos módulos e testes alterados, sem erros de sintaxe. Os 56 arquivos JS/JSX do frontend passaram pela verificação de transpilation/sintaxe; os 45 CSS tiveram balanceamento de chaves conferido e os 204 imports relativos não apontaram caminhos ausentes.

## Funcionalidades atualizadas no código

- Fornecedores incompletos/pendentes não recebem lista de eventos disponíveis e a API bloqueia detalhes/envio de propostas sem aprovação.
- Proposta nova precisa apontar para um serviço requerido do evento; duplicidade por fornecedor/evento/serviço retorna HTTP 409. A API também trata colisão do índice único.
- Propostas em análise podem ser editadas pelo fornecedor.
- Organizador envia contraproposta com valor total, quantidade e descrição; fornecedor pode aceitar ou recusar. Ao aceitar, a mesma proposta é atualizada para `ACEITA`, e a sincronização atualiza ambos os dashboards.
- Relatório do fornecedor soma o valor bruto de propostas aceitas e discrimina aceitas, recusadas e em análise. O valor bruto não equivale a lucro líquido.
- Fornecedor aprovado pode consultar o perfil público do organizador e seus eventos aprovados.
- Administrador define uma taxa de comissão por evento e vê projeções para público mínimo, médio e máximo. `taxa_plataforma` não é incluída nos objetos públicos de evento.
- Logo nos dashboards direciona ao dashboard do perfil conectado.
- `BD/banco.sql` e `Backend/database/schema.sql` foram alinhados, incluindo `taxa_plataforma` e o índice único das propostas.

## Limitações desta validação

- Não houve conexão com uma instância MySQL/XAMPP real neste ambiente; a migração e os fluxos HTTP precisam ser confirmados no computador do usuário.
- A compilação do Vite não foi concluída. A pasta `node_modules` recebida não continha o binding nativo Linux do Rolldown; uma reinstalação limpa foi tentada, mas excedeu o tempo de execução disponível. No Windows do usuário, instale as dependências em `Frontend` com `npm install` antes de executar `npm run build` ou `npm run dev`.
- As rotas e permissões devem ser testadas com três contas separadas (administrador, organizador aprovado e fornecedor aprovado), além de uma conta de fornecedor pendente.


## Atualização da precificação — dois tickets (04/11/2026)

- Ticket de cobertura dos custos: inclui a taxa percentual da TrocaTicket e cobre os custos, sem lucro para o organizador.
- Ticket com margem do organizador: inclui a mesma taxa da TrocaTicket, cobre os custos e preserva a margem percentual desejada pelo organizador.
- A soma taxa TrocaTicket + margem precisa ser menor que 100% para o segundo ticket existir; quando não for, o primeiro ticket continua disponível e o segundo é exibido como indisponível.
- A taxa da TrocaTicket vem da configuração administrativa por evento e é retornada apenas nos endpoints de precificação/relatório autorizados para organizador proprietário e administrador.
- Testes adicionados para exemplo de 5% de comissão + 20% de margem e para soma igual a 100%.
