import './style.css'

import {
  Link,
  useParams
} from 'react-router-dom'

import DashboardLayout from '../../../../layouts/DashboardLayout'
import menuFornecedor from '../menuFornecedor'

import { buscarEventoPorId } from '../../../../services/eventos'

function EventoDisponivel() {
  const { id } = useParams()

  const evento = buscarEventoPorId(id)

  if (!evento) {
    return (
      <DashboardLayout
        tipoUsuario="FORNECEDOR"
        statusVerificacao="Conta em verificação"
        itensMenu={menuFornecedor}
      >
        <section className="evento-fornecedor-inexistente">

          <h1>
            Evento não encontrado
          </h1>

          <Link to="/fornecedor/procurar-evento">
            Voltar
          </Link>

        </section>
      </DashboardLayout>
    )
  }

  const itens = evento.itensCusto || []

  return (
    <DashboardLayout
      tipoUsuario="FORNECEDOR"
      statusVerificacao="Conta em verificação"
      itensMenu={menuFornecedor}
    >

      <section className="pagina-evento-fornecedor">

        <div className="cabecalho-evento-fornecedor">

          <span>
            {evento.status}
          </span>

          <h1>
            {evento.nome}
          </h1>

          <p>
            {evento.local}
          </p>

        </div>

        <section className="oportunidades-evento">

          <h2>
            Oportunidades disponíveis
          </h2>

          {itens.length === 0 ? (
            <div className="sem-oportunidades">
              Este evento ainda não possui itens disponíveis para cotação.
            </div>
          ) : (
            <div className="lista-oportunidades">

              {itens.map((item) => (
                <article
                  key={item.id}
                  className="card-oportunidade"
                >

                  <span>
                    {item.categoria}
                  </span>

                  <h3>
                    {item.descricao}
                  </h3>

                  <small>
                    {item.status}
                  </small>

                  <Link
                    to={
                      `/fornecedor/criar-proposta` +
                      `?evento=${evento.id}` +
                      `&item=${item.id}`
                    }
                  >
                    Enviar proposta
                  </Link>

                </article>
              ))}

            </div>
          )}

        </section>

      </section>

    </DashboardLayout>
  )
}

export default EventoDisponivel