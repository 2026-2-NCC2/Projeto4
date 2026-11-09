/**
 * Converte itens de custo, demandas e propostas aceitas em linhas de relatório.
 * Um serviço é considerado definido quando possui custo estimado positivo ou
 * uma proposta aceita vinculada àquele serviço.
 */
export function construirServicosRelatorio(itensCusto = [], requisicoesFornecedores = [], propostasAceitas = []) {
  const mapa = new Map();

  for (const item of Array.isArray(itensCusto) ? itensCusto : []) {
    const id = String(item?.id ?? '').trim();
    if (!id) continue;
    const bruto = item.valor_estimado ?? item.valorEstimado ?? null;
    const valorEstimado = bruto == null || bruto === '' ? null : Number(bruto);
    mapa.set(id, {
      id,
      itemId: id,
      categoria: item.categoria || '',
      descricao: item.descricao || 'Serviço requerido',
      valorEstimado: Number.isFinite(valorEstimado) ? valorEstimado : null,
      statusItem: item.status || '',
    });
  }

  for (const demanda of Array.isArray(requisicoesFornecedores) ? requisicoesFornecedores : []) {
    const id = String(demanda?.id ?? '').trim();
    if (!id) continue;
    const existente = mapa.get(id);
    if (existente) {
      existente.categoria = existente.categoria || demanda.categoria || '';
      existente.descricao = existente.descricao || demanda.descricao || 'Serviço requerido';
    } else {
      mapa.set(id, {
        id,
        itemId: null,
        categoria: demanda.categoria || '',
        descricao: demanda.descricao || 'Serviço requerido',
        valorEstimado: null,
        statusItem: 'Demanda sem custo cadastrado',
      });
    }
  }

  const aceitas = (Array.isArray(propostasAceitas) ? propostasAceitas : [])
    .filter((proposta) => String(proposta?.status || '').toUpperCase() === 'ACEITA' && proposta?.item_id)
    .sort((a, b) => String(b.atualizada_em || b.criada_em || '').localeCompare(String(a.atualizada_em || a.criada_em || '')));
  const porItem = new Map();
  for (const proposta of aceitas) {
    const itemId = String(proposta.item_id);
    if (!porItem.has(itemId)) porItem.set(itemId, proposta);
  }

  const servicos = [...mapa.values()].map((servico) => {
    const proposta = servico.itemId ? porItem.get(String(servico.itemId)) : null;
    const valorEstimado = Number(servico.valorEstimado);
    const temEstimativa = servico.valorEstimado != null && Number.isFinite(valorEstimado) && valorEstimado > 0;
    const valorProposta = proposta ? Number(proposta.valor) : null;
    const temProposta = proposta && Number.isFinite(valorProposta) && valorProposta > 0;
    const temCusto = Boolean(temProposta || temEstimativa);

    return {
      id: servico.id,
      itemId: servico.itemId,
      categoria: servico.categoria,
      descricao: servico.descricao,
      valorEstimado: temEstimativa ? valorEstimado : null,
      valorConsiderado: temProposta ? valorProposta : (temEstimativa ? valorEstimado : null),
      origemCusto: temProposta ? 'PROPOSTA_ACEITA' : (temEstimativa ? 'ESTIMATIVA_MANUAL' : null),
      statusCusto: temCusto ? 'DEFINIDO' : 'PENDENTE',
      propostaAceita: temProposta ? {
        id: proposta.id,
        fornecedorId: proposta.fornecedor_id,
        valor: valorProposta,
        validade: proposta.validade || '',
      } : null,
    };
  });

  const servicosPendentes = servicos.filter((servico) => servico.statusCusto === 'PENDENTE');
  const consolidado = servicos.length > 0 && servicosPendentes.length === 0;
  return {
    status: consolidado ? 'CONSOLIDADO' : 'PRELIMINAR',
    totalServicos: servicos.length,
    servicosComCusto: servicos.length - servicosPendentes.length,
    servicosPendentes,
    servicos,
    mensagemStatus: consolidado
      ? 'Todos os serviços possuem custo definido. Este relatório pode ser tratado como orçamento consolidado.'
      : 'Relatório preliminar: defina os custos estimados ou aceite propostas para todos os serviços requeridos.',
  };
}
