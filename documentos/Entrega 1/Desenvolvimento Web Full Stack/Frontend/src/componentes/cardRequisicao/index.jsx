import './style.css'
import { Link } from 'react-router-dom'

function CardRequisicao({
  id,
  titulo,
  categoria,
  evento,
  status,
  prazo,
  fornecedor
}) {
  return (
    <article className="card-requisicao">
      <span className={`status-requisicao status-${status.toLowerCase()}`}>
        {status}
      </span>

      <h3>{titulo}</h3>

      <span className="categoria-requisicao">
        {categoria}
      </span>

      <p>
        Evento: {evento}
      </p>

      <p>
        Prazo: {prazo}
      </p>

      {fornecedor && (
        <p>
          Fornecedor: {fornecedor}
        </p>
      )}

      <Link to={`/organizador/requisicoes/${id}`}>
        Ver detalhes →
      </Link>
    </article>
  )
}

export default CardRequisicao