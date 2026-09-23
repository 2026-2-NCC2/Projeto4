import './style.css'

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'

import DashboardLayout from '../../../../layouts/DashboardLayout'
import CardEvento from '../../../../componentes/cardEvento'
import menuOrganizador from '../menuOrganizador'

import {
  listarEventos,
  excluirEvento
} from '../../../../services/eventos'

function Eventos() {
  const [eventos, setEventos] = useState(listarEventos())

  function removerEvento(id) {
    const confirmou = window.confirm(
      'Deseja realmente excluir este evento?'
    )

    if (!confirmou) {
      return
    }

    excluirEvento(id)

    setEventos(listarEventos())
  }

  return (
    <DashboardLayout
      tipoUsuario="ORGANIZADOR"
      statusVerificacao="Conta em verificação"
      itensMenu={menuOrganizador}
    >

      <section className="pagina-eventos">

        <div className="cabecalho-pagina-eventos">

          <div>
            <h1>Eventos</h1>

            <p>
              Gerencie seus eventos cadastrados.
            </p>
          </div>

          <Link
            to="/organizador/criar-evento"
            className="botao-novo-evento"
          >
            <Plus />
            Criar Evento
          </Link>

        </div>

        {eventos.length === 0 ? (

          <div className="eventos-vazio">
            <h2>Nenhum evento cadastrado</h2>

            <p>
              Crie seu primeiro evento para começar o planejamento.
            </p>

            <Link to="/organizador/criar-evento">
              Criar primeiro evento
            </Link>
          </div>

        ) : (

          <div className="lista-eventos">

            {eventos.map((evento) => (
              <CardEvento
                key={evento.id}
                evento={evento}
                aoExcluir={removerEvento}
              />
            ))}

          </div>

        )}

      </section>

    </DashboardLayout>
  )
}

export default Eventos