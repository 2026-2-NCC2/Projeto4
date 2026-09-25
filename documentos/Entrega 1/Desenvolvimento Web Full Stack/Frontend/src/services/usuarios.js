const CHAVE_USUARIOS = 'trocaticket_usuarios'
const CHAVE_SESSAO = 'trocaticket_sessao'

// Usuários e sessão são armazenados no navegador e reutilizados pelas telas do sistema.
export function listarUsuarios() {
  const dados = localStorage.getItem(CHAVE_USUARIOS)

  if (!dados) {
    return []
  }

  return JSON.parse(dados)
}

export function buscarUsuarioPorId(id) {
  return listarUsuarios().find(
    (usuario) => String(usuario.id) === String(id)
  )
}

export function buscarUsuarioPorEmail(email) {
  return listarUsuarios().find(
    (usuario) => usuario.email.toLowerCase() === email.toLowerCase()
  )
}

export function cadastrarUsuario(dados) {
  const usuarios = listarUsuarios()

  const existente = usuarios.find(
    (usuario) =>
      usuario.email.toLowerCase() === dados.email.toLowerCase()
  )

  if (existente) {
    throw new Error('Já existe uma conta cadastrada com este e-mail.')
  }

  const usuario = {
    id: Date.now(),
    ...dados,
    // O cadastro só fica pronto para análise depois que o usuário completa os dados do perfil.
    status: 'INCOMPLETO'
  }

  usuarios.push(usuario)

  localStorage.setItem(
    CHAVE_USUARIOS,
    JSON.stringify(usuarios)
  )

  return usuario
}

export function atualizarUsuario(id, dados) {
  const usuarios = listarUsuarios()

  const atualizados = usuarios.map((usuario) => {
    if (String(usuario.id) === String(id)) {
      return {
        ...usuario,
        ...dados
      }
    }

    return usuario
  })

  localStorage.setItem(
    CHAVE_USUARIOS,
    JSON.stringify(atualizados)
  )

  const usuarioAtualizado = atualizados.find(
    (usuario) => String(usuario.id) === String(id)
  )

  const sessao = obterSessao()

  if (sessao && String(sessao.id) === String(id)) {
    salvarSessao(usuarioAtualizado)
  }

  return usuarioAtualizado
}

export function alterarStatusUsuario(id, status) {
  return atualizarUsuario(id, { status })
}

export function autenticarUsuario(email, senha) {
  const usuario = buscarUsuarioPorEmail(email)

  if (!usuario || usuario.senha !== senha) {
    throw new Error('E-mail ou senha incorretos.')
  }

  // A sessão permite que outras telas identifiquem o usuário conectado.
  salvarSessao(usuario)

  return usuario
}

export function salvarSessao(usuario) {
  localStorage.setItem(
    CHAVE_SESSAO,
    JSON.stringify(usuario)
  )
}

export function obterSessao() {
  const dados = localStorage.getItem(CHAVE_SESSAO)

  if (!dados) {
    return null
  }

  return JSON.parse(dados)
}

export function encerrarSessao() {
  localStorage.removeItem(CHAVE_SESSAO)
}

export function criarAdministradorPadrao() {
  const usuarios = listarUsuarios()

  const existe = usuarios.some(
    (usuario) => usuario.perfil === 'ADMINISTRADOR'
  )

  if (existe) {
    return
  }

  usuarios.push({
    id: 'admin',
    nome: 'Administrador TrocaTicket',
    email: 'admin@trocaticket.com',
    senha: 'admin123',
    perfil: 'ADMINISTRADOR',
    status: 'APROVADO'
  })

  localStorage.setItem(
    CHAVE_USUARIOS,
    JSON.stringify(usuarios)
  )
}