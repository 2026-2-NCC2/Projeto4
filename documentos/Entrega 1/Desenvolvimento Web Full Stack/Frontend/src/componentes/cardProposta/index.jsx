import './style.css'

import {
  CalendarDays,
  DollarSign
} from 'lucide-react'

function CardProposta({ proposta, aoExcluir }) {
  return (
    <article className="card-proposta">

      <div className="topo-proposta">
        <span className="status-proposta">
          {proposta.status}
        </span>

        <small>
          #{proposta.id}
        </small>
      </div>

      <h2>{proposta.evento}</h2>

      <span className="item-proposta">
        {proposta.item}
      </span>

      <div className="dados-proposta">

        <span>
          <DollarSign />
          R$ {Number(proposta.valor).toLocaleString('pt-BR', {
            minimumFractionDigits: 2
          })}
        </span>

        <span>
          <CalendarDays />
          Validade: {proposta.validade}
        </span>

      </div>

      <p>
        {proposta.descricao}
      </p>

      {aoExcluir && (
        <button
          type="button"
          onClick={() => aoExcluir(proposta.id)}
        >
          Cancelar proposta
        </button>
      )}

    </article>
  )
}

export default CardProposta