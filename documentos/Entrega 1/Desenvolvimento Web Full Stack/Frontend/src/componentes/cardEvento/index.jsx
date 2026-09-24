import './style.css'

import { Link } from 'react-router-dom'
import { CalendarDays, MapPin, Users } from 'lucide-react'

function CardEvento({ evento, aoExcluir }) {
  return (
    <article className="card-evento">

      <div className="topo-card-evento">
        <span className="status-evento">
          {evento.status}
        </span>

        <span className="id-evento">
          #{evento.id}
        </span>
      </div>

      <h2>{evento.nome}</h2>

      <div className="informacoes-evento">

        <span>
          <CalendarDays />
          {evento.dataInicio}
        </span>

        <span>
          <MapPin />
          {evento.local}
        </span>

        <span>
          <Users />
          {evento.publicoMinimo} - {evento.publicoMaximo} pessoas
        </span>

      </div>

      <div className="acoes-card-evento">

        <Link to={`/organizador/eventos/${evento.id}`}>
          Ver detalhes
        </Link>

        <Link to={`/organizador/eventos/${evento.id}/editar`}>
          Editar
        </Link>

        <button
          type="button"
          onClick={() => aoExcluir(evento.id)}
        >
          Excluir
        </button>

      </div>

    </article>
  )
}

export default CardEvento