import './style.css'

import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Search,
  MapPin,
  CalendarDays
} from 'lucide-react'

import DashboardLayout from '../../../../layouts/DashboardLayout'
import menuFornecedor from '../menuFornecedor'

import { listarEventos } from '../../../../services/eventos'

function ProcurarEvento() {
  const [busca, setBusca] = useState('')

  const eventos = listarEventos()

  const resultado = eventos.filter((evento) => {
    const texto = busca.toLowerCase()

    return (
      evento.nome.toLowerCase().includes(texto) ||
      evento.local.toLowerCase().includes(texto)
    )
  })

  return (
    <DashboardLayout
      tipoUsuario="FORNECEDOR"
      statusVerificacao="Conta em verificação"
      itensMenu={menuFornecedor}
    >

      <section className="pagina-procurar-evento">

        <div className="titulo-procurar-evento">
          <h1>Procurar Evento</h1>

          <p>
            Encontre eventos disponíveis para cotação.
          </p>
        </div>

        <div className="busca-evento">

          <Search />

          <input
            type="search"
            value={busca}
            onChange={(evento) => setBusca(evento.target.value)}
            placeholder="Pesquisar evento ou local"
          />

        </div>

        {resultado.length === 0 ? (
          <div className="nenhum-evento-disponivel">
            Nenhum evento disponível.
          </div>
        ) : (
          <div className="eventos-disponiveis">

            {resultado.map((evento) => (
              <article
                key={evento.id}
                className="evento-disponivel"
              >

                <span>
                  {evento.status}
                </span>

                <h2>
                  {evento.nome}
                </h2>

                <p>
                  <MapPin />
                  {evento.local}
                </p>

                <p>
                  <CalendarDays />
                  {evento.dataInicio}
                </p>

                <Link
                  to={`/fornecedor/eventos/${evento.id}`}
                >
                  Ver oportunidades
                </Link>

              </article>
            ))}

          </div>
        )}

      </section>

    </DashboardLayout>
  )
}

export default ProcurarEvento