import './style.css'

import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Plus,
  Search,
  Calendar,
  MapPin,
  MessageSquareText,
  Wrench,
  Trash2,
  Sparkles,
  ArrowUpRight
} from 'lucide-react'

import DashboardLayout from '../../../../layouts/DashboardLayout'
import menuOrganizador from '../menuOrganizador'
import { listarEventos, listarEventosServidor, excluirEvento } from '../../../../services/eventos'
import { listarPropostas, listarPropostasServidor } from '../../../../services/propostas'
import { obterSessao } from '../../../../services/usuarios'


function Eventos() {
  const usuario = obterSessao()
  const podeCriarEvento = usuario?.status === 'APROVADO'
  // Exibe somente os eventos cadastrados pelo usuário.
  const [eventos, setEventos] = useState(() => Array.isArray(listarEventos()) ? listarEventos() : [])
  const [propostas, setPropostas] = useState(() => Array.isArray(listarPropostas()) ? listarPropostas() : [])

  useEffect(() => {
    let ativo = true
    Promise.allSettled([listarEventosServidor(), listarPropostasServidor()]).then((resultados) => {
      if (!ativo) return
      setEventos(resultados[0].status === 'fulfilled' && Array.isArray(resultados[0].value) ? resultados[0].value : (Array.isArray(listarEventos()) ? listarEventos() : []))
      setPropostas(resultados[1].status === 'fulfilled' && Array.isArray(resultados[1].value) ? resultados[1].value : (Array.isArray(listarPropostas()) ? listarPropostas() : []))
    })
    const atualizarCache = () => {
      setEventos(Array.isArray(listarEventos()) ? listarEventos() : [])
      setPropostas(Array.isArray(listarPropostas()) ? listarPropostas() : [])
    }
    window.addEventListener('trocaticket-api-ok', atualizarCache)
    window.addEventListener('trocaticket-sessao-atualizada', atualizarCache)
    window.addEventListener('storage', atualizarCache)
    return () => {
      ativo = false
      window.removeEventListener('trocaticket-api-ok', atualizarCache)
      window.removeEventListener('trocaticket-sessao-atualizada', atualizarCache)
      window.removeEventListener('storage', atualizarCache)
    }
  }, [])

  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('TODOS')

  function removerEvento(id, nome) {
    const confirmou = window.confirm(`Deseja realmente excluir o evento "${nome}"?`)
    if (!confirmou) return

    excluirEvento(id)
    setEventos(listarEventos())
  }

  // Filtragem combinada por texto e status
  const eventosFiltrados = useMemo(() => {
    return eventos.filter((ev) => {
      const nome = String(ev.nome || '')
      const local = String(ev.local || '')
      const cidade = String(ev.cidade || '')
      const matchTexto =
        nome.toLowerCase().includes(busca.toLowerCase()) ||
        local.toLowerCase().includes(busca.toLowerCase()) ||
        cidade.toLowerCase().includes(busca.toLowerCase())

      if (!matchTexto) return false

      const aprovacao = String(ev.statusAprovacao ?? ev.status_aprovacao ?? 'PENDENTE').toUpperCase()
      const situacao = String(ev.status || '').toUpperCase()
      const cancelado = situacao === 'CANCELADO' || situacao === 'CANCELADA'

      if (filtroStatus === 'TODOS') return true
      if (filtroStatus === 'CONFIRMADOS') return aprovacao === 'APROVADO' && !cancelado
      if (filtroStatus === 'ANALISE') return aprovacao === 'PENDENTE' && !cancelado
      if (filtroStatus === 'RECUSADOS') return aprovacao === 'REJEITADO' || cancelado
      return true
    })
  }, [eventos, busca, filtroStatus])

  // Métricas dos estados de aprovação; rejeição/cancelamento não remove o registro do banco.
  const totalEventos = eventos.length
  const totalConfirmados = eventos.filter((ev) => String(ev.statusAprovacao ?? ev.status_aprovacao ?? 'PENDENTE').toUpperCase() === 'APROVADO' && !['CANCELADO', 'CANCELADA'].includes(String(ev.status || '').toUpperCase())).length
  const totalEmAnalise = eventos.filter((ev) => String(ev.statusAprovacao ?? ev.status_aprovacao ?? 'PENDENTE').toUpperCase() === 'PENDENTE' && !['CANCELADO', 'CANCELADA'].includes(String(ev.status || '').toUpperCase())).length
  const totalRecusados = eventos.filter((ev) => String(ev.statusAprovacao ?? ev.status_aprovacao ?? 'PENDENTE').toUpperCase() === 'REJEITADO' || ['CANCELADO', 'CANCELADA'].includes(String(ev.status || '').toUpperCase())).length
  const propostasParaVerificar = propostas.filter((proposta) => String(proposta.status || '').toUpperCase() === 'EM ANÁLISE').length
  const totalServicos = eventos.reduce((acc, ev) => acc + (Array.isArray(ev.itensCusto) ? ev.itensCusto.length : 0), 0)

  return (
    <DashboardLayout
      tipoUsuario="ORGANIZADOR"
      statusVerificacao="Conta em verificação"
      itensMenu={menuOrganizador}
    >
      <div className="pagina-eventos-container">
        {/* Topo / Header */}
        <header className="cabecalho-eventos">

          {podeCriarEvento ? (
            <Link to="/organizador/criar-evento" className="btn-criar-evento-topo">
              <Plus size={16} />
              <span>Criar Novo Evento</span>
            </Link>
          ) : (
            <p className="aviso-status-cadastro">A criação de eventos fica disponível após a aprovação do seu cadastro.</p>
          )}
        </header>

        {/* Barra de Métricas Rápidas */}
        <section className="metricas-resumo-eventos">
          <div className="card-metrica-rapida">
            <div className="metrica-icone-box">
              <Calendar size={18} />
            </div>
            <div>
              <span className="label-metrica">Eventos Cadastrados</span>
              <strong className="valor-metrica">{totalEventos}</strong>
            </div>
          </div>

          <div className="card-metrica-rapida">
            <div className="metrica-icone-box">
              <MessageSquareText size={18} />
            </div>
            <div>
              <span className="label-metrica">Propostas recebidas para verificar</span>
              <strong className="valor-metrica">{propostasParaVerificar.toLocaleString('pt-BR')}</strong>
            </div>
          </div>

          <div className="card-metrica-rapida">
            <div className="metrica-icone-box">
              <Wrench size={18} />
            </div>
            <div>
              <span className="label-metrica">Serviços requeridos</span>
              <strong className="valor-metrica destaque-verde">{totalServicos.toLocaleString('pt-BR')}</strong>
            </div>
          </div>
        </section>

        {/* Filtros e Barra de Pesquisa */}
        <div className="toolbar-filtros-eventos">
          <div className="campo-pesquisa-eventos">
            <Search size={15} />
            <input
              type="text"
              placeholder="Buscar por nome do evento, local ou cidade..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>

          <div className="botoes-abas-filtro">
            <button
              type="button"
              className={filtroStatus === 'TODOS' ? 'aba-ativa' : ''}
              onClick={() => setFiltroStatus('TODOS')}
            >
              Todos ({totalEventos})
            </button>
            <button
              type="button"
              className={filtroStatus === 'CONFIRMADOS' ? 'aba-ativa' : ''}
              onClick={() => setFiltroStatus('CONFIRMADOS')}
            >
              Eventos confirmados (aprovados) ({totalConfirmados})
            </button>
            <button
              type="button"
              className={filtroStatus === 'ANALISE' ? 'aba-ativa' : ''}
              onClick={() => setFiltroStatus('ANALISE')}
            >
              Eventos em análise ({totalEmAnalise})
            </button>
            <button
              type="button"
              className={filtroStatus === 'RECUSADOS' ? 'aba-ativa' : ''}
              onClick={() => setFiltroStatus('RECUSADOS')}
            >
              Eventos recusados/cancelados ({totalRecusados})
            </button>
          </div>
        </div>

        {/* Lista de Cards de Eventos */}
        {eventosFiltrados.length === 0 ? (
          <div className="eventos-vazio-card">
            <div className="icone-vazio-circulo">
              <Calendar size={32} />
            </div>
            <h2>Nenhum evento encontrado</h2>
            <p>Não encontramos produções correspondentes aos filtros aplicados.</p>
            {podeCriarEvento && <Link to="/organizador/criar-evento" className="btn-vazio-novo-evento"><Plus size={16} /> Criar um Evento Agora</Link>}
          </div>
        ) : (
          <div className="grid-cards-meus-eventos">
            {eventosFiltrados.map((evento) => {
              const publicoMinimo = Number(evento.publicoMinimo) || 0
              const capMax = Number(evento.publicoMaximo) || 0
              const propostasEvento = propostas.filter((proposta) => String(proposta.eventoId ?? proposta.evento_id ?? '') === String(evento.id))
              const propostasPendentesEvento = propostasEvento.filter((proposta) => String(proposta.status || '').toUpperCase() === 'EM ANÁLISE').length

              return (
                <div key={evento.id} className="card-evento-gestao">
                  {/* Capa com Badges */}
                  <div className="capa-evento-box">
                    {evento.capa ? (
                      <img src={evento.capa} alt={evento.nome} className="imagem-capa-evento" />
                    ) : (
                      <div className="placeholder-capa-evento">
                        <Sparkles size={24} />
                      </div>
                    )}

                    <div className="overlay-capa-gradiente" />

                    <div className="tags-sobre-capa">
                      <span className="badge-tag-status">
                        <span className="ponto-status" />
                        {evento.status || 'Planejamento'}
                      </span>

                      {evento.categoria && (
                        <span className="badge-tag-categoria">{evento.categoria}</span>
                      )}
                      <span className="badge-tag-categoria">Aprovação: {evento.statusAprovacao ?? evento.status_aprovacao ?? 'PENDENTE'}</span>
                    </div>
                  </div>

                  {/* Conteúdo do Card */}
                  <div className="corpo-card-evento">
                    <div className="cabecalho-card-titulo">
                      <h3 className="titulo-card-evento">{evento.nome}</h3>
                    </div>

                    <div className="detalhes-local-data">
                      <div className="item-detalhe">
                        <Calendar size={13} />
                        <span>{evento.dataInicio}</span>
                      </div>
                      <div className="item-detalhe">
                        <MapPin size={13} />
                        <span>{evento.local} {evento.cidade ? `• ${evento.cidade}` : ''}</span>
                      </div>
                    </div>

                    <div className="bloco-resumo-publico">
                      <div className="info-numeros-publico">
                        <span className="label-publico">Público previsto:</span>
                        <strong className="qtd-publico-bold">
                          {publicoMinimo.toLocaleString('pt-BR')} a {capMax.toLocaleString('pt-BR')} pessoas
                        </strong>
                      </div>
                    </div>

                    {/* Rodapé do Card: Demandas e Ações */}
                    <div className="rodape-card-evento">
                      <div className="badge-propostas-fornecedores" title="Propostas enviadas pelos fornecedores" aria-live="polite">
                        <MessageSquareText size={14} />
                        <span>{propostasEvento.length === 0 ? 'Nenhuma proposta recebida' : `${propostasEvento.length} ${propostasEvento.length === 1 ? 'proposta recebida' : 'propostas recebidas'}`}</span>
                        {propostasPendentesEvento > 0 && (
                          <span className="badge-propostas-pendentes">{propostasPendentesEvento} para analisar</span>
                        )}
                      </div>

                      <div className="acoes-card-evento">
                        <button
                          type="button"
                          className="btn-acao-excluir"
                          onClick={() => removerEvento(evento.id, evento.nome)}
                          title="Excluir evento"
                        >
                          <Trash2 size={15} />
                        </button>

                        <Link
                          to={`/organizador/eventos/${evento.id}`}
                          className="btn-gerenciar-evento"
                        >
                          Gerenciar
                          <ArrowUpRight size={14} />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default Eventos