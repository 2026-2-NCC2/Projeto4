# Dois tickets estimados: comissão da TrocaTicket e margem do organizador

A tela de precificação agora mostra duas alternativas para cada cenário de público (mínimo, médio e máximo).

1. **Ticket de cobertura dos custos**: preço suficiente para pagar os custos do evento e a taxa da TrocaTicket, sem prever lucro para o organizador.
2. **Ticket com margem do organizador**: preço que cobre os custos, paga a mesma taxa da TrocaTicket e contempla a margem de lucro desejada pelo organizador.

A taxa da TrocaTicket é aplicada nos dois tickets; o que muda é a receita bruta de cada cenário e, consequentemente, o valor em reais da comissão. A margem do organizador só entra no segundo ticket. As duas porcentagens são calculadas sobre a receita bruta do ingresso. Sendo `C` o custo consolidado, `P` o público, `c` a comissão da TrocaTicket e `m` a margem do organizador:

- `Ticket de cobertura dos custos = C / [P × (1 − c)]`
- `Ticket com margem do organizador = C / [P × (1 − c − m)]`

As porcentagens são usadas como frações nas fórmulas (por exemplo, 5% = 0,05). O segundo ticket só pode ser calculado quando `c + m < 1`. A API também impede o administrador de salvar uma taxa que, somada à margem definida para aquele evento, alcance 100%.

Exemplo: custos de R$ 30.000, 600 pessoas, comissão de 5% e margem de 20% resultam em ticket de cobertura dos custos de R$ 52,64 e ticket com margem do organizador de R$ 66,67. Os preços são arredondados para cima ao centavo.

A comissão é configurada pelo administrador no evento. O organizador visualiza a taxa no cálculo e no relatório do próprio evento; fornecedores não recebem essa informação nos dados públicos das oportunidades.
