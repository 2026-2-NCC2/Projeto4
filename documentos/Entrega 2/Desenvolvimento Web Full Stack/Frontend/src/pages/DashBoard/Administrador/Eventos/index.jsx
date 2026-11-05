import './style.css'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { BadgeCheck, Building2, CalendarDays, Check, Clock3, FileText, ImageOff, MapPin, ReceiptText, RotateCcw, Users, X } from 'lucide-react'
import DashboardLayout from '../../../../layouts/DashboardLayout'
import menuAdministrador from '../menuAdministrador'
import { alterarStatusAprovacaoEvento, listarEventosAdministracao, atualizarTaxaPlataformaEvento } from '../../../../services/eventos'

const moeda = (valor) => Number.isFinite(Number(valor))
  ? Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  : 'Não informado'

const dataHora = (data, hora) => [data, hora].filter(Boolean).join(' às ') || 'Não informado'

function Campo({ titulo, valor }) {
  return (
    <div className="evento-admin-campo">
      <span>{titulo}</span>
      <strong>{valor === 0 ? '0' : (valor || 'Não informado')}</strong>
    </div>
  )
}

function EventosAdministrador() {
  const [eventos, setEventos] = useState([])
  const [aba, setAba] = useState('PENDENTES')
  const [carregando, setCarregando] = useState(true)
  const [atualizandoId, setAtualizandoId] = useState('')
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')
  const [taxas, setTaxas] = useState({})

  const carregarEventos = useCallback(async () => {
    setCarregando(true)
    setErro('')
    try {
      const lista = await listarEventosAdministracao()
      setEventos(Array.isArray(lista) ? lista : [])
      setTaxas(Object.fromEntries((Array.isArray(lista) ? lista : []).map((evento) => [evento.id, String(evento.taxaPlataforma ?? 0)])))
    } catch (e) {
      setErro(e.message || 'Não foi possível carregar os eventos.')
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => { carregarEventos() }, [carregarEventos])

  const pendentes = useMemo(() => eventos.filter((evento) => (evento.statusAprovacao || 'PENDENTE') === 'PENDENTE'), [eventos])
  const verificados = useMemo(() => eventos.filter((evento) => (evento.statusAprovacao || 'PENDENTE') !== 'PENDENTE'), [eventos])
  const exibidos = aba === 'VERIFICADOS' ? verificados : pendentes

  async function salvarTaxa(evento) {
    setAtualizandoId(evento.id); setErro(''); setSucesso('');
    try {
      const atualizado = await atualizarTaxaPlataformaEvento(evento.id, taxas[evento.id] ?? evento.taxaPlataforma ?? 0);
      setEventos((anteriores) => anteriores.map((item) => String(item.id) === String(evento.id) ? atualizado : item));
      setSucesso(`Taxa da TrocaTicket atualizada para ${Number(atualizado.taxaPlataforma || 0).toLocaleString('pt-BR')}% no evento “${evento.nome}”.`);
    } catch (e) { setErro(e.message || 'Não foi possível salvar a taxa da plataforma.'); }
    finally { setAtualizandoId(''); }
  }

  async function definirStatus(evento, status) {
    const rotulos = { APROVADO: 'aprovado', REJEITADO: 'rejeitado', PENDENTE: 'devolvido para análise' }
    setAtualizandoId(evento.id)
    setErro('')
    setSucesso('')
    try {
      const atualizado = await alterarStatusAprovacaoEvento(evento.id, status)
      setEventos((anteriores) => anteriores.map((item) => String(item.id) === String(evento.id) ? atualizado : item))
      setSucesso(`O evento “${evento.nome}” foi ${rotulos[status]}.`)
    } catch (e) {
      setErro(e.message || 'Não foi possível alterar o status do evento.')
    } finally {
      setAtualizandoId('')
    }
  }

  return (
    <DashboardLayout tipoUsuario="ADMINISTRADOR" statusVerificacao="Gestão da plataforma" itensMenu={menuAdministrador}>
      <section className="eventos-administrador">
        <header className="titulo-eventos-administrador">
          <div>
            <h1>Eventos</h1>
            <p>Confira os dados enviados pelos organizadores e gerencie a aprovação de cada evento.</p>
          </div>
          <button className="evento-admin-atualizar" type="button" onClick={carregarEventos} disabled={carregando}>
            Atualizar lista
          </button>
        </header>

        <div className="eventos-admin-abas" role="tablist" aria-label="Filtro de aprovação de eventos">
          <button type="button" role="tab" aria-selected={aba === 'PENDENTES'} className={aba === 'PENDENTES' ? 'ativa' : ''} onClick={() => setAba('PENDENTES')}>
            <Clock3 size={15} /> Para verificar <span>{pendentes.length}</span>
          </button>
          <button type="button" role="tab" aria-selected={aba === 'VERIFICADOS'} className={aba === 'VERIFICADOS' ? 'ativa' : ''} onClick={() => setAba('VERIFICADOS')}>
            <BadgeCheck size={15} /> Verificados <span>{verificados.length}</span>
          </button>
        </div>

        {erro && <div className="evento-admin-alerta erro" role="alert">{erro}</div>}
        {sucesso && <div className="evento-admin-alerta sucesso" role="status">{sucesso}</div>}

        {carregando ? (
          <div className="evento-admin-vazio">Carregando eventos do banco de dados...</div>
        ) : exibidos.length === 0 ? (
          <div className="evento-admin-vazio">{aba === 'PENDENTES' ? 'Não há eventos aguardando verificação.' : 'Ainda não há eventos verificados.'}</div>
        ) : (
          <div className="eventos-admin-lista">
            {exibidos.map((evento) => {
              const status = evento.statusAprovacao || 'PENDENTE'
              const organizador = evento.organizador || {}
              const organizadorAprovado = organizador.status === 'APROVADO'
              const itens = Array.isArray(evento.itensCusto) ? evento.itensCusto : []
              const demandas = Array.isArray(evento.requisicoesFornecedores) ? evento.requisicoesFornecedores : []
              const ocupado = atualizandoId === evento.id
              return (
                <article className="evento-admin-card" key={evento.id}>
                  <div className="evento-admin-cabecalho-card">
                    <div className="evento-admin-capa">
                      {evento.capa ? <img src={evento.capa} alt={`Capa do evento ${evento.nome}`} loading="lazy" /> : <div className="evento-admin-sem-capa"><ImageOff size={24} /><span>Sem capa enviada</span></div>}
                    </div>
                    <div className="evento-admin-resumo">
                      <div className="evento-admin-etiquetas">
                        <span className={`evento-admin-status status-${status.toLowerCase()}`}>{status}</span>
                        <span className="evento-admin-status-planejamento">Planejamento: {evento.status || 'Não informado'}</span>
                      </div>
                      <h2>{evento.nome || 'Evento sem nome'}</h2>
                      <p className="evento-admin-categoria">{evento.categoria || 'Categoria não informada'}</p>
                      <div className="evento-admin-linha-resumo"><CalendarDays size={14} /><span>{dataHora(evento.dataInicio, evento.horaInicio)}{evento.dataFim || evento.horaFim ? ` — ${dataHora(evento.dataFim, evento.horaFim)}` : ''}</span></div>
                      <div className="evento-admin-linha-resumo"><MapPin size={14} /><span>{[evento.local, evento.cidade].filter(Boolean).join(' • ') || 'Local não informado'}</span></div>
                      <div className="evento-admin-linha-resumo"><Users size={14} /><span>Público: {evento.publicoMinimo ?? '—'} a {evento.publicoMaximo ?? '—'} pessoas</span></div>
                    </div>
                  </div>

                  <details className="evento-admin-detalhes" open>
                    <summary><FileText size={15} /> Dados completos do evento</summary>
                    <div className="evento-admin-grade-campos">
                      <Campo titulo="Descrição" valor={evento.descricao} />
                      <Campo titulo="Categoria" valor={evento.categoria} />
                      <Campo titulo="Data e hora de início" valor={dataHora(evento.dataInicio, evento.horaInicio)} />
                      <Campo titulo="Data e hora de término" valor={dataHora(evento.dataFim, evento.horaFim)} />
                      <Campo titulo="Local" valor={evento.local} />
                      <Campo titulo="Cidade" valor={evento.cidade} />
                      <Campo titulo="Público mínimo" valor={evento.publicoMinimo} />
                      <Campo titulo="Público máximo" valor={evento.publicoMaximo} />
                      <Campo titulo="Margem de lucro prevista" valor={`${Number(evento.margemLucro || 0).toLocaleString('pt-BR')}%`} />
                      <Campo titulo="Serviços requeridos" valor={itens.length} />
                      <Campo titulo="Demandas de fornecedores" valor={demandas.length} />
                    </div>

                    <div className="evento-admin-precificacao">
                      <h3><ReceiptText size={16} /> Resumo financeiro estimado</h3>
                      <div className="evento-admin-grade-campos">
                        <Campo titulo="Custo consolidado" valor={evento.precificacao ? moeda(evento.precificacao.totalCustos) : 'Não calculado'} />
                        <Campo titulo="Ticket de cobertura dos custos (público mínimo)" valor={evento.precificacao?.cenarios?.minimo ? moeda(evento.precificacao.cenarios.minimo.ticketCoberturaCustos ?? evento.precificacao.cenarios.minimo.ticketEquilibrio) : 'Dados insuficientes'} />
                        <Campo titulo="Ticket de cobertura dos custos (público máximo)" valor={evento.precificacao?.cenarios?.maximo ? moeda(evento.precificacao.cenarios.maximo.ticketCoberturaCustos ?? evento.precificacao.cenarios.maximo.ticketEquilibrio) : 'Dados insuficientes'} />
                        <Campo titulo="Ticket com margem do organizador (público mínimo)" valor={evento.precificacao?.cenarios?.minimo?.ticketAlvo != null ? moeda(evento.precificacao.cenarios.minimo.ticketAlvo) : 'Indisponível'} />
                        <Campo titulo="Ticket com margem do organizador (público máximo)" valor={evento.precificacao?.cenarios?.maximo?.ticketAlvo != null ? moeda(evento.precificacao.cenarios.maximo.ticketAlvo) : 'Indisponível'} />
                      </div>
                      {Array.isArray(evento.precificacao?.componentes) && evento.precificacao.componentes.length > 0 && (
                        <ul className="evento-admin-financeiro-lista">
                          {evento.precificacao.componentes.map((componente) => (
                            <li key={componente.id}><span>{componente.categoria} — {componente.descricao} <small>({componente.origemRotulo})</small></span><strong>{moeda(componente.valor)}</strong></li>
                          ))}
                        </ul>
                      )}
                      <div className="evento-admin-comissao">
                        <div className="evento-admin-comissao-edicao">
                          <label htmlFor={`taxa-${evento.id}`}>Taxa da TrocaTicket neste evento (%)</label>
                          <div><input id={`taxa-${evento.id}`} type="number" min="0" max={Math.max(0, 99.99 - Number(evento.margemLucro || 0))} step="0.01" value={taxas[evento.id] ?? String(evento.taxaPlataforma ?? 0)} onChange={(e) => setTaxas((anteriores) => ({ ...anteriores, [evento.id]: e.target.value }))}/><button type="button" disabled={ocupado} onClick={() => salvarTaxa(evento)}>{ocupado ? 'Salvando…' : 'Salvar taxa'}</button></div>
                          <small>A taxa da TrocaTicket incide sobre a receita bruta nos dois tickets. O ticket de cobertura paga custos + taxa; o ticket com margem paga custos + a mesma taxa + a margem desejada pelo organizador. A soma da taxa e da margem precisa ser menor que 100%.</small>
                        </div>
                        <div className="evento-admin-comissao-cenarios">
                          {['minimo', 'medio', 'maximo'].map((chave) => { const cenario = evento.comissao?.[chave]; return <div key={chave}><span>Público {chave === 'medio' ? 'médio' : chave}</span><strong>{cenario?.comissaoTrocaTicket != null ? moeda(cenario.comissaoTrocaTicket) : (cenario?.comissaoTicketCobertura != null ? moeda(cenario.comissaoTicketCobertura) : 'Sem projeção')}</strong><small>{cenario ? `${cenario.publico} pessoas · taxa no ticket de cobertura ${moeda(cenario.comissaoTicketCobertura)} · taxa no ticket com margem ${cenario.comissaoTrocaTicket == null ? 'indisponível' : moeda(cenario.comissaoTrocaTicket)} · ticket com margem ${cenario.ticketAlvo == null ? 'indisponível' : moeda(cenario.ticketAlvo)} · lucro estimado do organizador ${cenario.resultadoOrganizador == null ? 'indisponível' : moeda(cenario.resultadoOrganizador)}` : 'Cadastre custos e público para projetar.'}</small></div> })}
                        </div>
                      </div>
                    </div>

                    <div className="evento-admin-organizador">
                      <h3><Building2 size={16} /> Organizador responsável</h3>
                      <div className="evento-admin-grade-campos">
                        <Campo titulo="Nome / razão social" valor={organizador.razaoSocial || organizador.nome} />
                        <Campo titulo="Responsável" valor={organizador.responsavel} />
                        <Campo titulo="E-mail" valor={organizador.email} />
                        <Campo titulo="CPF / CNPJ" valor={organizador.cnpj || organizador.cpf} />
                        <Campo titulo="Telefone" valor={organizador.telefone} />
                        <Campo titulo="Cidade / estado" valor={[organizador.cidade, organizador.estado].filter(Boolean).join(' / ')} />
                        <Campo titulo="Status do cadastro" valor={organizador.status} />
                      </div>
                    </div>

                    <div className="evento-admin-listas-relacionadas">
                      <div>
                        <h3>Demandas de fornecedores</h3>
                        {demandas.length ? <ul>{demandas.map((demanda, indice) => <li key={demanda.id || `${demanda.categoria}-${indice}`}><strong>{demanda.categoria || 'Categoria'}</strong><span>{demanda.descricao || 'Sem descrição'}</span></li>)}</ul> : <p>Nenhuma demanda cadastrada.</p>}
                      </div>
                      <div>
                        <h3>Serviços requeridos</h3>
                        {itens.length ? <ul>{itens.map((item, indice) => <li key={item.id || `${item.categoria}-${indice}`}><strong>{item.categoria || 'Item'}</strong><span>{item.descricao || 'Sem descrição'}{item.valorEstimado != null ? ` • Estimativa: ${moeda(item.valorEstimado)}` : ''}</span></li>)}</ul> : <p>Nenhum serviço requerido cadastrado.</p>}
                      </div>
                    </div>
                  </details>

                  <footer className="evento-admin-acoes">
                    {status !== 'APROVADO' && <button type="button" className="aprovar" disabled={ocupado || !organizadorAprovado} title={!organizadorAprovado ? 'Aprove primeiro o cadastro do organizador.' : 'Aprovar evento'} onClick={() => definirStatus(evento, 'APROVADO')}><Check size={15} /> {ocupado ? 'Salvando...' : 'Aprovar evento'}</button>}
                    {!organizadorAprovado && status !== 'APROVADO' && <span className="evento-admin-salvando">Aprove primeiro o cadastro do organizador para liberar este evento.</span>}
                    {status !== 'REJEITADO' && <button type="button" className="rejeitar" disabled={ocupado} onClick={() => definirStatus(evento, 'REJEITADO')}><X size={15} /> Rejeitar evento</button>}
                    {status !== 'PENDENTE' && <button type="button" className="reanalisar" disabled={ocupado} onClick={() => definirStatus(evento, 'PENDENTE')}><RotateCcw size={15} /> Voltar para análise</button>}
                    {ocupado && <span className="evento-admin-salvando">Atualizando status…</span>}
                  </footer>
                </article>
              )
            })}
          </div>
        )}
      </section>
    </DashboardLayout>
  )
}

export default EventosAdministrador
