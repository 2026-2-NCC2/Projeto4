import './style.css'

import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  AlertCircle,
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  Image as ImageIcon,
  LayoutGrid,
  MapPin,
  PencilLine,
  Percent,
  ReceiptText,
  Calculator,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Users,
  Wallet,
  Wrench,
} from 'lucide-react'

import DashboardLayout from '../../../../layouts/DashboardLayout'
import menuOrganizador from '../menuOrganizador'
import { buscarEventoPorId, buscarEventoPorIdApi } from '../../../../services/eventos'
import { obterSessao } from '../../../../services/usuarios'

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

function formatarData(valor) {
  if (!valor) return 'Não informada'
  const texto = String(valor).trim()
  const iso = texto.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (iso) return `${iso[3]} ${MESES[Number(iso[2]) - 1] || ''} ${iso[1]}`
  const brasileira = texto.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (brasileira) return `${brasileira[1]} ${MESES[Number(brasileira[2]) - 1] || ''} ${brasileira[3]}`
  return texto
}

function formatarHora(valor) {
  if (!valor) return ''
  return String(valor).slice(0, 5)
}

function formatarNumero(valor) {
  const numero = Number(valor)
  return Number.isFinite(numero) ? numero.toLocaleString('pt-BR') : '—'
}

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function statusAprovacaoInfo(status) {
  const normalizado = String(status || 'PENDENTE').toUpperCase()
  if (normalizado === 'APROVADO') {
    return { rotulo: 'Aprovado pela equipe', classe: 'aprovado', Icone: ShieldCheck, mensagem: 'Este evento está aprovado e pode ser encontrado por fornecedores elegíveis.' }
  }
  if (normalizado === 'REJEITADO') {
    return { rotulo: 'Precisa de ajustes', classe: 'rejeitado', Icone: ShieldAlert, mensagem: 'O evento foi rejeitado na análise. Revise os dados e, se necessário, edite o evento para enviá-lo novamente.' }
  }
  return { rotulo: 'Aguardando análise', classe: 'pendente', Icone: Clock3, mensagem: 'O evento está na fila de análise e ainda não fica disponível para os fornecedores.' }
}

function DetalheEvento() {
  const { id } = useParams()
  const navigate = useNavigate()
  const usuario = obterSessao()
  const statusCabecalho = usuario?.status === 'APROVADO'
    ? 'Conta aprovada'
    : usuario?.status === 'PENDENTE'
      ? 'Conta em verificação'
      : usuario?.status === 'REJEITADO'
        ? 'Conta rejeitada'
        : 'Cadastro incompleto'
  const [evento, setEvento] = useState(() => buscarEventoPorId(id))
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    let cancelado = false
    setCarregando(true)
    setErro('')

    buscarEventoPorIdApi(id)
      .then((eventoAtualizado) => {
        if (cancelado) return
        setEvento(eventoAtualizado || null)
      })
      .catch((erroBusca) => {
        if (cancelado) return
        setErro(erroBusca?.message || 'Não foi possível atualizar os dados do evento.')
        // Mantém a cópia em cache visível se a API estiver temporariamente indisponível.
        setEvento((atual) => atual || buscarEventoPorId(id) || null)
      })
      .finally(() => {
        if (!cancelado) setCarregando(false)
      })

    return () => { cancelado = true }
  }, [id])

  const itensCusto = Array.isArray(evento?.itensCusto) ? evento.itensCusto : []
  const requisicoes = Array.isArray(evento?.requisicoesFornecedores) ? evento.requisicoesFornecedores : []
  const statusAprovacao = statusAprovacaoInfo(evento?.statusAprovacao)
  const IconeStatus = statusAprovacao.Icone
  const totalEstimado = useMemo(() => itensCusto.reduce((total, item) => total + (Number(item?.valorEstimado) || 0), 0), [itensCusto])
  const periodo = `${formatarData(evento?.dataInicio)}${evento?.dataFim ? ` — ${formatarData(evento.dataFim)}` : ''}`
  const horarios = [formatarHora(evento?.horaInicio), formatarHora(evento?.horaFim)].filter(Boolean).join(' — ')

  if (carregando && !evento) {
    return (
      <DashboardLayout tipoUsuario="ORGANIZADOR" statusVerificacao={statusCabecalho} itensMenu={menuOrganizador}>
        <section className="detalhe-evento-estado">
          <div className="detalhe-evento-spinner" />
          <h1>Carregando evento</h1>
          <p>Buscando as informações mais recentes salvas na TrocaTicket.</p>
        </section>
      </DashboardLayout>
    )
  }

  if (!evento) {
    return (
      <DashboardLayout tipoUsuario="ORGANIZADOR" statusVerificacao={statusCabecalho} itensMenu={menuOrganizador}>
        <section className="detalhe-evento-estado detalhe-evento-estado-erro">
          <div className="detalhe-evento-estado-icone"><AlertCircle size={26} /></div>
          <h1>Não foi possível abrir este evento</h1>
          <p>{erro || 'O evento não foi encontrado ou você não tem permissão para visualizá-lo.'}</p>
          <button type="button" onClick={() => navigate('/organizador/eventos')}><ArrowLeft size={16} /> Voltar para meus eventos</button>
        </section>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout tipoUsuario="ORGANIZADOR" statusVerificacao={statusCabecalho} itensMenu={menuOrganizador}>
      <section className="pagina-detalhe-evento">
        <div className="trilha-detalhe-evento">
          <Link to="/organizador/eventos"><ArrowLeft size={15} /> Meus eventos</Link>
          <span>/</span>
          <span>Detalhes</span>
        </div>

        {erro && (
          <div className="aviso-cache-detalhe-evento" role="status">
            <AlertCircle size={16} /> Exibindo os últimos dados disponíveis. A sincronização não foi concluída: {erro}
          </div>
        )}

        <section className={`hero-detalhe-evento ${evento.capa ? 'hero-detalhe-com-capa' : 'hero-detalhe-sem-capa'}`}>
          {evento.capa ? (
            <img
              className="hero-detalhe-imagem"
              src={evento.capa}
              alt={`Capa do evento ${evento.nome}`}
              onError={(e) => { e.currentTarget.style.display = 'none' }}
            />
          ) : (
            <div className="hero-detalhe-arte" aria-hidden="true">
              <span className="hero-arte-orbe hero-arte-orbe-um" />
              <span className="hero-arte-orbe hero-arte-orbe-dois" />
              <Sparkles size={68} strokeWidth={1.1} />
            </div>
          )}
          <div className="hero-detalhe-sombra" />

          <div className="hero-detalhe-topo">
            <div className="hero-detalhe-etiquetas">
              <span className={`etiqueta-status-planejamento ${String(evento.status || '').toLowerCase().includes('cancel') ? 'status-cancelado' : ''}`}>
                <span className="ponto-etiqueta" /> {evento.status || 'Planejamento'}
              </span>
              <span className={`etiqueta-status-aprovacao etiqueta-${statusAprovacao.classe}`}>{statusAprovacao.rotulo}</span>
              {evento.categoria && <span className="etiqueta-categoria-evento">{evento.categoria}</span>}
            </div>
            <Link className="botao-editar-hero-evento" to={`/organizador/eventos/${evento.id}/editar`}>
              <PencilLine size={16} /> Editar evento
            </Link>
          </div>

          <div className="hero-detalhe-conteudo">
            <span className="sobretitulo-hero-evento"><Sparkles size={14} /> VISÃO GERAL DO EVENTO</span>
            <h1>{evento.nome || 'Evento sem nome'}</h1>
            <div className="hero-detalhe-meta">
              <span><MapPin size={16} /> {[evento.local, evento.cidade].filter(Boolean).join(' · ') || 'Local não informado'}</span>
              <span><CalendarDays size={16} /> {periodo}</span>
            </div>
          </div>
        </section>

        <section className="metricas-detalhe-evento" aria-label="Resumo do evento">
          <article className="metrica-detalhe-evento">
            <span className="icone-metrica-detalhe"><Users size={18} /></span>
            <div><small>Público previsto</small><strong>{formatarNumero(evento.publicoMinimo)} – {formatarNumero(evento.publicoMaximo)}</strong><span>pessoas</span></div>
          </article>
          <article className="metrica-detalhe-evento">
            <span className="icone-metrica-detalhe"><ReceiptText size={18} /></span>
            <div><small>Serviços requeridos</small><strong>{itensCusto.length}</strong><span>serviços cadastrados</span></div>
          </article>
          <article className="metrica-detalhe-evento">
            <span className="icone-metrica-detalhe"><Search size={18} /></span>
            <div><small>Demandas de fornecedores</small><strong>{requisicoes.length}</strong><span>solicitações planejadas</span></div>
          </article>
          <article className="metrica-detalhe-evento">
            <span className="icone-metrica-detalhe"><Wallet size={18} /></span>
            <div><small>Custos estimados</small><strong>{totalEstimado > 0 ? formatarMoeda(totalEstimado) : '—'}</strong><span>{totalEstimado > 0 ? 'soma dos valores informados' : 'adicione valores aos itens'}</span></div>
          </article>
        </section>

        <section className="painel-atalhos-detalhe-evento">
          <div className="cabecalho-painel-detalhe">
            <div className="icone-cabecalho-painel"><LayoutGrid size={18} /></div>
            <div><h2>Planejamento e fornecedores</h2><p>Ações principais para organizar o evento, agora em acesso rápido.</p></div>
          </div>
          <div className="grade-atalhos-detalhe-evento">
            <button type="button" className="atalho-detalhe-evento" onClick={() => navigate(`/organizador/eventos/${id}/itens-custo`)}>
              <span className="atalho-icone"><Wrench size={19} /></span><span className="atalho-texto"><strong>Serviços requeridos</strong><small>Definir o que o evento precisa e estimar valores</small></span><ArrowUpRight size={16} className="atalho-seta" />
            </button>
            <button type="button" className="atalho-detalhe-evento" onClick={() => navigate(`/organizador/eventos/${id}/precificacao`)}>
              <span className="atalho-icone"><Calculator size={19} /></span><span className="atalho-texto"><strong>Calcular valor do ticket</strong><small>Ver equilíbrio, margem e cenários de público</small></span><ArrowUpRight size={16} className="atalho-seta" />
            </button>
            <button type="button" className="atalho-detalhe-evento" onClick={() => navigate(`/organizador/eventos/${id}/relatorio`)}>
              <span className="atalho-icone"><FileText size={19} /></span><span className="atalho-texto"><strong>Relatório financeiro</strong><small>Custos, metas de venda e contatos das propostas aceitas</small></span><ArrowUpRight size={16} className="atalho-seta" />
            </button>
            <button type="button" className="atalho-detalhe-evento" onClick={() => navigate('/organizador/propostas')}>
              <span className="atalho-icone"><CheckCircle2 size={19} /></span><span className="atalho-texto"><strong>Propostas recebidas</strong><small>Revisar valores enviados pelos fornecedores</small></span><ArrowUpRight size={16} className="atalho-seta" />
            </button>
            <button type="button" className="atalho-detalhe-evento" onClick={() => navigate('/organizador/procurar')}>
              <span className="atalho-icone"><Users size={19} /></span><span className="atalho-texto"><strong>Procurar fornecedores</strong><small>Encontrar parceiros para os serviços requeridos</small></span><ArrowUpRight size={16} className="atalho-seta" />
            </button>
          </div>
        </section>

        <div className="grade-conteudo-detalhe-evento">
          <div className="coluna-principal-detalhe-evento">
            <section className="painel-detalhe-evento">
              <div className="cabecalho-painel-detalhe">
                <div className="icone-cabecalho-painel"><FileText size={18} /></div>
                <div><h2>Sobre o evento</h2><p>Informações cadastradas pelo organizador.</p></div>
              </div>
              {evento.descricao ? (
                <p className="descricao-completa-evento">{evento.descricao}</p>
              ) : (
                <div className="descricao-vazia-evento"><FileText size={17} /><span>Você ainda não adicionou uma descrição para este evento. Use o botão no topo para completar as informações.</span></div>
              )}
              <div className="detalhes-chave-evento">
                <div className="detalhe-chave-evento"><span>Categoria</span><strong>{evento.categoria || 'Não informada'}</strong></div>
                <div className="detalhe-chave-evento"><span>Margem de lucro planejada</span><strong>{formatarNumero(evento.margemLucro)}%</strong></div>
                <div className="detalhe-chave-evento"><span>Local do evento</span><strong>{evento.local || 'Não informado'}</strong></div>
                <div className="detalhe-chave-evento"><span>Cidade / estado</span><strong>{evento.cidade || 'Não informada'}</strong></div>
              </div>
            </section>

            <section className="painel-detalhe-evento">
              <div className="cabecalho-painel-detalhe">
                <div className="icone-cabecalho-painel"><CalendarDays size={18} /></div>
                <div><h2>Data e programação</h2><p>Período informado para realização do evento.</p></div>
              </div>
              <div className="programacao-detalhe-evento">
                <div className="bloco-programacao-evento">
                  <span className="marcador-programacao marcador-inicio" />
                  <div><small>Início</small><strong>{formatarData(evento.dataInicio)}</strong><span>{formatarHora(evento.horaInicio) || 'Horário não informado'}</span></div>
                </div>
                <div className="linha-programacao-evento" />
                <div className="bloco-programacao-evento">
                  <span className="marcador-programacao marcador-fim" />
                  <div><small>Término</small><strong>{formatarData(evento.dataFim)}</strong><span>{formatarHora(evento.horaFim) || 'Horário não informado'}</span></div>
                </div>
              </div>
              {horarios && <p className="resumo-horarios-evento"><Clock3 size={14} /> Horários cadastrados: {horarios}</p>}
            </section>


          </div>

          <aside className="coluna-lateral-detalhe-evento">
            <section className={`painel-status-detalhe status-painel-${statusAprovacao.classe}`}>
              <div className="painel-status-icone"><IconeStatus size={21} /></div>
              <span className="painel-status-overline">STATUS DA ANÁLISE</span>
              <h2>{statusAprovacao.rotulo}</h2>
              <p>{statusAprovacao.mensagem}</p>
            </section>

            <section className="painel-lateral-detalhe">
              <div className="cabecalho-lateral-detalhe"><h2>Resumo rápido</h2><span><Sparkles size={14} /></span></div>
              <div className="linha-resumo-lateral"><span>Etapa do evento</span><strong>{evento.status || 'Planejamento'}</strong></div>
              <div className="linha-resumo-lateral"><span>Público mínimo</span><strong>{formatarNumero(evento.publicoMinimo)} pessoas</strong></div>
              <div className="linha-resumo-lateral"><span>Público máximo</span><strong>{formatarNumero(evento.publicoMaximo)} pessoas</strong></div>
              <div className="linha-resumo-lateral"><span>Margem de lucro</span><strong>{formatarNumero(evento.margemLucro)}%</strong></div>
              <div className="linha-resumo-lateral"><span>Imagem de capa</span><strong className={evento.capa ? 'texto-estado-ok' : 'texto-estado-aviso'}>{evento.capa ? 'Adicionada' : 'Não adicionada'}</strong></div>
              </section>

            <section className="dica-detalhe-evento">
              <div className="dica-detalhe-icone"><ImageIcon size={18} /></div>
              <div><strong>Deixe seu evento completo</strong><p>Uma boa capa e uma descrição clara ajudam a equipe e os fornecedores a entenderem melhor sua necessidade.</p></div>
            </section>
          </aside>
        </div>
      </section>
    </DashboardLayout>
  )
}

export default DetalheEvento
