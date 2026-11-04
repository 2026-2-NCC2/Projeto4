import { CHAVE_PROPOSTAS, lerCache, salvarCache, novoId, requisicaoApi, sincronizarOperacao } from './api'
import { obterSessao } from './usuarios'

export function listarPropostas() {
  return lerCache(CHAVE_PROPOSTAS, [])
}

export async function listarPropostasServidor() {
  const resposta = await requisicaoApi('/proposals')
  const propostas = Array.isArray(resposta?.propostas) ? resposta.propostas : []
  salvarCache(CHAVE_PROPOSTAS, propostas)
  return propostas
}

export async function criarProposta(proposta) {
  const sessao = obterSessao()
  const nova = { ...proposta, id: String(proposta.id || novoId()), fornecedorId: sessao?.id, status: 'EM ANÁLISE', criadaEm: new Date().toISOString() }
  const { proposta: salva } = await requisicaoApi('/proposals', { method: 'POST', body: nova })
  salvarCache(CHAVE_PROPOSTAS, [...listarPropostas().filter((item) => String(item.id) !== String(salva.id)), salva])
  return salva
}

export async function atualizarStatusProposta(id, status) {
  const { proposta } = await requisicaoApi(`/proposals/${encodeURIComponent(id)}/status`, { method: 'PATCH', body: { status } })
  // Uma proposta aceita pode substituir a proposta anteriormente escolhida para o mesmo item.
  // Recarregamos a lista para manter os status locais alinhados ao orçamento consolidado.
  try {
    const resposta = await requisicaoApi('/proposals')
    salvarCache(CHAVE_PROPOSTAS, Array.isArray(resposta.propostas) ? resposta.propostas : [])
  } catch {
    salvarCache(CHAVE_PROPOSTAS, listarPropostas().map((p) => String(p.id) === String(id) ? proposta : p))
  }
  return proposta
}

export async function excluirProposta(id) {
  await requisicaoApi(`/proposals/${encodeURIComponent(id)}`, { method: 'DELETE' })
  salvarCache(CHAVE_PROPOSTAS, listarPropostas().filter((p) => String(p.id) !== String(id)))
}
