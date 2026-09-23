import './style.css'

import DashboardLayout from '../../../layouts/DashboardLayout'
import CardDesempenho from '../../../componentes/cardDesempenho'

import menuAdministrador from './menuAdministrador'

import { listarUsuarios } from '../../../services/usuarios'
import { listarEventos } from '../../../services/eventos'
import { listarPropostas } from '../../../services/propostas'

function Administrador() {
  const usuarios = listarUsuarios()
  const eventos = listarEventos()
  const propostas = listarPropostas()

  const pendentes = usuarios.filter(
    (usuario) => usuario.status === 'PENDENTE'
  )

  return (
    <DashboardLayout
      tipoUsuario="ADMINISTRADOR"
      statusVerificacao="Gestão da plataforma"
      itensMenu={menuAdministrador}
    >

      <section className="dashboard-administrador">

        <div className="titulo-administrador">

          <div>
            <h1>
              Visão Administrativa
            </h1>

            <p>
              Acompanhe os principais dados da plataforma.
            </p>
          </div>

        </div>

        <div className="cards-administrador">

          <CardDesempenho
            titulo="Cadastros pendentes"
            valor={pendentes.length}
            detalhe="Aguardando análise"
          />

          <CardDesempenho
            titulo="Eventos"
            valor={eventos.length}
            detalhe="Eventos cadastrados"
          />

          <CardDesempenho
            titulo="Propostas"
            valor={propostas.length}
            detalhe="Propostas registradas"
            destaque
          />

        </div>

      </section>

    </DashboardLayout>
  )
}

export default Administrador