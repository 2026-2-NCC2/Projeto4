const paraCentavos = (valor) => {
  const numero = Number(valor);
  return Number.isFinite(numero) && numero > 0 ? Math.round(numero * 100) : 0;
};

const valorMoeda = (centavos) => Number((centavos / 100).toFixed(2));

function montarCenario(totalCustosCentavos, publico, margemPercentual) {
  const participantes = Number(publico);
  if (!Number.isInteger(participantes) || participantes <= 0) return null;
  if (!Number.isFinite(margemPercentual) || margemPercentual < 0 || margemPercentual >= 100) return null;

  const fatorReceita = 1 - margemPercentual / 100;
  const ticketEquilibrioCentavos = Math.ceil(totalCustosCentavos / participantes - 1e-9);
  const ticketAlvoCentavos = Math.ceil(totalCustosCentavos / (participantes * fatorReceita) - 1e-9);
  const receitaEstimadaCentavos = ticketAlvoCentavos * participantes;

  return {
    publico: participantes,
    ticketEquilibrio: valorMoeda(ticketEquilibrioCentavos),
    ticketAlvo: valorMoeda(ticketAlvoCentavos),
    receitaEstimada: valorMoeda(receitaEstimadaCentavos),
    lucroEstimado: valorMoeda(receitaEstimadaCentavos - totalCustosCentavos),
  };
}

/**
 * Calcula o ticket de equilíbrio e o ticket-alvo a partir de custos realmente
 * consolidados. Uma proposta ACEITA substitui a estimativa manual do mesmo item,
 * evitando contar o custo duas vezes. Propostas sem item vinculado são custos
 * independentes quando aceitas.
 */
export function calcularPrecificacao(evento, itens = [], propostasAceitas = []) {
  const margem = Number(evento?.margem_lucro ?? evento?.margemLucro ?? 0);
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
  const publicoInteiroValido = Number.isInteger(publicoMinimo) && publicoMinimo > 0 && Number.isInteger(publicoMaximo) && publicoMaximo > 0;
  const publicoValido = publicoInteiroValido && publicoMinimo <= publicoMaximo;
  const cenarioMinimo = margemValida && publicoValido ? montarCenario(totalCustosCentavos, publicoMinimo, margem) : null;
  const cenarioMaximo = margemValida && publicoValido ? montarCenario(totalCustosCentavos, publicoMaximo, margem) : null;

  if (!componentes.length) alertas.push('Ainda não há custos com valor informado nem propostas aceitas. Adicione custos estimados ou selecione propostas para calcular o ticket.');
  if (!publicoInteiroValido) {
    alertas.push('Informe público mínimo e máximo como números inteiros maiores que zero para calcular os cenários.');
  } else if (publicoMinimo > publicoMaximo) {
    alertas.push('O público mínimo não pode ser maior que o público máximo.');
  }
  if (!margemValida) alertas.push('A margem de lucro precisa estar entre 0% e menos de 100%.');

  return {
    eventoId: evento?.id || null,
    eventoNome: evento?.nome || '',
    publicoMinimo: Number.isInteger(publicoMinimo) ? publicoMinimo : null,
    publicoMaximo: Number.isInteger(publicoMaximo) ? publicoMaximo : null,
    margemLucro: margemValida ? margem : null,
    margemSobreReceita: true,
    totalCustos,
    componentes,
    temCustos: componentes.length > 0,
    cenarios: { minimo: cenarioMinimo, maximo: cenarioMaximo },
    formulas: {
      equilibrio: 'Ticket de equilíbrio = Custo total consolidado / Público',
      alvo: 'Ticket-alvo = Custo total consolidado / [Público × (1 − Margem de lucro)]',
      margem: 'A margem é considerada sobre a receita total, conforme o enunciado do projeto.',
      arredondamento: 'Os tickets são arredondados para cima ao centavo para não subestimar o valor necessário.',
    },
    alertas: [...new Set(alertas)],
  };
}
