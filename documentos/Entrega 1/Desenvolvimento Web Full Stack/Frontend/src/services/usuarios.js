const CHAVE_USUARIOS = 'trocaticket_usuarios'

export function listarUsuarios() {
  const dados = localStorage.getItem(CHAVE_USUARIOS)

  if (!dados) {
    return []
  }

  return JSON.parse(dados)
}

export function buscarUsuarioPorEmail(email) {
  const usuarios = listarUsuarios()

  return usuarios.find(
    (usuario) => usuario.email === email
  )
}

export function salvarUsuario(usuario) {
  const usuarios = listarUsuarios()

  const novoUsuario = {
    ...usuario,
    id: Date.now(),
    status: 'PENDENTE'
  }

  usuarios.push(novoUsuario)

  localStorage.setItem(
    CHAVE_USUARIOS,
    JSON.stringify(usuarios)
  )

  return novoUsuario
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
}

export function alterarStatusUsuario(id, status) {
  atualizarUsuario(id, { status })
}
export function buscarUsuarioPorId(id) {
  const usuarios = listarUsuarios()

  return usuarios.find(
    (usuario) => String(usuario.id) === String(id)
  )
}