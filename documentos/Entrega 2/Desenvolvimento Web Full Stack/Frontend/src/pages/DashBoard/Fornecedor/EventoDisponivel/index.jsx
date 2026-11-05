import './style.css'
import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Building2, CheckCircle2 } from 'lucide-react'
import DashboardLayout from '../../../../layouts/DashboardLayout'
import menuFornecedor from '../menuFornecedor'
import { buscarEventoPorId, buscarEventoPorIdApi } from '../../../../services/eventos'
import { listarPropostas, listarPropostasServidor } from '../../../../services/propostas'
import { obterSessao } from '../../../../services/usuarios'

function normalizar(texto) { return String(texto || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim() }
function temCorrespondencia(item, termos) {
  const texto = normalizar(`${item.categoria || ''} ${item.descricao || ''}`)
  return termos.some((termo) => termo && (texto.includes(termo) || termo.includes(normalizar(item.categoria))))
}

function EventoDisponivel() {
  const { id } = useParams()
  const usuario = obterSessao() || {}
  const [evento, setEvento] = useState(() => buscarEventoPorId(id))
  const [propostas, setPropostas] = useState(() => listarPropostas())
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    let ativo = true
    Promise.all([buscarEventoPorIdApi(id), listarPropostasServidor()])
      .then(([eventoAtual, lista]) => { if (!ativo) return; setEvento(eventoAtual); setPropostas(Array.isArray(lista) ? lista : []) })
      .catch((e) => { if (ativo) setErro(e.message || 'Não foi possível carregar as informações do evento.') })
      .finally(() => { if (ativo) setCarregando(false) })
    const atualizar = () => setPropostas(listarPropostas())
    window.addEventListener('trocaticket-api-ok', atualizar)
    return () => { ativo = false; window.removeEventListener('trocaticket-api-ok', atualizar) }
  }, [id])

  const itens = Array.isArray(evento?.itensCusto) ? evento.itensCusto : []
  const termos = [usuario.segmento, usuario.areaAtuacao, usuario.categoria, ...(Array.isArray(usuario.produtos) ? usuario.produtos : []), ...(Array.isArray(usuario.servicos) ? usuario.servicos : [])].map(normalizar).filter(Boolean)
  const relevantes = useMemo(() => termos.length ? itens.filter((item) => temCorrespondencia(item, termos)) : [], [itens, usuario.segmento, usuario.areaAtuacao, usuario.categoria])
  const outros = termos.length ? itens.filter((item) => !relevantes.some((r) => String(r.id) === String(item.id))) : itens
  const propostaPorItem = (itemId) => propostas.find((p) => String(p.eventoId ?? p.evento_id) === String(id) && String(p.itemId ?? p.item_id) === String(itemId))

  function cardServico(item) {
    const proposta = propostaPorItem(item.id)
    return <article key={item.id} className="card-oportunidade">
      <span>{item.categoria}</span><h3>{item.descricao}</h3><small>{item.status || 'Aberto para cotação'}</small>
      {item.mostrarOrcamentoFornecedor === true && Number(item.valorEstimado) > 0 && <div className="orcamento-referencia-fornecedor"><span>Orçamento de referência compartilhado pelo organizador</span><strong>{Number(item.valorEstimado).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong><small>É uma referência opcional. Envie seu preço real para este serviço.</small></div>}
      {proposta ? <div className="servico-ja-enviado"><CheckCircle2 size={16}/><span>Você já enviou uma proposta para este serviço.</span><strong>Status: {proposta.status}</strong><Link to="/fornecedor/propostas">Consultar / editar proposta</Link></div> : <Link to={`/fornecedor/criar-proposta?evento=${evento.id}&item=${item.id}`}>Enviar proposta</Link>}
    </article>
  }

  return (
    <DashboardLayout tipoUsuario="FORNECEDOR" itensMenu={menuFornecedor}>
      <section className="pagina-evento-fornecedor">
        <Link className="evento-fornecedor-voltar" to="/fornecedor/procurar-evento"><ArrowLeft size={15}/> Voltar aos eventos</Link>
        {carregando ? <div className="sem-oportunidades">Carregando informações do evento…</div> : !evento ? <section className="evento-fornecedor-inexistente"><h1>Evento não encontrado</h1><p>{erro}</p><Link to="/fornecedor/procurar-evento">Voltar para procurar eventos</Link></section> : <>
          <div className="cabecalho-evento-fornecedor">
            {evento.capa && <img className="cabecalho-evento-fornecedor-capa" src={evento.capa} alt={`Capa de ${evento.nome}`}/>}
            <span>{evento.categoria || evento.status}</span><h1>{evento.nome}</h1><p>{[evento.local, evento.cidade].filter(Boolean).join(' · ')}</p>
            <p>{evento.dataInicio || 'Data a definir'}{evento.dataFim ? ` até ${evento.dataFim}` : ''}</p>
            {evento.organizador?.id && <Link className="ver-organizador-evento" to={`/fornecedor/organizadores/${evento.organizador.id}`}><Building2 size={15}/> Ver perfil do organizador</Link>}
          </div>
          {erro && <p className="aviso-erro-fornecedores" role="alert">{erro}</p>}
          <section className="oportunidades-evento">
            <h2>Serviços requeridos na sua área</h2>
            {relevantes.length ? <div className="lista-oportunidades">{relevantes.map(cardServico)}</div> : <div className="sem-oportunidades">Não identificamos serviços que correspondam diretamente ao seu segmento cadastrado. Confira as outras oportunidades abaixo.</div>}
            <h2 className="titulo-outras-oportunidades">Outros serviços do evento</h2>
            {outros.length ? <div className="lista-oportunidades">{outros.map(cardServico)}</div> : <div className="sem-oportunidades">Não há outros serviços requeridos neste evento.</div>}
          </section>
        </>}
      </section>
    </DashboardLayout>
  )
}
export default EventoDisponivel
