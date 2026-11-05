import './style.css'
import '../../../componentes/cardEventoRecente/style.css'

import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import DashboardLayout from '../../../layouts/DashboardLayout'
import CardCadastroPendente from '../../../componentes/cardCadastroPendente'
import CardDesempenho from '../../../componentes/cardDesempenho'
import menuOrganizador from './menuOrganizador'
import { listarEventos, listarEventosServidor } from '../../../services/eventos'
import { listarPropostas, listarPropostasServidor } from '../../../services/propostas'
import { obterSessao } from '../../../services/usuarios'
import { calcularGastosEstimadosOrganizador } from '../../../services/dashboard'

function listaSegura(valor) {
  return Array.isArray(valor) ? valor : []
}

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function Organizador() {
  const usuario = obterSessao()
  const [eventos, setEventos] = useState(() => listaSegura(listarEventos()))
  const [propostas, setPropostas] = useState(() => listaSegura(listarPropostas()))

  useEffect(() => {
    let ativo = true
    async function atualizarDados() {
      const resultados = await Promise.allSettled([listarEventosServidor(), listarPropostasServidor()])
      if (!ativo) return
      if (resultados[0].status === 'fulfilled') setEventos(listaSegura(resultados[0].value))
      else setEventos(listaSegura(listarEventos()))
      if (resultados[1].status === 'fulfilled') setPropostas(listaSegura(resultados[1].value))
      else setPropostas(listaSegura(listarPropostas()))
    }
    atualizarDados()

    const atualizarCache = () => {
      setEventos(listaSegura(listarEventos()))
      setPropostas(listaSegura(listarPropostas()))
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

  const gastosTotais = useMemo(() => calcularGastosEstimadosOrganizador(eventos, propostas), [eventos, propostas])
  const propostasPendentes = propostas.filter((proposta) => String(proposta.status || '').toUpperCase() === 'EM ANÁLISE').length
  const recentes = [...eventos].slice(0, 3)

  return (
    <DashboardLayout
      tipoUsuario="ORGANIZADOR"
      statusVerificacao="Conta em verificação"
      itensMenu={menuOrganizador}
    >
      {usuario?.status === 'INCOMPLETO' && (
        <CardCadastroPendente destinoCadastro="/organizador/completar-cadastro" />
      )}
      {usuario?.status === 'PENDENTE' && (
        <p className="aviso-status-cadastro">Seu cadastro está em análise pela equipe TrocaTicket.</p>
      )}
      {usuario?.status === 'REJEITADO' && (
        <p className="aviso-status-cadastro">Seu cadastro foi rejeitado. Entre em contato com a administração.</p>
      )}

      <section className="desempenho-geral">
        <div className="titulo-secao">
          <h2>Planejamento dos eventos</h2>
          <span className="atualizacao-tempo">Informações relevantes</span>
        </div>
        <div className="cards-desempenho">
          <CardDesempenho titulo="EVENTOS CADASTRADOS" valor={eventos.length} detalhe="Eventos no seu painel" />
          <CardDesempenho
            titulo="GASTOS ESTIMADOS · TODOS OS EVENTOS"
            valor={formatarMoeda(gastosTotais)}
            detalhe="Serviços requeridos e propostas aceitas, sem duplicar valores"
            destaque
          />
          <CardDesempenho titulo="PROPOSTAS PENDENTES" valor={propostasPendentes} detalhe="Aguardando sua análise" />
        </div>
      </section>

      <section className="secao-eventos-recentes">
        <div className="cabecalho-secao-eventos">
          <div>
            <h2 className="titulo-eventos">Meus eventos recentes</h2>
            <p className="subtitulo-eventos">Acompanhe os serviços requeridos e as propostas dos fornecedores.</p>
          </div>
          <Link to="/organizador/eventos" className="botao-ver-todos">Ver todos <span>&rsaquo;</span></Link>
        </div>

        {recentes.length === 0 ? (
          <div className="nenhuma-proposta">
            <p>Você ainda não cadastrou nenhum evento.</p>
            {usuario?.status === 'APROVADO' ? (
              <Link to="/organizador/criar-evento">Criar primeiro evento</Link>
            ) : (
              <p className="aviso-sem-criacao">A opção de criar eventos será liberada após a aprovação do seu cadastro.</p>
            )}
          </div>
        ) : (
          <div className="grid-eventos-recentes">
            {recentes.map((evento) => {
              const propostasEvento = propostas.filter((proposta) => String(proposta.eventoId ?? proposta.evento_id ?? '') === String(evento.id))
              const pendentesEvento = propostasEvento.filter((proposta) => String(proposta.status || '').toUpperCase() === 'EM ANÁLISE').length
              return (
                <article className="card-evento-recente" key={evento.id}>
                  <div className="card-evento-info">
                    <div className="eventos-tags-status">
                      <span className="tag-status-evento tag-azul">{evento.status || 'Planejamento'}</span>
                      {(() => {
                        const statusAprovacao = String(evento.statusAprovacao ?? evento.status_aprovacao ?? 'PENDENTE').toUpperCase()
                        const classeStatus = statusAprovacao === 'APROVADO' ? 'tag-verde' : statusAprovacao === 'REJEITADO' ? 'tag-vermelho' : 'tag-azul'
                        const textoStatus = statusAprovacao === 'APROVADO' ? 'Aprovado pela administração' : statusAprovacao === 'REJEITADO' ? 'Evento rejeitado' : 'Aguardando aprovação'
                        return <span className={`tag-status-evento ${classeStatus}`}>{textoStatus}</span>
                      })()}
                    </div>
                    <h3 className="titulo-evento">{evento.nome}</h3>
                    <p className="local-data-evento">{evento.local || 'Local a definir'}{evento.dataInicio ? ` • ${evento.dataInicio}` : ''}</p>
                  </div>
                  <div className="card-evento-rodape">
                    <span className="qtd-itens-custo">{listaSegura(evento.itensCusto).length} serviços requeridos</span>
                    <span className={`resumo-propostas-evento ${pendentesEvento > 0 ? 'resumo-propostas-pendentes' : ''}`}>
                      {propostasEvento.length === 0 ? 'Nenhuma proposta recebida' : `${propostasEvento.length} ${propostasEvento.length === 1 ? 'proposta recebida' : 'propostas recebidas'}`}
                      {pendentesEvento > 0 && ` · ${pendentesEvento} para analisar`}
                    </span>
                    <Link to={`/organizador/eventos/${evento.id}`}>Abrir evento</Link>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>

      <div className="banner-novo-evento">
        <div className="banner-novo-evento-conteudo">
          <div className="banner-icone-raio">+</div>
          <div>
            <h4 className="banner-titulo">Organize os próximos custos</h4>
            <p className="banner-descricao">Cadastre um evento, organize os serviços requeridos, compare as propostas dos fornecedores e obtenha o preços dos tickets.</p>
          </div>
        </div>
        {usuario?.status === 'APROVADO' ? (
          <Link to="/organizador/criar-evento" className="btn-criar-novo-evento">Criar novo evento <span className="sinal-mais">+</span></Link>
        ) : (
          <Link to={usuario?.status === 'INCOMPLETO' ? '/organizador/completar-cadastro' : '/organizador/perfil'} className="btn-criar-novo-evento">
            {usuario?.status === 'INCOMPLETO' ? 'Completar cadastro' : 'Ver status do cadastro'}
          </Link>
        )}
      </div>
    </DashboardLayout>
  )
}

export default Organizador
