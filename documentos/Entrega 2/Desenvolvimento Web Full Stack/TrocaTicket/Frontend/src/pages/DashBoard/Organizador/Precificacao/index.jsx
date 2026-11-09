import './style.css'

import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  AlertCircle,
  ArrowLeft,
  Calculator,
  CheckCircle2,
  CircleHelp,
  ReceiptText,
  RefreshCw,
  Wallet,
} from 'lucide-react'

import DashboardLayout from '../../../../layouts/DashboardLayout'
import menuOrganizador from '../menuOrganizador'
import { requisicaoApi } from '../../../../services/api'
import { obterSessao } from '../../../../services/usuarios'
import { buscarEventoPorId } from '../../../../services/eventos'

const moeda = (valor) => Number(valor || 0).toLocaleString('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

function CartaoCenario({ titulo, cenario, temCustos }) {
  if (!cenario) {
    return (
      <article className="precificacao-cenario precificacao-cenario-invalido">
        <span className="precificacao-cenario-kicker">{titulo}</span>
        <h2>Dados insuficientes</h2>
        <p>Confira o público, a comissão da TrocaTicket e a margem cadastrados no evento.</p>
      </article>
    )
  }

  return (
    <article className="precificacao-cenario">
      <span className="precificacao-cenario-kicker">{titulo}</span>
      <div className="precificacao-publico"><strong>{cenario.publico.toLocaleString('pt-BR')}</strong><span>participantes</span></div>
      <div className="precificacao-precos">
        <div>
          <span>1º ticket · Cobertura dos custos</span>
          <strong>{temCustos ? moeda(cenario.ticketCoberturaCustos ?? cenario.ticketEquilibrio) : '—'}</strong>
          <small>Inclui a taxa da TrocaTicket; cobre os custos do evento, sem prever lucro para o organizador.</small>
        </div>
        <div className="precificacao-preco-alvo">
          <span>2º ticket · Com margem do organizador</span>
          <strong>{temCustos && cenario.ticketAlvo != null ? moeda(cenario.ticketAlvo) : 'Indisponível'}</strong>
          <small>Inclui os custos, a mesma taxa da TrocaTicket e a margem de lucro desejada pelo organizador.</small>
        </div>
      </div>
      {temCustos && (
        <div className="precificacao-projecao">
          <div><span>Taxa TrocaTicket no ticket de cobertura ({Number(cenario.taxaPlataforma ?? 0).toLocaleString('pt-BR')}%)</span><strong>{moeda(cenario.comissaoCobertura)}</strong></div>
          <div><span>Taxa TrocaTicket no ticket com margem ({Number(cenario.taxaPlataforma ?? 0).toLocaleString('pt-BR')}%)</span><strong>{cenario.comissaoTrocaTicket == null ? '—' : moeda(cenario.comissaoTrocaTicket)}</strong></div>
          <div><span>Receita bruta projetada com o ticket com margem</span><strong>{cenario.receitaEstimada == null ? '—' : moeda(cenario.receitaEstimada)}</strong></div>
          <div><span>Lucro estimado do organizador (após custos e taxa)</span><strong>{cenario.lucroEstimado == null ? '—' : moeda(cenario.lucroEstimado)}</strong></div>
        </div>
      )}
    </article>
  )
}

function PrecificacaoEvento() {
  const { id } = useParams()
  const navigate = useNavigate()
  const usuario = obterSessao()
  const [precificacao, setPrecificacao] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const eventoCache = buscarEventoPorId(id)
  const statusCabecalho = usuario?.status === 'APROVADO'
    ? 'Conta aprovada'
    : usuario?.status === 'PENDENTE'
      ? 'Conta em verificação'
      : usuario?.status === 'REJEITADO'
        ? 'Conta rejeitada'
        : 'Cadastro incompleto'

  const carregar = useCallback(async () => {
    setCarregando(true)
    setErro('')
    try {
      const resposta = await requisicaoApi(`/events/${encodeURIComponent(id)}/pricing`)
      setPrecificacao(resposta.precificacao || null)
    } catch (e) {
      setErro(e.message || 'Não foi possível calcular o ticket deste evento.')
    } finally {
      setCarregando(false)
    }
  }, [id])

  useEffect(() => { carregar() }, [carregar])

  const tituloEvento = precificacao?.eventoNome || eventoCache?.nome || 'Evento'
  const componentes = Array.isArray(precificacao?.componentes) ? precificacao.componentes : []
  const alertas = Array.isArray(precificacao?.alertas) ? precificacao.alertas : []

  return (
    <DashboardLayout tipoUsuario="ORGANIZADOR" statusVerificacao={statusCabecalho} itensMenu={menuOrganizador}>
      <main className="pagina-precificacao-evento">
        <button type="button" className="precificacao-voltar" onClick={() => navigate(`/organizador/eventos/${id}`)}>
          <ArrowLeft size={16} /> Voltar aos detalhes
        </button>

        <header className="precificacao-cabecalho">
          <div className="precificacao-icone-titulo"><Calculator size={23} /></div>
          <div className="precificacao-titulos">
            <span>PLANEJAMENTO FINANCEIRO</span>
            <h1>Valor estimado do ticket</h1>
            <p>{tituloEvento} · um único tipo de ingresso, sem venda ou pagamento pela plataforma.</p>
          </div>
          <button type="button" className="precificacao-atualizar" onClick={carregar} disabled={carregando}>
            <RefreshCw size={15} className={carregando ? 'precificacao-girando' : ''} /> Atualizar cálculo
          </button>
        </header>

        {erro && (
          <div className="precificacao-alerta precificacao-alerta-erro" role="alert">
            <AlertCircle size={18} /><div><strong>Não foi possível carregar a precificação.</strong><span>{erro}</span></div>
          </div>
        )}

        {carregando && !precificacao ? (
          <div className="precificacao-estado"><span className="precificacao-spinner" /><strong>Consolidando custos e propostas...</strong></div>
        ) : precificacao && (
          <>
            <section className="precificacao-resumo">
              <article className="precificacao-total-card">
                <div className="precificacao-total-topo"><span className="precificacao-resumo-icone"><Wallet size={18} /></span><span>CUSTO TOTAL CONSOLIDADO</span></div>
                <strong className="precificacao-valor-total">{moeda(precificacao.totalCustos)}</strong>
                <p>Inclui custos manuais e propostas aceitas, sem contar duas vezes o mesmo item.</p>
              </article>
              <article className="precificacao-resumo-card">
                <span>Margem desejada do organizador</span>
                <strong>{precificacao.margemLucro == null ? '—' : `${Number(precificacao.margemLucro).toLocaleString('pt-BR')}%`}</strong>
                <small>Percentual pretendido sobre a receita bruta.</small>
              </article>
              <article className="precificacao-resumo-card">
                <span>Comissão da TrocaTicket</span>
                <strong>{precificacao.taxaPlataforma == null ? '—' : `${Number(precificacao.taxaPlataforma).toLocaleString('pt-BR')}%`}</strong>
                <small>Definida pelo administrador para este evento.</small>
              </article>
              <article className="precificacao-resumo-card">
                <span>Componentes incluídos</span>
                <strong>{componentes.length}</strong>
                <small>Custos e propostas considerados no cálculo.</small>
              </article>
            </section>

            {alertas.length > 0 && (
              <section className="precificacao-alertas" aria-label="Avisos do cálculo">
                {alertas.map((alerta, indice) => (
                  <div className="precificacao-alerta" key={`${indice}-${alerta}`}>
                    <CircleHelp size={17} /><span>{alerta}</span>
                  </div>
                ))}
              </section>
            )}

            {!precificacao.temCustos && (
              <section className="precificacao-sem-custos">
                <ReceiptText size={23} />
                <div><strong>Adicione valores para calcular o ticket</strong><p>Informe valores estimados para os serviços requeridos ou aceite propostas de fornecedores. As demandas sem valor e as propostas ainda em análise não entram no custo consolidado.</p></div>
                <button type="button" onClick={() => navigate(`/organizador/eventos/${id}/itens-custo`)}>Gerenciar serviços</button>
              </section>
            )}

            <section className="precificacao-cenarios-secao">
              <div className="precificacao-secao-titulo"><div><span>CENÁRIOS DE PÚBLICO</span><h2>Quanto precisaria custar cada ticket?</h2></div><span className="precificacao-badge-regra"><CheckCircle2 size={14} /> Cálculo atualizado pela API</span></div>
              <div className="precificacao-grade-cenarios">
                <CartaoCenario titulo="Cenário de público mínimo" cenario={precificacao.cenarios?.minimo} temCustos={precificacao.temCustos} />
                <CartaoCenario titulo="Cenário de público médio" cenario={precificacao.cenarios?.medio} temCustos={precificacao.temCustos} />
                <CartaoCenario titulo="Cenário de público máximo" cenario={precificacao.cenarios?.maximo} temCustos={precificacao.temCustos} />
              </div>
            </section>

            <section className="precificacao-componentes-secao">
              <div className="precificacao-secao-titulo"><div><span>COMPOSIÇÃO DO ORÇAMENTO</span><h2>Custos consolidados</h2></div><button type="button" onClick={() => navigate(`/organizador/eventos/${id}/itens-custo`)}>Gerenciar serviços</button></div>
              {componentes.length === 0 ? (
                <div className="precificacao-tabela-vazia">Nenhum custo foi incluído até agora.</div>
              ) : (
                <div className="precificacao-tabela-wrap"><table className="precificacao-tabela">
                  <thead><tr><th>Categoria</th><th>Descrição</th><th>Origem</th><th>Valor considerado</th></tr></thead>
                  <tbody>{componentes.map((componente) => <tr key={componente.id}>
                    <td>{componente.categoria || '—'}</td><td>{componente.descricao || '—'}</td>
                    <td><span className={`precificacao-origem ${componente.origem === 'PROPOSTA_ACEITA' ? 'origem-proposta' : 'origem-manual'}`}>{componente.origemRotulo}</span></td>
                    <td className="precificacao-valor-linha">{moeda(componente.valor)}</td>
                  </tr>)}</tbody>
                  <tfoot><tr><th colSpan="3">Total consolidado</th><th>{moeda(precificacao.totalCustos)}</th></tr></tfoot>
                </table></div>
              )}
            </section>

            <section className="precificacao-formula">
              <div className="precificacao-formula-icone"><Calculator size={19} /></div>
              <div><span>FÓRMULAS UTILIZADAS</span><h2>Critério de cálculo</h2>
                <p><strong>1º ticket — cobertura dos custos, incluindo a taxa TrocaTicket:</strong> {precificacao.formulas?.equilibrio}</p>
                <p><strong>2º ticket — cobertura dos custos + taxa TrocaTicket + margem do organizador:</strong> {precificacao.formulas?.alvo}</p>
                <small>{precificacao.formulas?.margem} {precificacao.formulas?.arredondamento}</small>
              </div>
            </section>
          </>
        )}
      </main>
    </DashboardLayout>
  )
}

export default PrecificacaoEvento
