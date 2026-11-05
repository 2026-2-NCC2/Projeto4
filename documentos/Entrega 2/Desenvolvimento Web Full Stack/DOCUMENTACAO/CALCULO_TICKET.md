# Cálculo dos dois tickets estimados

Esta documentação descreve a regra de precificação usada pela TrocaTicket. O MVP não vende ingressos nem processa pagamentos: apresenta projeções para apoiar o planejamento do organizador.

## Variáveis

- `C`: custo total consolidado do evento (estimativas válidas e propostas aceitas, sem duplicar o mesmo serviço);
- `P`: público considerado no cenário (mínimo, médio ou máximo);
- `c`: comissão da TrocaTicket, como fração da receita bruta;
- `m`: margem desejada pelo organizador, também como fração da receita bruta.

A comissão é definida pelo administrador para cada evento. A margem é informada pelo organizador. As duas porcentagens incidem sobre a receita bruta do ingresso.

## Ticket de cobertura dos custos dos custos (inclui a taxa TrocaTicket)

Este é o menor preço estimado para que, depois do desconto da comissão da plataforma, a receita restante cubra os custos do evento. Não prevê lucro para o organizador.

`Ticket_cobertura = C / [P × (1 − c)]`

## 2º ticket — cobertura dos custos + taxa TrocaTicket + margem do organizador

Este preço acrescenta a margem que o organizador deseja obter, preservando-a como percentual da receita bruta depois de considerar a comissão da plataforma e os custos.

`Ticket_com_lucro = C / [P × (1 − c − m)]`

A taxa da TrocaTicket incide nos dois tickets; no segundo cenário, soma-se a margem de lucro do organizador. A segunda fórmula só é válida quando `c + m < 1` (ou seja, quando a soma das porcentagens é menor que 100%). Se a soma for igual ou superior a 100%, o sistema continua apresentando o 1º ticket, mas informa que o 2º é indisponível.

## Exemplo ilustrativo

Considere custo consolidado de R$ 30.000, público de 600 pessoas, comissão TrocaTicket de 5% e margem do organizador de 20%.

| Indicador | Resultado |
|---|---:|
| Ticket de cobertura dos custos | R$ 52,64 |
| Receita bruta no 1º ticket | R$ 31.584,00 |
| Taxa TrocaTicket no ticket de cobertura | R$ 1.579,20 |
| Ticket com margem do organizador | R$ 66,67 |
| Receita bruta projetada com o ticket com margem | R$ 40.002,00 |
| Taxa TrocaTicket no ticket com margem | R$ 2.000,10 |
| Custos do evento | R$ 30.000,00 |
| Lucro estimado do organizador após custos e taxa | R$ 8.001,90 |

O arredondamento do preço para cima ao centavo pode produzir diferença positiva de alguns centavos em relação à cobertura ou à margem matemática exata.

## Custos considerados

O custo consolidado inclui itens de custo com valor estimado positivo e propostas com status `ACEITA`. Quando uma proposta é aceita para um serviço que já possui estimativa, a proposta substitui a estimativa daquele serviço, evitando dupla contagem. Propostas pendentes ou recusadas não entram no custo.

## Cenários, validações e arredondamento

O sistema calcula os dois preços para público mínimo, médio (média arredondada entre mínimo e máximo) e máximo. O público precisa ser inteiro e maior que zero; o público mínimo não pode superar o máximo. A comissão deve ficar entre 0% e menos de 100%; a margem deve ficar entre 0% e menos de 100%; para calcular o segundo ticket, a soma comissão + margem precisa ser menor que 100%. Os valores do ticket são arredondados para cima ao centavo, evitando subestimar o preço necessário.

## Onde consultar

O organizador encontra os dois tickets em **Evento → Calcular valor do ticket** e no relatório financeiro. O administrador também consulta os cenários na análise do evento. A comissão continua sendo informação administrativa e é apresentada ao organizador autenticado apenas na precificação/relatório do próprio evento; não é exposta ao fornecedor na oportunidade pública.
