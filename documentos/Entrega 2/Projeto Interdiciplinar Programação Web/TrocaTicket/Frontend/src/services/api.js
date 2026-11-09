export const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3333/api').replace(/\/$/, '')

export const CHAVE_TOKEN = 'trocaticket_token'
export const CHAVE_SESSAO = 'trocaticket_sessao'
export const CHAVE_USUARIOS = 'trocaticket_usuarios'
export const CHAVE_EVENTOS = 'trocaticket_eventos'
export const CHAVE_PROPOSTAS = 'trocaticket_propostas'
export const CHAVE_FORNECEDORES = 'trocaticket_fornecedores'

const CHAVES_CACHE_PRIVADO = [CHAVE_USUARIOS, CHAVE_EVENTOS, CHAVE_PROPOSTAS, CHAVE_FORNECEDORES]
const INTERVALO_CACHE_SINCRONIZACAO = 30_000

export function novoId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function notificarTokenAtualizado() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('trocaticket-token-atualizado'))
}

export function limparCachesPrivados() {
  for (const chave of CHAVES_CACHE_PRIVADO) localStorage.removeItem(chave)
  localStorage.removeItem('trocaticket_api_erro')
  tokenUltimaSincronizacao = null
  horaUltimaSincronizacao = 0
}

export function limparSessaoLocal() {
  localStorage.removeItem(CHAVE_TOKEN)
  localStorage.removeItem(CHAVE_SESSAO)
  limparCachesPrivados()
  sincronizacaoInicialEmAndamento = null
  tokenDaSincronizacao = null
  tokenUltimaSincronizacao = null
  horaUltimaSincronizacao = 0
  notificarTokenAtualizado()
}

export async function requisicaoApi(caminho, opcoes = {}) {
  const token = localStorage.getItem(CHAVE_TOKEN)
  const corpoFormData = typeof FormData !== 'undefined' && opcoes.body instanceof FormData
  const headers = { ...(corpoFormData ? {} : { 'Content-Type': 'application/json' }), ...(opcoes.headers || {}) }
  if (token) headers.Authorization = `Bearer ${token}`

  const metodo = String(opcoes.method || 'GET').toUpperCase()
  let resposta
  try {
    resposta = await fetch(`${API_BASE}${caminho}`, {
      ...opcoes,
      headers,
      body: opcoes.body === undefined ? undefined : corpoFormData ? opcoes.body : JSON.stringify(opcoes.body)
    })
  } catch (erro) {
    console.error(`TrocaTicket: falha de rede em ${metodo} ${API_BASE}${caminho}`, erro)
    throw new Error(`Não foi possível conectar à API (${metodo} ${caminho}). Confira se o backend está rodando em http://localhost:3333 e se o endereço em Frontend/.env está correto.`)
  }

  const texto = await resposta.text()
  let corpo = {}
  try {
    corpo = texto ? JSON.parse(texto) : {}
  } catch {
    corpo = { mensagemBruta: texto }
  }

  if (!resposta.ok) {
    // Uma resposta antiga de uma conta anterior nunca deve encerrar a sessão nova.
    const endpointPublicoDeAutenticacao = /^\/auth\/(login|register)$/.test(caminho)
    if (
      resposta.status === 401 &&
      token &&
      !endpointPublicoDeAutenticacao &&
      localStorage.getItem(CHAVE_TOKEN) === token
    ) {
      limparSessaoLocal()
    }
    const detalhe = corpo.erro || corpo.message || corpo.mensagemBruta?.trim().slice(0, 180)
    throw new Error(`${metodo} ${caminho} (HTTP ${resposta.status}): ${detalhe || 'o servidor recusou a requisição sem informar o motivo.'}`)
  }
  return corpo
}

export function lerCache(chave, fallback = []) {
  try {
    const dados = localStorage.getItem(chave)
    return dados ? JSON.parse(dados) : fallback
  } catch {
    return fallback
  }
}

export function lerCacheLista(chave) {
  const valor = lerCache(chave, [])
  return Array.isArray(valor) ? valor : []
}

export function salvarCache(chave, valor) {
  localStorage.setItem(chave, JSON.stringify(valor))
}

export function salvarCacheSessao(usuario) {
  if (!usuario?.id || !usuario?.perfil) throw new Error('A API não retornou um usuário válido para a sessão.')

  const sessaoAnterior = lerCache(CHAVE_SESSAO, null)
  if (!sessaoAnterior?.id || String(sessaoAnterior.id) !== String(usuario.id)) {
    // Sem uma identidade anterior confiável, também não reutilizamos caches antigos.
    limparCachesPrivados()
  }

  const { senha: _senha, senha_hash: _hash, ...dadosSeguros } = usuario
  salvarCache(CHAVE_SESSAO, dadosSeguros)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('trocaticket-sessao-atualizada', { detail: dadosSeguros }))
  }
  return dadosSeguros
}

export function sincronizarOperacao(promessa, descricao) {
  Promise.resolve(promessa).then(() => {
    localStorage.removeItem('trocaticket_api_erro')
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('trocaticket-api-ok'))
  }).catch((error) => {
    localStorage.setItem('trocaticket_api_erro', error.message || `Falha ao sincronizar ${descricao}.`)
    console.error(`TrocaTicket: falha ao sincronizar ${descricao}:`, error)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('trocaticket-api-erro', { detail: error.message }))
    }
  })
}

// Evita repetir a carga de todas as listas a cada clique de navegação.
let sincronizacaoInicialEmAndamento = null
let tokenDaSincronizacao = null
let tokenUltimaSincronizacao = null
let horaUltimaSincronizacao = 0

export function sincronizarDadosIniciais(usuarioValidado = null) {
  const token = localStorage.getItem(CHAVE_TOKEN)
  if (!token) return Promise.resolve()

  if (sincronizacaoInicialEmAndamento && tokenDaSincronizacao === token) {
    return sincronizacaoInicialEmAndamento
  }
  if (tokenUltimaSincronizacao === token && Date.now() - horaUltimaSincronizacao < INTERVALO_CACHE_SINCRONIZACAO) {
    return Promise.resolve()
  }

  tokenDaSincronizacao = token
  const sincronizacao = (async () => {
    const [resumoUsuario, respostaEventos, respostaPropostas] = await Promise.all([
      usuarioValidado ? Promise.resolve({ usuario: usuarioValidado }) : requisicaoApi('/auth/me'),
      requisicaoApi('/events'),
      requisicaoApi('/proposals')
    ])
    if (localStorage.getItem(CHAVE_TOKEN) !== token) return

    const usuario = resumoUsuario?.usuario
    if (!usuario || !usuario.perfil || !usuario.id) {
      throw new Error('A API não retornou os dados da sessão. Entre novamente na sua conta.')
    }
    salvarCacheSessao(usuario)
    salvarCache(CHAVE_EVENTOS, Array.isArray(respostaEventos?.eventos) ? respostaEventos.eventos : [])
    salvarCache(CHAVE_PROPOSTAS, Array.isArray(respostaPropostas?.propostas) ? respostaPropostas.propostas : [])

    if (usuario.perfil === 'ADMINISTRADOR') {
      const respostaUsuarios = await requisicaoApi('/admin/users')
      if (localStorage.getItem(CHAVE_TOKEN) !== token) return
      salvarCache(CHAVE_USUARIOS, Array.isArray(respostaUsuarios?.usuarios) ? respostaUsuarios.usuarios : [])
    } else {
      salvarCache(CHAVE_USUARIOS, [usuario])
    }

    if (usuario.perfil === 'ORGANIZADOR' || usuario.perfil === 'ADMINISTRADOR') {
      const respostaFornecedores = await requisicaoApi('/suppliers')
      if (localStorage.getItem(CHAVE_TOKEN) !== token) return
      salvarCache(CHAVE_FORNECEDORES, Array.isArray(respostaFornecedores?.fornecedores) ? respostaFornecedores.fornecedores : [])
    } else {
      localStorage.removeItem(CHAVE_FORNECEDORES)
    }

    if (localStorage.getItem(CHAVE_TOKEN) === token) {
      tokenUltimaSincronizacao = token
      horaUltimaSincronizacao = Date.now()
    }
  })()

  sincronizacaoInicialEmAndamento = sincronizacao
  const limparSincronizacao = () => {
    if (sincronizacaoInicialEmAndamento === sincronizacao) {
      sincronizacaoInicialEmAndamento = null
      tokenDaSincronizacao = null
    }
  }
  sincronizacao.then(limparSincronizacao, limparSincronizacao)
  return sincronizacao
}

export async function restaurarSessaoServidor() {
  if (!localStorage.getItem(CHAVE_TOKEN)) return
  try {
    const { usuario } = await requisicaoApi('/auth/me')
    salvarCacheSessao(usuario)
    await sincronizarDadosIniciais(usuario)
    localStorage.removeItem('trocaticket_api_erro')
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('trocaticket-api-ok'))
  } catch (error) {
    localStorage.setItem('trocaticket_api_erro', error.message)
    console.warn('TrocaTicket: não foi possível atualizar o cache inicial:', error.message)
  }
}
