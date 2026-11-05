import './style.css'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, MapPin, CalendarDays, Building2 } from 'lucide-react'
import DashboardLayout from '../../../../layouts/DashboardLayout'
import menuFornecedor from '../menuFornecedor'
import { listarEventos, listarEventosServidor } from '../../../../services/eventos'

function ProcurarEvento() {
  const [busca, setBusca] = useState('')
  const [eventos, setEventos] = useState(() => listarEventos())
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    let ativo = true
    listarEventosServidor().then((lista) => { if (ativo) setEventos(Array.isArray(lista) ? lista : []) }).catch((e) => { if (ativo) setErro(e.message || 'Não foi possível carregar as oportunidades.') }).finally(() => { if (ativo) setCarregando(false) })
    const atualizar = () => setEventos(listarEventos())
    window.addEventListener('trocaticket-api-ok', atualizar)
    return () => { ativo = false; window.removeEventListener('trocaticket-api-ok', atualizar) }
  }, [])

  const texto = busca.trim().toLocaleLowerCase('pt-BR')
  const resultado = eventos.filter((evento) => [evento.nome, evento.local, evento.cidade, evento.categoria].some((v) => String(v || '').toLocaleLowerCase('pt-BR').includes(texto)))

  return (
    <DashboardLayout tipoUsuario="FORNECEDOR" itensMenu={menuFornecedor}>
      <section className="pagina-procurar-evento">
        <div className="titulo-procurar-evento"><h1>Procurar eventos</h1><p>Encontre oportunidades aprovadas e consulte os serviços requeridos pelos organizadores.</p></div>
        <div className="busca-evento"><Search/><input type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Pesquisar evento, categoria ou local"/></div>
        {erro && <p className="aviso-erro-fornecedores" role="alert">{erro}</p>}
        {carregando ? <div className="nenhum-evento-disponivel">Carregando eventos disponíveis…</div> : resultado.length === 0 ? <div className="nenhum-evento-disponivel">Nenhum evento disponível para cotação.</div> : (
          <div className="eventos-disponiveis">{resultado.map((evento) => <article key={evento.id} className="evento-disponivel">
            {evento.capa && <img className="evento-disponivel-capa" src={evento.capa} alt={`Capa do evento ${evento.nome}`}/>}
            <span>{evento.categoria || 'Evento'}</span><h2>{evento.nome}</h2>
            <p><MapPin/>{[evento.local, evento.cidade].filter(Boolean).join(' · ') || 'Local a definir'}</p>
            <p><CalendarDays/>{evento.dataInicio || 'Data a definir'}{evento.dataFim ? ` até ${evento.dataFim}` : ''}</p>
            <p><Building2/>Organizador: {evento.organizador?.nome || 'Organizador verificado'}</p>
            <Link to={`/fornecedor/eventos/${evento.id}`}>Ver informações e oportunidades</Link>
          </article>)}</div>
        )}
      </section>
    </DashboardLayout>
  )
}
export default ProcurarEvento
