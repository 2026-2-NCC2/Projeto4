/**
 * Política de divulgação do orçamento de referência para fornecedores.
 * O orçamento do organizador é privado por padrão; só é devolvido quando
 * o próprio organizador marcou explicitamente que pode ser compartilhado.
 */
export function deveExibirOrcamentoFornecedor(item) {
  const valor = item?.mostrarOrcamentoFornecedor ?? item?.exibir_orcamento_fornecedor;
  return valor === true || valor === 1 || valor === '1' || valor === 'true';
}

function sanitizarItemFornecedor(item, deveMostrar = deveExibirOrcamentoFornecedor(item)) {
  if (!item || typeof item !== 'object') return item;
  if (deveMostrar) return { ...item, mostrarOrcamentoFornecedor: true };

  const seguro = { ...item, mostrarOrcamentoFornecedor: false };
  // Remove todos os nomes de campo utilizados pelas versões anteriores para
  // impedir que o orçamento privado vaze na resposta JSON da API.
  delete seguro.valorEstimado;
  delete seguro.valor_estimado;
  delete seguro.valorReferencia;
  delete seguro.valor_referencia;
  delete seguro.orcamentoReferencia;
  delete seguro.orcamento_referencia;
  return seguro;
}

export function aplicarPoliticaOrcamentoFornecedor(evento) {
  if (!evento || typeof evento !== 'object') return evento;

  const itensOriginais = Array.isArray(evento.itensCusto) ? evento.itensCusto : [];
  const itensCusto = itensOriginais.map((item) => sanitizarItemFornecedor(item));
  const itensPorId = new Map(itensOriginais.map((item) => [String(item?.id ?? ''), item]));
  const requisicoesOriginais = Array.isArray(evento.requisicoesFornecedores) ? evento.requisicoesFornecedores : [];
  const requisicoesFornecedores = requisicoesOriginais.map((requisicao) => {
    // A lista de requisições antiga pode manter um JSON antigo com o flag/valor.
    // A fonte de verdade é o item_custo persistido ligado pelo mesmo ID.
    const itemVinculado = itensPorId.get(String(requisicao?.id ?? ''));
    const podeMostrar = Boolean(itemVinculado && deveExibirOrcamentoFornecedor(itemVinculado));
    if (!podeMostrar) return sanitizarItemFornecedor(requisicao, false);
    return {
      ...sanitizarItemFornecedor(requisicao, true),
      valorEstimado: itemVinculado.valorEstimado,
      mostrarOrcamentoFornecedor: true,
    };
  });

  return { ...evento, itensCusto, requisicoesFornecedores };
}
