import {
  CHAVE_SESSAO,
  CHAVE_TOKEN,
  CHAVE_USUARIOS,
  CHAVE_FORNECEDORES,
  API_BASE,
  lerCache,
  lerCacheLista,
  salvarCache,
  requisicaoApi,
  sincronizarOperacao,
  limparCachesPrivados,
  limparSessaoLocal,
  notificarTokenAtualizado,
  salvarCacheSessao
} from './api'


export function rotaInicialPorPerfil(perfil, status) {
  const tipo = String(perfil || '').toUpperCase()
  if (tipo === 'ADMINISTRADOR') return '/administrador'
  // Mesmo com cadastro incompleto, o usuário entra primeiro no dashboard;
  // a própria página apresenta o aviso e o atalho para completar o perfil.
  if (tipo === 'ORGANIZADOR') return '/organizador'
  if (tipo === 'FORNECEDOR') return '/fornecedor'
  return '/login'
}

export function listarUsuarios() {
  return lerCacheLista(CHAVE_USUARIOS)
}

export function listarFornecedores() {
  return lerCacheLista(CHAVE_FORNECEDORES)
}

export async function listarFornecedoresDoServidor() {
  const resposta = await requisicaoApi('/suppliers')
  const lista = Array.isArray(resposta?.fornecedores) ? resposta.fornecedores : []
  salvarCache(CHAVE_FORNECEDORES, lista)
  return lista
}

export async function buscarFornecedorDoServidor(id) {
  const resposta = await requisicaoApi(`/suppliers/${encodeURIComponent(id)}`)
  return resposta?.fornecedor || null
}

export function buscarUsuarioPorId(id) {
  return listarUsuarios().find((usuario) => String(usuario.id) === String(id))
}

export function buscarUsuarioPorEmail(email) {
  return listarUsuarios().find((usuario) => usuario.email?.toLowerCase() === email.toLowerCase())
}

export async function cadastrarUsuario(dados) {
  const resposta = await requisicaoApi('/auth/register', {
    method: 'POST',
    body: { nome: dados.nome, email: dados.email, senha: dados.senha, perfil: dados.perfil }
  })
  abrirSessaoAutenticada(resposta)
  salvarCache(CHAVE_USUARIOS, [resposta.usuario])
  // A conta já foi criada e a sessão salva. A sincronização do restante dos dados
  // fica sob responsabilidade da rota protegida, para não bloquear o redirecionamento.
  return resposta.usuario
}

export function atualizarUsuario(id, dados) {
  const usuarios = listarUsuarios()
  const sessao = obterSessao()
  const usuarioAnterior = usuarios.find((usuario) => String(usuario.id) === String(id)) || (String(sessao?.id) === String(id) ? sessao : {})
  const atualizado = { ...usuarioAnterior, ...dados, id }
  const novosUsuarios = usuarios.some((usuario) => String(usuario.id) === String(id))
    ? usuarios.map((usuario) => String(usuario.id) === String(id) ? atualizado : usuario)
    : [...usuarios, atualizado]
  salvarCache(CHAVE_USUARIOS, novosUsuarios)
  if (sessao && String(sessao.id) === String(id)) salvarSessao(atualizado)

  if (sessao && String(sessao.id) === String(id)) {
    const chamada = requisicaoApi('/users/me/profile', { method: 'PATCH', body: dados }).then(({ usuario }) => {
      if (usuario) {
        salvarSessao(usuario)
        const lista = listarUsuarios()
        salvarCache(CHAVE_USUARIOS, lista.map((item) => String(item.id) === String(id) ? usuario : item))
      }
    })
    sincronizarOperacao(chamada, 'perfil do usuário')
  }
  return atualizado
}


export async function atualizarUsuarioNoServidor(id, dados) {
  const sessao = obterSessao()
  if (!sessao || String(sessao.id) !== String(id)) {
    throw new Error('A sessão não corresponde ao usuário que será atualizado.')
  }
  const { usuario } = await requisicaoApi('/users/me/profile', { method: 'PATCH', body: dados })
  salvarSessao(usuario)
  const usuarios = listarUsuarios()
  salvarCache(CHAVE_USUARIOS, usuarios.some((item) => String(item.id) === String(id))
    ? usuarios.map((item) => String(item.id) === String(id) ? usuario : item)
    : [usuario])
  return usuario
}

export async function listarUsuariosDoServidor() {
  const { usuarios } = await requisicaoApi('/admin/users')
  const lista = Array.isArray(usuarios) ? usuarios : []
  salvarCache(CHAVE_USUARIOS, lista)
  return lista
}

export async function alterarStatusUsuarioNoServidor(id, status) {
  const { usuario } = await requisicaoApi(`/admin/users/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    body: { status }
  })
  const lista = listarUsuarios()
  salvarCache(CHAVE_USUARIOS, lista.some((item) => String(item.id) === String(id))
    ? lista.map((item) => String(item.id) === String(id) ? usuario : item)
    : [...lista, usuario])
  return usuario
}

export function alterarStatusUsuario(id, status) {
  const sessao = obterSessao()
  const atualizado = atualizarUsuario(id, { status })
  if (sessao?.perfil === 'ADMINISTRADOR') {
    const chamada = requisicaoApi(`/admin/users/${encodeURIComponent(id)}/status`, {
      method: 'PATCH', body: { status }
    }).then(({ usuario }) => {
      salvarCache(CHAVE_USUARIOS, listarUsuarios().map((item) => String(item.id) === String(id) ? usuario : item))
    })
    sincronizarOperacao(chamada, 'status do cadastro')
  }
  return atualizado
}

export async function autenticarUsuario(email, senha) {
  const resposta = await requisicaoApi('/auth/login', {
    method: 'POST', body: { email, senha }
  })
  abrirSessaoAutenticada(resposta)
  // Não bloquear o login por causa de uma falha na sincronização de dados secundários.
  return resposta.usuario
}

export function salvarSessao(usuario) {
  return salvarCacheSessao(usuario)
}

function abrirSessaoAutenticada(resposta) {
  if (!resposta?.token || !resposta?.usuario?.id) {
    throw new Error('O servidor não retornou uma sessão válida.')
  }

  // A conta nova nunca herda listas em cache da conta que estava aberta antes.
  limparCachesPrivados()
  localStorage.setItem(CHAVE_TOKEN, resposta.token)
  salvarSessao(resposta.usuario)
  notificarTokenAtualizado()
  return resposta.usuario
}


export async function alterarSenhaUsuario(senhaAtual, novaSenha) {
  return requisicaoApi('/users/me/password', {
    method: 'PATCH',
    body: { senhaAtual, novaSenha }
  })
}

export async function enviarDocumento(arquivo) {
  if (!arquivo) throw new Error('Selecione um documento para enviar.')
  const dados = new FormData()
  dados.append('documento', arquivo)
  const resposta = await requisicaoApi('/users/me/document', { method: 'POST', body: dados })
  if (resposta.usuario) {
    salvarSessao(resposta.usuario)
    salvarCache(CHAVE_USUARIOS, [resposta.usuario])
  }
  return resposta.usuario
}

export async function baixarDocumentoUsuario(id, nomeArquivo = 'comprovante') {
  const token = localStorage.getItem(CHAVE_TOKEN)
  const resposta = await fetch(`${API_BASE}/admin/users/${encodeURIComponent(id)}/document`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  if (!resposta.ok) {
    const corpo = await resposta.json().catch(() => ({}))
    throw new Error(corpo.erro || 'Não foi possível abrir o documento.')
  }
  const arquivo = await resposta.blob()
  const url = URL.createObjectURL(arquivo)
  const link = document.createElement('a')
  link.href = url
  link.download = nomeArquivo || 'comprovante'
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export function obterSessao() {
  return lerCache(CHAVE_SESSAO, null)
}

export function encerrarSessao() {
  limparSessaoLocal()
}

export function criarAdministradorPadrao() {
  // A conta administrativa é criada pelo backend, nunca pelo frontend.
}
