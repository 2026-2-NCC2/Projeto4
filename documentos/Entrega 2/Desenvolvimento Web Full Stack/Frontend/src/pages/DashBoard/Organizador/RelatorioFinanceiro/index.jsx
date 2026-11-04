import './style.css'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  Calculator,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Download,
  FileText,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Users,
  Wallet,
} from 'lucide-react'

import DashboardLayout from '../../../../layouts/DashboardLayout'
import menuOrganizador from '../menuOrganizador'
import { requisicaoApi } from '../../../../services/api'
import { obterSessao } from '../../../../services/usuarios'

const moeda = (valor) => Number(valor || 0).toLocaleString('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

const numero = (valor) => Number(valor || 0).toLocaleString('pt-BR')

function formatarData(valor) {
  if (!valor) return 'Não informada'
  const texto = String(valor)
  const iso = texto.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`
  const brasileira = texto.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  return brasileira ? texto : texto
}

function calcularTicket(totalCustos, publico, margemPercentual) {
  const total = Number(totalCustos)
  const pessoas = Number(publico)
  const margem = Number(margemPercentual) / 100
  if (!Number.isFinite(total) || total < 0 || !Number.isInteger(pessoas) || pessoas <= 0 || !Number.isFinite(margem) || margem < 0 || margem >= 1) return null
  return {
    equilibrio: Math.ceil((total / pessoas) * 100 - 1e-8) / 100,
    alvo: Math.ceil((total / (pessoas * (1 - margem))) * 100 - 1e-8) / 100,
  }
}

function linkSite(valor) {
  if (!valor) return ''
  return /^https?:\/\//i.test(valor) ? valor : `https://${valor}`
}

function RelatorioFinanceiroEvento() {
  const { id } = useParams()
  const navigate = useNavigate()
  const sessao = obterSessao()
  const statusCabecalho = sessao?.status === 'APROVADO'
    ? 'Conta aprovada'
    : sessao?.status === 'PENDENTE'
      ? 'Conta em verificação'
      : sessao?.status === 'REJEITADO'
        ? 'Conta rejeitada'
        : 'Cadastro incompleto'

  const [relatorio, setRelatorio] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [publicoEsperado, setPublicoEsperado] = useState('')
  const [ticketReferencia, setTicketReferencia] = useState('')

  const carregar = useCallback(async () => {
    setCarregando(true)
    setErro('')
    try {
      const resposta = await requisicaoApi(`/events/${encodeURIComponent(id)}/report`)
      const dados = resposta?.relatorio
      if (!dados?.evento || !dados?.precificacao) throw new Error('O servidor não retornou os dados completos do relatório.')
      setRelatorio(dados)
      const min = Number(dados.evento.publicoMinimo)
      const max = Number(dados.evento.publicoMaximo)
      const esperadoInformado = Number(dados.evento.publicoEsperado)
      const esperadoValido = Number.isInteger(esperadoInformado) && esperadoInformado > 0 && esperadoInformado >= min && esperadoInformado <= max
      const esperado = esperadoValido ? esperadoInformado : (Number.isInteger(min) && Number.isInteger(max) && min > 0 && max >= min ? Math.round((min + max) / 2) : (min > 0 ? min : ''))
      setPublicoEsperado((atual) => atual === '' ? esperado : atual)
      const custos = Number(dados.precificacao.totalCustos || 0)
      const calculo = calcularTicket(custos, esperado, dados.evento.margemLucro)
      setTicketReferencia((atual) => atual === '' && calculo ? calculo.alvo.toFixed(2) : atual)
    } catch (e) {
      setErro(e?.message || 'Não foi possível gerar o relatório financeiro.')
    } finally {
      setCarregando(false)
    }
  }, [id])

  useEffect(() => { carregar() }, [carregar])

  const evento = relatorio?.evento
  const precificacao = relatorio?.precificacao
  const servicos = Array.isArray(relatorio?.servicos) ? relatorio.servicos : []
  const servicosPendentes = Array.isArray(relatorio?.servicosPendentes) ? relatorio.servicosPendentes : []
  const propostasAceitas = Array.isArray(relatorio?.propostasAceitas) ? relatorio.propostasAceitas : []
  const componentes = Array.isArray(precificacao?.componentes) ? precificacao.componentes : []
  const alertas = Array.isArray(precificacao?.alertas) ? precificacao.alertas : []
  const totalCustos = Number(precificacao?.totalCustos || 0)
  const minimo = Number(evento?.publicoMinimo || 0)
  const maximo = Number(evento?.publicoMaximo || 0)
  const margem = Number(evento?.margemLucro || 0)
  const publicoValido = Number.isInteger(Number(publicoEsperado)) && Number(publicoEsperado) > 0
    && Number(publicoEsperado) >= minimo && Number(publicoEsperado) <= maximo
  const ticketValido = Number.isFinite(Number(ticketReferencia)) && Number(ticketReferencia) > 0
  const referencia = useMemo(() => calcularTicket(totalCustos, publicoEsperado, margem), [totalCustos, publicoEsperado, margem])
  const metas = useMemo(() => {
    if (!ticketValido || totalCustos < 0) return null
    const preco = Number(ticketReferencia)
    const fator = 1 - margem / 100
    if (fator <= 0 || margem < 0) return null
    return {
      preco,
      ingressosEquilibrio: Math.ceil(totalCustos / preco),
      ingressosMeta: Math.ceil(totalCustos / (preco * fator)),
      receitaMinima: preco * minimo,
      receitaEsperada: publicoValido ? preco * Number(publicoEsperado) : null,
      receitaMaxima: preco * maximo,
      resultadoEsperado: publicoValido ? (preco * Number(publicoEsperado)) - totalCustos : null,
    }
  }, [ticketValido, ticketReferencia, totalCustos, margem, minimo, maximo, publicoEsperado, publicoValido])

  const consolidado = relatorio?.status === 'CONSOLIDADO'
  const dataGeracao = relatorio?.geradoEm ? new Date(relatorio.geradoEm).toLocaleString('pt-BR') : ''

  return (
    <DashboardLayout tipoUsuario="ORGANIZADOR" statusVerificacao={statusCabecalho} itensMenu={menuOrganizador}>
      <main className="pagina-relatorio-financeiro">
        <div className="relatorio-acoes">
          <button type="button" className="relatorio-botao-secundario" onClick={() => navigate(`/organizador/eventos/${id}`)}>
            <ArrowLeft size={16} /> Voltar ao evento
          </button>
          <div className="relatorio-acoes-direita">
            <button type="button" className="relatorio-botao-secundario" onClick={carregar} disabled={carregando}>
              <RefreshCw size={15} className={carregando ? 'relatorio-girando' : ''} /> Atualizar
            </button>
            <button type="button" className="relatorio-botao-principal" onClick={() => window.print()} disabled={!relatorio}>
              <Download size={16} /> Exportar / imprimir PDF
            </button>
          </div>
        </div>

        {erro && <div className="relatorio-alerta relatorio-alerta-erro" role="alert"><AlertCircle size={18} /><div><strong>Não foi possível gerar o relatório</strong><p>{erro}</p></div></div>}
        {carregando && !relatorio ? (
          <div className="relatorio-carregando"><span className="relatorio-spinner" /><strong>Consolidando orçamento e propostas...</strong></div>
        ) : relatorio && evento ? (
          <div className="relatorio-imprimivel">
            <header className="relatorio-cabecalho">
              {evento.capa ? <img className="relatorio-capa" src={evento.capa} alt={`Capa de ${evento.nome}`} onError={(e) => { e.currentTarget.style.display = 'none' }} /> : <div className="relatorio-capa-vazia"><FileText size={34} /></div>}
              <div className="relatorio-cabecalho-texto">
                <span className="relatorio-sobretitulo">TROCATICKET · PLANEJAMENTO FINANCEIRO</span>
                <h1>Relatório financeiro do evento</h1>
                <h2>{evento.nome || 'Evento sem nome'}</h2>
                <p><MapPin size={14} /> {[evento.local, evento.cidade, evento.estado].filter(Boolean).join(' · ') || 'Local não informado'}</p>
                <p><CalendarDays size={14} /> {formatarData(evento.dataInicio)} até {formatarData(evento.dataFim)}</p>
              </div>
            </header>

            <section className={`relatorio-status ${consolidado ? 'relatorio-status-consolidado' : 'relatorio-status-preliminar'}`}>
              {consolidado ? <CheckCircle2 size={21} /> : <AlertCircle size={21} />}
              <div><strong>{consolidado ? 'Relatório consolidado' : 'Relatório preliminar'}</strong><p>{relatorio.mensagemStatus} {servicosPendentes.length ? `${servicosPendentes.length} serviço(s) ainda precisa(m) de custo definido.` : ''}</p></div>
              <span>{relatorio.servicosComCusto || 0}/{relatorio.totalServicos || 0} serviços com custo</span>
            </section>

            <section className="relatorio-indicadores">
              <article><span><Wallet size={16} /> Custo total considerado</span><strong>{moeda(totalCustos)}</strong><small>Estimativas manuais e propostas aceitas, sem dupla contagem do mesmo serviço.</small></article>
              <article><span><Users size={16} /> Público previsto</span><strong>{numero(minimo)} – {numero(maximo)}</strong><small>Público mínimo e máximo registrados no evento.</small></article>
              <article><span><Calculator size={16} /> Ticket-alvo estimado</span><strong>{referencia && publicoValido ? moeda(referencia.alvo) : '—'}</strong><small>Calculado para o público de referência e margem de {numero(margem)}% sobre a receita.</small></article>
              <article><span><ClipboardCheck size={16} /> Propostas aceitas</span><strong>{propostasAceitas.length}</strong><small>{numero(relatorio.propostasEmAnalise || 0)} proposta(s) ainda em análise.</small></article>
            </section>

            <section className="relatorio-secao">
              <div className="relatorio-secao-cabecalho"><div><span>01 · ORÇAMENTO</span><h2>Composição dos custos</h2></div><strong>{moeda(totalCustos)}</strong></div>
              {componentes.length ? (
                <div className="relatorio-tabela-wrap"><table className="relatorio-tabela"><thead><tr><th>Categoria</th><th>Serviço / descrição</th><th>Origem do custo</th><th>Valor</th></tr></thead><tbody>{componentes.map((item) => <tr key={item.id}><td>{item.categoria || '—'}</td><td>{item.descricao || '—'}</td><td>{item.origemRotulo || (item.origem === 'PROPOSTA_ACEITA' ? 'Proposta aceita' : 'Orçamento de referência do organizador')}</td><td>{moeda(item.valor)}</td></tr>)}</tbody><tfoot><tr><th colSpan="3">Custo total consolidado</th><th>{moeda(totalCustos)}</th></tr></tfoot></table></div>
              ) : <p className="relatorio-vazio">Nenhum custo foi cadastrado. Adicione serviços requeridos ou aceite uma proposta para iniciar a precificação.</p>}
            </section>

            {servicosPendentes.length > 0 && <section className="relatorio-secao relatorio-secao-pendente"><div className="relatorio-secao-cabecalho"><div><span>02 · PENDÊNCIAS</span><h2>Serviços sem custo definido</h2></div><strong>{servicosPendentes.length}</strong></div><p>Este relatório continua preliminar até que cada serviço tenha uma estimativa de custo ou uma proposta aceita.</p><ul>{servicosPendentes.map((servico) => <li key={servico.id}><span>{servico.categoria || 'Serviço'}</span><strong>{servico.descricao}</strong></li>)}</ul><button type="button" className="relatorio-botao-secundario relatorio-acao-na-tela" onClick={() => navigate(`/organizador/eventos/${id}/itens-custo`)}>Definir custos dos serviços</button></section>}

            <section className="relatorio-secao">
              <div className="relatorio-secao-cabecalho"><div><span>03 · METAS DE VENDA</span><h2>Simulador de público e ticket</h2></div><span className="relatorio-tag-simulacao">Projeção, não venda real</span></div>
              <p className="relatorio-explicacao">Ajuste o público esperado e o preço de referência para simular quantos ingressos precisariam ser vendidos para cobrir o orçamento e atingir a margem desejada.</p>
              <div className="relatorio-form-simulacao">
                <label>Público esperado de referência<input type="number" min={minimo || 1} max={maximo || undefined} step="1" value={publicoEsperado} onChange={(e) => setPublicoEsperado(e.target.value === '' ? '' : Number(e.target.value))} /><small>Valor inicial: média do público mínimo e máximo. Faixa do evento: {numero(minimo)} a {numero(maximo)}.</small></label>
                <label>Preço de ingresso de referência (R$)<input type="number" min="0.01" step="0.01" value={ticketReferencia} onChange={(e) => setTicketReferencia(e.target.value)} /><small>O preço inicial é o ticket-alvo estimado para o público de referência.</small></label>
              </div>
              {metas && publicoValido ? (
                <div className="relatorio-metas-grade">
                  <article><span>Ingressos para cobrir os custos</span><strong>{numero(metas.ingressosEquilibrio)}</strong><small>Meta de equilíbrio com o preço informado.</small></article>
                  <article><span>Ingressos para atingir a margem</span><strong>{numero(metas.ingressosMeta)}</strong><small>Meta estimada considerando margem de {numero(margem)}% da receita.</small></article>
                  <article><span>Receita no público esperado</span><strong>{moeda(metas.receitaEsperada)}</strong><small>{numero(publicoEsperado)} ingressos × {moeda(metas.preco)}.</small></article>
                  <article><span>Resultado após custos</span><strong className={metas.resultadoEsperado >= 0 ? 'relatorio-valor-positivo' : 'relatorio-valor-negativo'}>{moeda(metas.resultadoEsperado)}</strong><small>Receita estimada menos o custo total considerado.</small></article>
                </div>
              ) : <p className="relatorio-alerta relatorio-alerta-erro">Informe público esperado entre {numero(minimo)} e {numero(maximo)} e um preço de ingresso maior que zero.</p>}
              {metas && <div className="relatorio-cenarios-venda"><div><span>Cenário mínimo · {numero(minimo)} pessoas</span><strong>{moeda(metas.receitaMinima)}</strong></div><div><span>Cenário esperado · {publicoValido ? numero(publicoEsperado) : '—'} pessoas</span><strong>{publicoValido ? moeda(metas.receitaEsperada) : '—'}</strong></div><div><span>Cenário máximo · {numero(maximo)} pessoas</span><strong>{moeda(metas.receitaMaxima)}</strong></div></div>}
              <p className="relatorio-nota-formula"><strong>Fórmulas:</strong> ticket de equilíbrio = custos ÷ público; ticket-alvo = custos ÷ [público × (1 − margem)]. Os preços são arredondados para cima ao centavo. A simulação considera um único tipo de ingresso e não registra vendas nem pagamentos.</p>
            </section>

            <section className="relatorio-secao">
              <div className="relatorio-secao-cabecalho"><div><span>04 · FORNECEDORES</span><h2>Propostas aceitas e contatos comerciais</h2></div><strong>{propostasAceitas.length}</strong></div>
              {propostasAceitas.length === 0 ? <p className="relatorio-vazio">Ainda não há propostas aceitas. Os contatos comerciais são exibidos depois que o organizador aceita uma proposta.</p> : <div className="relatorio-fornecedores-grade">{propostasAceitas.map((proposta) => { const contato = proposta.contatoFornecedor || {}; const fone = String(contato.whatsapp || contato.telefone || '').replace(/\D/g, '').replace(/^0+/, ''); const telefoneWhatsApp = fone && (fone.startsWith('55') ? fone : `55${fone}`); return <article className="relatorio-fornecedor-card" key={proposta.id}><div className="relatorio-fornecedor-icone"><Building2 size={20} /></div><div className="relatorio-fornecedor-conteudo"><span className="relatorio-fornecedor-estado">PROPOSTA ACEITA · {moeda(proposta.valor)}</span><h3>{contato.razaoSocial || contato.nome || proposta.fornecedor || 'Fornecedor'}</h3><p>{proposta.item || proposta.descricao || 'Serviço contratado'}{proposta.categoria ? ` · ${proposta.categoria}` : ''}</p>{contato.responsavel && <p>Responsável: {contato.responsavel}</p>}{(contato.cidade || contato.estado) && <p><MapPin size={13} /> {[contato.cidade, contato.estado].filter(Boolean).join(' / ')}</p>}<div className="relatorio-fornecedor-links">{contato.email && <a href={`mailto:${contato.email}`}><Mail size={14} /> {contato.email}</a>}{contato.telefone && <a href={`tel:${String(contato.telefone).replace(/[^\d+]/g, '')}`}><Phone size={14} /> {contato.telefone}</a>}{telefoneWhatsApp && <a href={`https://wa.me/${telefoneWhatsApp}`} target="_blank" rel="noreferrer">WhatsApp</a>}{contato.site && <a href={linkSite(contato.site)} target="_blank" rel="noreferrer">Site</a>}</div></div></article> })}</div>}
            </section>

            <footer className="relatorio-rodape"><div><strong>TrocaTicket · Planejamento e precificação de eventos</strong><p>Relatório gerado em {dataGeracao}. Os valores e metas são estimativas baseadas nos dados cadastrados e não representam vendas ou pagamentos efetivos.</p></div><span>{consolidado ? 'ORÇAMENTO CONSOLIDADO' : 'VERSÃO PRELIMINAR'}</span></footer>
          </div>
        ) : null}
      </main>
    </DashboardLayout>
  )
}

export default RelatorioFinanceiroEvento
