const paraCentavos = (valor) => {
  const numero = Number(valor);
  return Number.isFinite(numero) && numero > 0 ? Math.round(numero * 100) : 0;
};

const valorMoeda = (centavos) => Number((centavos / 100).toFixed(2));
const arredondarDivisaoParaCima = (numeradorCentavos, participantes, fatorReceita) =>
  Math.ceil(numeradorCentavos / (participantes * fatorReceita) - 1e-9);

function montarCenario(totalCustosCentavos, publico, margemPercentual, taxaPlataformaPercentual) {
  const participantes = Number(publico);
  const margem = Number(margemPercentual);
  const taxa = Number(taxaPlataformaPercentual);
  if (!Number.isInteger(participantes) || participantes <= 0) return null;
  if (!Number.isFinite(margem) || margem < 0 || margem >= 100) return null;
  if (!Number.isFinite(taxa) || taxa < 0 || taxa >= 100) return null;

  // As duas porcentagens incidem sobre a receita bruta do ingresso.
  // 1º preço: depois da comissão, a receita líquida cobre os custos.
  const fatorCobertura = 1 - taxa / 100;
  const ticketEquilibrioCentavos = arredondarDivisaoParaCima(
    totalCustosCentavos,
    participantes,
    fatorCobertura,
  );
  const receitaCoberturaCentavos = ticketEquilibrioCentavos * participantes;
  const comissaoCoberturaCentavos = Math.round(receitaCoberturaCentavos * taxa / 100);
  const resultadoCoberturaCentavos = receitaCoberturaCentavos - comissaoCoberturaCentavos - totalCustosCentavos;

  // 2º preço: depois da comissão e da margem desejada, a parcela restante cobre os custos.
  const fatorTicketAlvo = 1 - (taxa + margem) / 100;
  let ticketAlvoCentavos = null;
  let receitaAlvoCentavos = null;
  let comissaoAlvoCentavos = null;
  let lucroAlvoCentavos = null;

  if (fatorTicketAlvo > 0) {
    ticketAlvoCentavos = arredondarDivisaoParaCima(
      totalCustosCentavos,
      participantes,
      fatorTicketAlvo,
    );
    receitaAlvoCentavos = ticketAlvoCentavos * participantes;
    comissaoAlvoCentavos = Math.round(receitaAlvoCentavos * taxa / 100);
    lucroAlvoCentavos = receitaAlvoCentavos - comissaoAlvoCentavos - totalCustosCentavos;
  }

  return {
    publico: participantes,
    // Mantém ticketEquilibrio como alias para compatibilidade com componentes antigos.
    ticketEquilibrio: valorMoeda(ticketEquilibrioCentavos),
    ticketCoberturaCustos: valorMoeda(ticketEquilibrioCentavos),
    receitaCobertura: valorMoeda(receitaCoberturaCentavos),
    comissaoCobertura: valorMoeda(comissaoCoberturaCentavos),
    resultadoAposComissaoECustos: valorMoeda(resultadoCoberturaCentavos),
    ticketAlvo: ticketAlvoCentavos == null ? null : valorMoeda(ticketAlvoCentavos),
    receitaEstimada: receitaAlvoCentavos == null ? null : valorMoeda(receitaAlvoCentavos),
    comissaoTrocaTicket: comissaoAlvoCentavos == null ? null : valorMoeda(comissaoAlvoCentavos),
    lucroEstimado: lucroAlvoCentavos == null ? null : valorMoeda(lucroAlvoCentavos),
    resultadoOrganizador: lucroAlvoCentavos == null ? null : valorMoeda(lucroAlvoCentavos),
    margemEfetiva: receitaAlvoCentavos > 0 ? Number(((lucroAlvoCentavos / receitaAlvoCentavos) * 100).toFixed(4)) : null,
    margemLucroEfetiva: receitaAlvoCentavos > 0
      ? Number(((lucroAlvoCentavos / receitaAlvoCentavos) * 100).toFixed(4))
      : null,
    taxaPlataforma: taxa,
    margemLucro: margem,
  };
}

/**
 * Calcula dois preços por cenário de público:
 * 1) cobertura: cobre custos + comissão da TrocaTicket, sem lucro planejado;
 * 2) ticket-alvo: cobre custos + comissão + margem desejada pelo organizador.
 * Uma proposta ACEITA substitui a estimativa manual do mesmo serviço.
 */
export function calcularPrecificacao(evento, itens = [], propostasAceitas = []) {
  const margem = Number(evento?.margem_lucro ?? evento?.margemLucro ?? 0);
  const taxaPlataforma = Number(evento?.taxa_plataforma ?? evento?.taxaPlataforma ?? 0);
  const publicoMinimo = Number(evento?.publico_minimo ?? evento?.publicoMinimo ?? 0);
  const publicoMaximo = Number(evento?.publico_maximo ?? evento?.publicoMaximo ?? 0);
  const alertas = [];

  const itensValidos = Array.isArray(itens) ? itens : [];
  const propostasValidas = (Array.isArray(propostasAceitas) ? propostasAceitas : [])
    .filter((proposta) => String(proposta.status || '').toUpperCase() === 'ACEITA')
    .sort((a, b) => String(b.atualizada_em || b.criada_em || '').localeCompare(String(a.atualizada_em || a.criada_em || '')));

  const propostasPorItem = new Map();
  const contagemAceitas = new Map();
  const propostasSemItem = [];
  for (const proposta of propostasValidas) {
    if (proposta.item_id) {
      const chave = String(proposta.item_id);
      contagemAceitas.set(chave, (contagemAceitas.get(chave) || 0) + 1);
      if (!propostasPorItem.has(chave)) propostasPorItem.set(chave, proposta);
    } else {
      propostasSemItem.push(proposta);
    }
  }

  const componentes = [];
  for (const item of itensValidos) {
    const itemId = String(item.id);
    const proposta = propostasPorItem.get(itemId);
    const estimativaCentavos = paraCentavos(item.valor_estimado ?? item.valorEstimado);

    if (proposta) {
      componentes.push({
        id: `proposta-${proposta.id}`,
        itemId,
        categoria: item.categoria || 'Fornecedor',
        descricao: item.descricao || proposta.descricao || 'Proposta aceita',
        origem: 'PROPOSTA_ACEITA',
        origemRotulo: 'Proposta aceita',
        fornecedorId: proposta.fornecedor_id,
        propostaId: proposta.id,
        valor: valorMoeda(paraCentavos(proposta.valor)),
      });
      if (estimativaCentavos > 0) {
        alertas.push(`O orçamento de referência de “${item.descricao || item.categoria || 'item'}” foi substituído pela proposta aceita para evitar dupla contagem.`);
      }
      if ((contagemAceitas.get(itemId) || 0) > 1) {
        alertas.push(`Há mais de uma proposta marcada como aceita para “${item.descricao || item.categoria || 'item'}”. Foi considerada somente a mais recentemente atualizada.`);
      }
    } else if (estimativaCentavos > 0) {
      componentes.push({
        id: `estimativa-${itemId}`,
        itemId,
        categoria: item.categoria || 'Custo',
        descricao: item.descricao || 'Custo do evento',
        origem: 'ESTIMATIVA_MANUAL',
        origemRotulo: 'Orçamento de referência do organizador',
        fornecedorId: null,
        propostaId: null,
        valor: valorMoeda(estimativaCentavos),
      });
    }
  }

  for (const proposta of propostasSemItem) {
    componentes.push({
      id: `proposta-${proposta.id}`,
      itemId: null,
      categoria: 'Fornecedor',
      descricao: proposta.descricao || 'Proposta aceita sem item vinculado',
      origem: 'PROPOSTA_ACEITA',
      origemRotulo: 'Proposta aceita',
      fornecedorId: proposta.fornecedor_id,
      propostaId: proposta.id,
      valor: valorMoeda(paraCentavos(proposta.valor)),
    });
  }

  const totalCustosCentavos = componentes.reduce((total, item) => total + paraCentavos(item.valor), 0);
  const totalCustos = valorMoeda(totalCustosCentavos);
  const margemValida = Number.isFinite(margem) && margem >= 0 && margem < 100;
  const taxaValida = Number.isFinite(taxaPlataforma) && taxaPlataforma >= 0 && taxaPlataforma < 100;
  const publicoInteiroValido = Number.isInteger(publicoMinimo) && publicoMinimo > 0 && Number.isInteger(publicoMaximo) && publicoMaximo > 0;
  const publicoValido = publicoInteiroValido && publicoMinimo <= publicoMaximo;
  const publicoMedio = publicoValido ? Math.round((publicoMinimo + publicoMaximo) / 2) : 0;
  const podeCalcular = margemValida && taxaValida && publicoValido;
  const cenarioMinimo = podeCalcular ? montarCenario(totalCustosCentavos, publicoMinimo, margem, taxaPlataforma) : null;
  const cenarioMedio = podeCalcular ? montarCenario(totalCustosCentavos, publicoMedio, margem, taxaPlataforma) : null;
  const cenarioMaximo = podeCalcular ? montarCenario(totalCustosCentavos, publicoMaximo, margem, taxaPlataforma) : null;

  if (!componentes.length) alertas.push('Ainda não há custos com valor informado nem propostas aceitas. Adicione custos estimados ou selecione propostas para calcular o ticket.');
  if (!publicoInteiroValido) {
    alertas.push('Informe público mínimo e máximo como números inteiros maiores que zero para calcular os cenários.');
  } else if (publicoMinimo > publicoMaximo) {
    alertas.push('O público mínimo não pode ser maior que o público máximo.');
  }
  if (!margemValida) alertas.push('A margem de lucro precisa estar entre 0% e menos de 100%.');
  if (!taxaValida) alertas.push('A comissão da TrocaTicket precisa estar entre 0% e menos de 100%.');
  if (taxaValida && margemValida && taxaPlataforma + margem >= 100) {
    alertas.push('A soma da margem do organizador com a comissão da TrocaTicket precisa ser menor que 100% para calcular o segundo ticket. O primeiro ticket para cobrir custos + comissão continua disponível.');
  }

  return {
    eventoId: evento?.id || null,
    eventoNome: evento?.nome || '',
    publicoMinimo: Number.isInteger(publicoMinimo) ? publicoMinimo : null,
    publicoMaximo: Number.isInteger(publicoMaximo) ? publicoMaximo : null,
    margemLucro: margemValida ? margem : null,
    taxaPlataforma: taxaValida ? taxaPlataforma : null,
    margemSobreReceita: true,
    taxaPlataformaSobreReceita: true,
    taxaCombinada: margemValida && taxaValida ? margem + taxaPlataforma : null,
    totalCustos,
    componentes,
    temCustos: componentes.length > 0,
    cenarios: { minimo: cenarioMinimo, medio: cenarioMedio, maximo: cenarioMaximo },
    formulas: {
      equilibrio: 'Ticket para cobrir custos + comissão = Custo total / [Público × (1 − Comissão da TrocaTicket)]',
      alvo: 'Ticket com lucro do organizador = Custo total / [Público × (1 − Comissão da TrocaTicket − Margem do organizador)]',
      margem: 'A comissão da TrocaTicket e a margem do organizador são percentuais sobre a receita bruta do ingresso.',
      arredondamento: 'Os tickets são arredondados para cima ao centavo para não subestimar o valor necessário.',
    },
    alertas: [...new Set(alertas)],
  };
}
