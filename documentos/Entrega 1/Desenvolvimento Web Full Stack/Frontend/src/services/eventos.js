const CHAVE_EVENTOS = 'trocaticket_eventos'

export function listarEventos() {
  const dados = localStorage.getItem(CHAVE_EVENTOS)

  if (!dados) {
    return []
  }

  return JSON.parse(dados)
}

export function buscarEventoPorId(id) {
  const eventos = listarEventos()

  return eventos.find((evento) => String(evento.id) === String(id))
}

export function criarEvento(evento) {
  const eventos = listarEventos()

  const novoEvento = {
    ...evento,
    id: Date.now(),
    status: 'Planejamento'
  }

  eventos.push(novoEvento)

  localStorage.setItem(
    CHAVE_EVENTOS,
    JSON.stringify(eventos)
  )

  return novoEvento
}

export function atualizarEvento(id, novosDados) {
  const eventos = listarEventos()

  const eventosAtualizados = eventos.map((evento) => {
    if (String(evento.id) === String(id)) {
      return {
        ...evento,
        ...novosDados
      }
    }

    return evento
  })

  localStorage.setItem(
    CHAVE_EVENTOS,
    JSON.stringify(eventosAtualizados)
  )
}

export function excluirEvento(id) {
  const eventos = listarEventos()

  const eventosAtualizados = eventos.filter(
    (evento) => String(evento.id) !== String(id)
  )

  localStorage.setItem(
    CHAVE_EVENTOS,
    JSON.stringify(eventosAtualizados)
  )
}
export function adicionarItemCusto(eventoId, item) {
  const eventos = listarEventos()

  const eventosAtualizados = eventos.map((evento) => {
    if (String(evento.id) !== String(eventoId)) {
      return evento
    }

    const itensCusto = evento.itensCusto || []

    const novoItem = {
      ...item,
      id: Date.now(),
      status: 'Rascunho'
    }

    return {
      ...evento,
      itensCusto: [...itensCusto, novoItem]
    }
  })

  localStorage.setItem(
    CHAVE_EVENTOS,
    JSON.stringify(eventosAtualizados)
  )
}

export function excluirItemCusto(eventoId, itemId) {
  const eventos = listarEventos()

  const eventosAtualizados = eventos.map((evento) => {
    if (String(evento.id) !== String(eventoId)) {
      return evento
    }

    const itensCusto = evento.itensCusto || []

    return {
      ...evento,
      itensCusto: itensCusto.filter(
        (item) => String(item.id) !== String(itemId)
      )
    }
  })

  localStorage.setItem(
    CHAVE_EVENTOS,
    JSON.stringify(eventosAtualizados)
  )
}