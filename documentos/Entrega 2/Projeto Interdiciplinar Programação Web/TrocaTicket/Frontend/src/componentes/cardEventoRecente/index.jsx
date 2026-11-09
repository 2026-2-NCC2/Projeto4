import './style.css'

/**
 * Card reutilizável de planejamento do evento. Não representa venda real de
 * ingressos nem receita realizada; exibe apenas dados e estimativas de planejamento.
 */
export default function CardEventoRecente({
  status,
  tipoStatus = 'verde',
  porcentagem,
  lote,
  titulo,
  localData,
  publicoMinimo,
  publicoMaximo,
  quantidadeItensCusto = 0,
  ticketEstimado,
  destaqueValor = false,
}) {
  const publico = [publicoMinimo, publicoMaximo].filter((valor) => valor !== undefined && valor !== null && valor !== '').join(' a ')
  const percentualSeguro = Number.isFinite(Number(porcentagem)) ? Math.max(0, Math.min(100, Number(porcentagem))) : null

  return (
    <article className="card-evento-recente">
      <div className="card-evento-topo">
        <span className={`tag-status-evento tag-${tipoStatus}`}>{status || 'Planejamento'}</span>
        {(lote || percentualSeguro !== null) && (
          <div className="info-lote-porcentagem">
            {percentualSeguro !== null && <span className="porcentagem-texto">{percentualSeguro}%</span>}
            {lote && <span className="lote-texto">{lote}</span>}
          </div>
        )}
      </div>

      <div className="card-evento-info">
        <h3 className="titulo-evento">{titulo || 'Evento sem nome'}</h3>
        <p className="local-data-evento">{localData || 'Local e data a definir'}</p>
      </div>

      {percentualSeguro !== null && (
        <div className="trilho-progresso" aria-label={`Progresso do planejamento: ${percentualSeguro}%`}>
          <div className={`barra-progresso barra-${tipoStatus}`} style={{ width: `${percentualSeguro}%` }} />
        </div>
      )}

      <div className="card-evento-rodape">
        <span className="qtd-itens-custo">{Number(quantidadeItensCusto) || 0} serviços requeridos</span>
        {publico && <span className="publico-previsto">Público: {publico} pessoas</span>}
        {ticketEstimado !== undefined && ticketEstimado !== null && (
          <strong className={`ticket-estimado ${destaqueValor ? 'valor-destaque' : ''}`}>
            Ticket estimado: {Number(ticketEstimado).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </strong>
        )}
      </div>
    </article>
  )
}
