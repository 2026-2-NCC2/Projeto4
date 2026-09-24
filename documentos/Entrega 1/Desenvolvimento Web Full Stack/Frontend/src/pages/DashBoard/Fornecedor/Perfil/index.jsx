import './style.css'

import { useState } from 'react'

import DashboardLayout from '../../../../layouts/DashboardLayout'
import menuFornecedor from '../menuFornecedor'

function PerfilFornecedor() {
  const [editando, setEditando] = useState(false)

  const [perfil, setPerfil] = useState({
    nome: 'Fornecedor TrocaTicket',
    documento: '00.000.000/0001-00',
    email: 'fornecedor@trocaticket.com',
    telefone: '(11) 99999-9999',
    areaAtuacao: 'Estrutura e eventos',
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

  function salvar(evento) {
    evento.preventDefault()

    setPerfil(formulario)
    setEditando(false)
  }

  return (
    <DashboardLayout
      tipoUsuario="FORNECEDOR"
      statusVerificacao="Conta em verificação"
      itensMenu={menuFornecedor}
    >

      <section className="perfil-fornecedor">

        <div className="cabecalho-perfil-fornecedor">
          <div>
            <h1>Perfil</h1>

            <p>
              Gerencie os dados da sua empresa e acompanhe sua aprovação.
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

        <div className="status-fornecedor">
          <span>Status da conta</span>
          <strong>{perfil.status}</strong>
        </div>

        <form
          className="formulario-perfil-fornecedor"
          onSubmit={salvar}
        >
          <label>Nome / Razão social</label>

          <input
            name="nome"
            value={formulario.nome}
            onChange={alterarCampo}
            disabled={!editando}
          />

          <label>CPF / CNPJ</label>

          <input
            name="documento"
            value={formulario.documento}
            onChange={alterarCampo}
            disabled={!editando}
          />

          <label>E-mail</label>

          <input
            name="email"
            type="email"
            value={formulario.email}
            onChange={alterarCampo}
            disabled={!editando}
          />

          <label>Telefone</label>

          <input
            name="telefone"
            value={formulario.telefone}
            onChange={alterarCampo}
            disabled={!editando}
          />

          <label>Área de atuação</label>

          <input
            name="areaAtuacao"
            value={formulario.areaAtuacao}
            onChange={alterarCampo}
            disabled={!editando}
          />

          {editando && (
            <button
              className="salvar-perfil-fornecedor"
              type="submit"
            >
              Salvar alterações
            </button>
          )}

        </form>

      </section>

    </DashboardLayout>
  )
}

export default PerfilFornecedor