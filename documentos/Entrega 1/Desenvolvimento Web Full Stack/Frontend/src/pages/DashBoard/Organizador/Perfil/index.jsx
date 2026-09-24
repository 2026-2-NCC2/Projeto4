import './style.css'

import { useState } from 'react'

import DashboardLayout from '../../../../layouts/DashboardLayout'
import menuOrganizador from '../menuOrganizador'

function Perfil() {
  const [editando, setEditando] = useState(false)

  const [perfil, setPerfil] = useState({
    nome: 'Organizador TrocaTicket',
    documento: '000.000.000-00',
    email: 'organizador@trocaticket.com',
    telefone: '(11) 99999-9999',
    status: 'PENDENTE'
  })

  const [formulario, setFormulario] = useState(perfil)

  function alterarCampo(evento) {
    const { name, value } = evento.target

    setFormulario({
      ...formulario,
      [name]: value
    })
  }

  function salvarAlteracoes(evento) {
    evento.preventDefault()

    setPerfil(formulario)
    setEditando(false)
  }

  function cancelarEdicao() {
    setFormulario(perfil)
    setEditando(false)
  }

  return (
    <DashboardLayout
      tipoUsuario="ORGANIZADOR"
      statusVerificacao="Conta em verificação"
      itensMenu={menuOrganizador}
    >
      <section className="pagina-perfil">

        <div className="cabecalho-perfil">
          <div>
            <h1>Perfil</h1>

            <p>
              Gerencie seus dados cadastrais e acompanhe sua conta.
            </p>
          </div>

          {!editando && (
            <button
              type="button"
              onClick={() => setEditando(true)}
            >
              Editar dados
            </button>
          )}
        </div>

        <section className="status-conta">
          <div>
            <span>Status da conta</span>
            <strong className="status-pendente">
              {perfil.status}
            </strong>
          </div>

          <p>
            Seu cadastro está aguardando análise da equipe TrocaTicket.
          </p>
        </section>

        <form
          className="formulario-perfil"
          onSubmit={salvarAlteracoes}
        >
          <label htmlFor="nome">
            Nome / Razão social
          </label>

          <input
            id="nome"
            name="nome"
            value={formulario.nome}
            onChange={alterarCampo}
            disabled={!editando}
          />

          <label htmlFor="documento">
            CPF / CNPJ
          </label>

          <input
            id="documento"
            name="documento"
            value={formulario.documento}
            onChange={alterarCampo}
            disabled={!editando}
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
            disabled={!editando}
          />

          <label htmlFor="telefone">
            Telefone
          </label>

          <input
            id="telefone"
            name="telefone"
            value={formulario.telefone}
            onChange={alterarCampo}
            disabled={!editando}
          />

          {editando && (
            <div className="acoes-perfil">
              <button
                type="button"
                onClick={cancelarEdicao}
              >
                Cancelar
              </button>

              <button type="submit">
                Salvar alterações
              </button>
            </div>
          )}

        </form>

      </section>
    </DashboardLayout>
  )
}

export default Perfil