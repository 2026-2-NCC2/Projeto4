import './style.css'

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import Cabecalho from '../../componentes/cabecalho'
import Rodape from '../../componentes/rodape'

import {
  cadastrarUsuario,
  salvarSessao
} from '../../services/usuarios'

function Cadastro() {
  const navigate = useNavigate()

  const [perfil, setPerfil] = useState('ORGANIZADOR')

  const [formulario, setFormulario] = useState({
    nome: '',
    email: '',
    senha: '',
    confirmarSenha: ''
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

    if (
      !formulario.nome ||
      !formulario.email ||
      !formulario.senha ||
      !formulario.confirmarSenha
    ) {
      setErro('Preencha todos os campos.')
      return
    }

    if (formulario.senha.length < 8) {
      setErro('A senha deve possuir no mínimo 8 caracteres.')
      return
    }

    if (formulario.senha !== formulario.confirmarSenha) {
      setErro('As senhas não coincidem.')
      return
    }

    try {
      // A conta começa incompleta e a sessão é aberta para continuar o cadastro no perfil escolhido.
      const usuario = cadastrarUsuario({
        nome: formulario.nome,
        email: formulario.email,
        senha: formulario.senha,
        perfil
      })

      salvarSessao(usuario)

      if (perfil === 'ORGANIZADOR') {
        navigate('/organizador/completar-cadastro')
      } else {
        navigate('/fornecedor/completar-cadastro')
      }
    } catch (erroCadastro) {
      setErro(erroCadastro.message)
    }
  }

  return (
    <>
      <Cabecalho
        textoBotao="Voltar"
        destino="/"
      />

      <main className="conteudo-cadastro">

        <section className="card-cadastro">

          <h1>Faça seu cadastro</h1>

          <p>
            Crie sua conta para acessar a plataforma.
          </p>

          <form onSubmit={enviar}>

            <fieldset className="tipo-cadastro">

              <button
                type="button"
                className={
                  perfil === 'ORGANIZADOR'
                    ? 'tipo-ativo'
                    : ''
                }
                onClick={() => setPerfil('ORGANIZADOR')}
              >
                Organizador
              </button>

              <button
                type="button"
                className={
                  perfil === 'FORNECEDOR'
                    ? 'tipo-ativo'
                    : ''
                }
                onClick={() => setPerfil('FORNECEDOR')}
              >
                Fornecedor
              </button>

            </fieldset>

            <label htmlFor="nome">
              Nome
            </label>

            <input
              id="nome"
              name="nome"
              value={formulario.nome}
              onChange={alterarCampo}
              placeholder="Seu nome"
            />

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

            <label htmlFor="confirmarSenha">
              Confirmar senha
            </label>

            <input
              id="confirmarSenha"
              name="confirmarSenha"
              type="password"
              value={formulario.confirmarSenha}
              onChange={alterarCampo}
              placeholder="Confirme sua senha"
            />

            {erro && (
              <p className="erro-senha">
                {erro}
              </p>
            )}

            <button type="submit">
              Cadastrar →
            </button>

          </form>

          <p>
            Já tem uma conta? <a href="/login">Entre agora</a>
          </p>

        </section>

      </main>

      <Rodape />
    </>
  )
}

export default Cadastro