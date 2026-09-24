import './style.css'

import {
  Link,
  useParams,
  useNavigate
} from 'react-router-dom'

import DashboardLayout from '../../../../layouts/DashboardLayout'
import menuOrganizador from '../menuOrganizador'

import { buscarEventoPorId } from '../../../../services/eventos'

function DetalheEvento() {
  const { id } = useParams()
  const navigate = useNavigate()
  const evento = buscarEventoPorId(id)

  if (!evento) {
    return (
      <DashboardLayout
        tipoUsuario="ORGANIZADOR"
        statusVerificacao="Conta em verificação"
        itensMenu={menuOrganizador}
      >
        <section className="evento-nao-encontrado">
          <h1>Evento não encontrado</h1>

          <Link to="/organizador/eventos">
            Voltar para eventos
          </Link>
        </section>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      tipoUsuario="ORGANIZADOR"
      statusVerificacao="Conta em verificação"
      itensMenu={menuOrganizador}
    >

      <section className="detalhe-evento">

        <div className="cabecalho-detalhe-evento">

          <div>
            <span className="status-detalhe-evento">
              {evento.status}
            </span>

            <h1>{evento.nome}</h1>

            <p>
              Informações gerais e planejamento do evento.
            </p>
          </div>

          <Link to={`/organizador/eventos/${evento.id}/editar`}>
            Editar evento
          </Link>

        </div>

        <div className="dados-evento">

          <article>
            <span>Período</span>
            <strong>
              {evento.dataInicio} até {evento.dataFim}
            </strong>
          </article>

          <article>
            <span>Local</span>
            <strong>{evento.local}</strong>
          </article>

          <article>
            <span>Público mínimo</span>
            <strong>{evento.publicoMinimo}</strong>
          </article>

          <article>
            <span>Público máximo</span>
            <strong>{evento.publicoMaximo}</strong>
          </article>

          <article>
            <span>Margem de lucro</span>
            <strong>{evento.margemLucro || 0}%</strong>
          </article>

        </div>

        <section className="planejamento-evento">
          <h2>Planejamento</h2>

          <div className="atalhos-planejamento">

            <button
                type="button"
                onClick={() => navigate(`/organizador/eventos/${id}/itens-custo`)}
                >
                Itens de custo
            </button>

            <button type="button">
              Custos adicionais
            </button>

            <button type="button">
              Propostas
            </button>

            <button type="button">
              Orçamento
            </button>

            <button type="button">
              Ticket estimado
            </button>

          </div>
        </section>

      </section>

    </DashboardLayout>
  )
}

export default DetalheEvento