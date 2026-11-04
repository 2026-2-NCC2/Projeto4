export function carregarResumoDashboard() {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const simularErro = false

      if (simularErro) {
        reject(
          new Error(
            'Não foi possível carregar as informações.'
          )
        )

        return
      }

      resolve({
        atualizadoEm: new Date().toLocaleTimeString('pt-BR')
      })
    }, 800)
  })
}

function emCentavos(valor) {
  const numero = Number(valor)
  return Number.isFinite(numero) && numero > 0 ? Math.round(numero * 100) : 0
}

/**
 * Soma os custos planejados de todos os eventos do organizador.
 * Uma proposta aceita vinculada a um serviço substitui seu valor estimado;
 * propostas aceitas sem serviço vinculado entram como custos adicionais.
 */
export function calcularGastosEstimadosOrganizador(eventos, propostas) {
  const listaEventos = Array.isArray(eventos) ? eventos : []
  const propostasAceitas = (Array.isArray(propostas) ? propostas : [])
    .filter((proposta) => String(proposta?.status || '').toUpperCase() === 'ACEITA')
    .slice()
    .sort((a, b) => String(b?.atualizadaEm || b?.criadaEm || '').localeCompare(String(a?.atualizadaEm || a?.criadaEm || '')))

  let totalCentavos = 0
  for (const evento of listaEventos) {
    const itens = Array.isArray(evento?.itensCusto) ? evento.itensCusto : []
    const idsItens = new Set(itens.map((item) => String(item?.id ?? '')))
    const propostasDoEvento = propostasAceitas.filter((proposta) =>
      String(proposta?.eventoId ?? proposta?.evento_id ?? '') === String(evento?.id ?? '')
    )
    const propostasPorItem = new Map()
    const propostasParaItensAusentes = new Map()
    const propostasAvulsas = []

    for (const proposta of propostasDoEvento) {
      const itemId = proposta?.itemId ?? proposta?.item_id
      if (itemId == null || itemId === '') {
        propostasAvulsas.push(proposta)
        continue
      }
      const chaveItem = String(itemId)
      if (idsItens.has(chaveItem)) {
        if (!propostasPorItem.has(chaveItem)) propostasPorItem.set(chaveItem, proposta)
      } else if (!propostasParaItensAusentes.has(chaveItem)) {
        propostasParaItensAusentes.set(chaveItem, proposta)
      }
    }

    for (const item of itens) {
      const proposta = propostasPorItem.get(String(item?.id ?? ''))
      const valor = proposta ? proposta.valor : (item?.valorEstimado ?? item?.valor_estimado)
      totalCentavos += emCentavos(valor)
    }
    for (const proposta of propostasParaItensAusentes.values()) totalCentavos += emCentavos(proposta.valor)
    for (const proposta of propostasAvulsas) totalCentavos += emCentavos(proposta.valor)
  }

  return totalCentavos / 100
}
