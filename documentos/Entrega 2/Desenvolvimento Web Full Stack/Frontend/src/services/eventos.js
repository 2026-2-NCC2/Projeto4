import { CHAVE_EVENTOS, lerCache, salvarCache, novoId, requisicaoApi, sincronizarOperacao } from './api'
import { obterSessao } from './usuarios'

export function listarEventos() {
  return lerCache(CHAVE_EVENTOS, [])
}

export async function listarEventosServidor() {
  const resposta = await requisicaoApi('/events')
  const eventos = Array.isArray(resposta?.eventos) ? resposta.eventos : []
  salvarCache(CHAVE_EVENTOS, eventos)
  return eventos
}

export async function listarEventosAdministracao() {
  const { eventos } = await requisicaoApi('/admin/events')
  const lista = Array.isArray(eventos) ? eventos : []
  salvarCache(CHAVE_EVENTOS, lista)
  return lista
}

export async function alterarStatusAprovacaoEvento(id, statusAprovacao) {
  const { evento } = await requisicaoApi(`/admin/events/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    body: { statusAprovacao },
  })
  salvarCache(CHAVE_EVENTOS, listarEventos().map((item) => String(item.id) === String(id) ? evento : item))
  return evento
}

export function buscarEventoPorId(id) {
  return listarEventos().find((evento) => String(evento.id) === String(id))
}

export async function buscarEventoPorIdApi(id) {
  const { evento } = await requisicaoApi(`/events/${encodeURIComponent(id)}`)
  if (evento?.id) {
    const anteriores = listarEventos()
    salvarCache(CHAVE_EVENTOS, Array.isArray(anteriores)
      ? [...anteriores.filter((item) => String(item.id) !== String(evento.id)), evento]
      : [evento])
  }
  return evento
}

export async function criarEvento(evento) {
  const sessao = obterSessao()
  if (sessao?.status !== 'APROVADO') throw new Error('Seu cadastro de organizador precisa ser aprovado antes de criar eventos.')
  const novoEvento = { ...evento, id: String(evento.id || novoId()), organizadorId: sessao?.id, status: 'Planejamento', itensCusto: evento.itensCusto || [] }
  const { evento: salvo } = await requisicaoApi('/events', { method: 'POST', body: novoEvento })
  salvarCache(CHAVE_EVENTOS, [...listarEventos().filter((item) => String(item.id) !== String(salvo.id)), salvo])
  return salvo
}

export async function atualizarEvento(id, novosDados) {
  const eventoAnterior = buscarEventoPorId(id)
  if (!eventoAnterior) throw new Error('Evento não encontrado.')
  const eventoAtualizado = { ...eventoAnterior, ...novosDados }
  const { evento: salvo } = await requisicaoApi(`/events/${encodeURIComponent(id)}`, { method: 'PUT', body: eventoAtualizado })
  salvarCache(CHAVE_EVENTOS, listarEventos().map((item) => String(item.id) === String(id) ? salvo : item))
  return salvo
}

export function excluirEvento(id) {
  salvarCache(CHAVE_EVENTOS, listarEventos().filter((evento) => String(evento.id) !== String(id)))
  sincronizarOperacao(requisicaoApi(`/events/${encodeURIComponent(id)}`, { method: 'DELETE' }), 'exclusão do evento')
}

export async function adicionarItemCusto(eventoId, item) {
  const itemNovo = {
    ...item,
    id: String(item.id || novoId()),
    status: item.status || 'Rascunho',
    valorEstimado: item.valorEstimado === '' || item.valorEstimado == null ? null : Number(item.valorEstimado),
  }
  const { item: salvo } = await requisicaoApi(`/events/${encodeURIComponent(eventoId)}/cost-items`, {
    method: 'POST',
    body: itemNovo,
  })
  salvarCache(CHAVE_EVENTOS, listarEventos().map((evento) => String(evento.id) === String(eventoId)
    ? { ...evento, itensCusto: [...(Array.isArray(evento.itensCusto) ? evento.itensCusto.filter((atual) => String(atual.id) !== String(salvo.id)) : []), salvo] }
    : evento))
  return salvo
}

export async function excluirItemCusto(eventoId, itemId) {
  await requisicaoApi(`/events/${encodeURIComponent(eventoId)}/cost-items/${encodeURIComponent(itemId)}`, { method: 'DELETE' })
  salvarCache(CHAVE_EVENTOS, listarEventos().map((evento) => String(evento.id) === String(eventoId)
    ? { ...evento, itensCusto: (Array.isArray(evento.itensCusto) ? evento.itensCusto : []).filter((item) => String(item.id) !== String(itemId)) }
    : evento))
}
