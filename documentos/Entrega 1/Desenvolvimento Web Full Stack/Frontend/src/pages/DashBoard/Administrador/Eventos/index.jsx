import './style.css'

import DashboardLayout from '../../../../layouts/DashboardLayout'
import menuAdministrador from '../menuAdministrador'

import { listarEventos } from '../../../../services/eventos'

function EventosAdministrador() {
  const eventos = listarEventos()

  return (
    <DashboardLayout
      tipoUsuario="ADMINISTRADOR"
      statusVerificacao="Gestão da plataforma"
      itensMenu={menuAdministrador}
    >

      <section className="eventos-administrador">

        <div className="titulo-eventos-administrador">
          <h1>
            Eventos
          </h1>

          <p>
            Consulte os eventos cadastrados na plataforma.
          </p>
        </div>

        {eventos.length === 0 ? (
          <div className="sem-eventos-administrador">
            Nenhum evento cadastrado.
          </div>
        ) : (
          <div className="lista-eventos-administrador">

            {eventos.map((evento) => (
              <article
                key={evento.id}
                className="evento-administrador"
              >

                <div>
                  <span>
                    {evento.status}
                  </span>

                  <h2>
                    {evento.nome}
                  </h2>

                  <p>
                    {evento.local}
                  </p>
                </div>

                <div className="publico-evento-admin">

                  <small>
                    Público
                  </small>

                  <strong>
                    {evento.publicoMinimo} — {evento.publicoMaximo}
                  </strong>

                </div>

              </article>
            ))}

          </div>
        )}

      </section>

    </DashboardLayout>
  )
}

export default EventosAdministrador