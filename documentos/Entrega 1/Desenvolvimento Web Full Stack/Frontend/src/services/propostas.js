const CHAVE_PROPOSTAS = 'trocaticket_propostas'

// Esta camada centraliza a leitura e gravação das propostas no navegador.
export function listarPropostas() {
  const dados = localStorage.getItem(CHAVE_PROPOSTAS)

  if (!dados) {
    return []
  }

  return JSON.parse(dados)
}

export function criarProposta(proposta) {
  const propostas = listarPropostas()

  const novaProposta = {
    ...proposta,
    id: Date.now(),
    // Depois do envio, a proposta aguarda a decisão do organizador.
    status: 'EM ANÁLISE',
    criadaEm: new Date().toLocaleDateString('pt-BR')
  }

  propostas.push(novaProposta)

  localStorage.setItem(
    CHAVE_PROPOSTAS,
    JSON.stringify(propostas)
  )

  return novaProposta
}

export function excluirProposta(id) {
  const propostas = listarPropostas()

  const atualizadas = propostas.filter(
    (proposta) => String(proposta.id) !== String(id)
  )

  localStorage.setItem(
    CHAVE_PROPOSTAS,
    JSON.stringify(atualizadas)
  )
}