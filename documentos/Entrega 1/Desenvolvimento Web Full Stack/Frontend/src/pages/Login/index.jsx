import './style.css'

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import Cabecalho from '../../componentes/cabecalho'
import Rodape from '../../componentes/rodape'

import { autenticarUsuario } from '../../services/usuarios'

function Login() {
  const navigate = useNavigate()

  const [formulario, setFormulario] = useState({
    email: '',
    senha: ''
  })

  const [erro, setErro] = useState('')

  function alterarCampo(evento) {
    const { name, value } = evento.target

    setFormulario({
      ...formulario,
      [name]: value
    })
  }

  function enviar(evento) {
    evento.preventDefault()

    if (!formulario.email || !formulario.senha) {
      setErro('Informe o e-mail e a senha.')
      return
    }

    try {
      const usuario = autenticarUsuario(
        formulario.email,
        formulario.senha
      )

      // O perfil define a área inicial; contas ainda incompletas vão primeiro ao formulário de dados.
      if (usuario.perfil === 'ADMINISTRADOR') {
        navigate('/administrador')
        return
      }

      if (usuario.perfil === 'ORGANIZADOR') {
        if (usuario.status === 'INCOMPLETO') {
          navigate('/organizador/completar-cadastro')
          return
        }

        navigate('/organizador')
        return
      }

      if (usuario.perfil === 'FORNECEDOR') {
        if (usuario.status === 'INCOMPLETO') {
          navigate('/fornecedor/completar-cadastro')
          return
        }

        navigate('/fornecedor')
      }
    } catch (erroLogin) {
      setErro(erroLogin.message)
    }
  }

  return (
    <div className="login">

      <Cabecalho
        textoBotao="Voltar"
        destino="/"
      />

      <main className="conteudo-login">

        <section className="card-login">

          <h1>Entrar na conta</h1>

          <p>
            Entre com suas credenciais para acessar sua conta.
          </p>

          <form onSubmit={enviar}>

            <label htmlFor="email">
              E-mail
            </label>

            <input
              id="email"
              name="email"
              type="email"
              value={formulario.email}
              onChange={alterarCampo}
              placeholder="seu@email.com"
            />

            <label htmlFor="senha">
              Senha
            </label>

            <input
              id="senha"
              name="senha"
              type="password"
              value={formulario.senha}
              onChange={alterarCampo}
              placeholder="Sua senha"
            />

            {erro && (
              <p className="erro-login">
                {erro}
              </p>
            )}

            <button type="submit">
              Entrar →
            </button>

          </form>

          <p>
            Ainda não tem conta?{' '}
            <a href="/cadastro">
              Cadastre-se
            </a>
          </p>

        </section>

      </main>

      <Rodape />

    </div>
  )
}

export default Login