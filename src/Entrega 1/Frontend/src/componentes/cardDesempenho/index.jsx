import './style.css'

function CardDesempenho({ titulo, valor, detalhe, destaque = false }) {
  return (
    <article className={`card-desempenho ${destaque ? 'destaque-card' : ''}`}>
      <span>{titulo}</span>
      <strong>{valor}</strong>
      <small>{detalhe}</small>
    </article>
  )
}

export default CardDesempenho