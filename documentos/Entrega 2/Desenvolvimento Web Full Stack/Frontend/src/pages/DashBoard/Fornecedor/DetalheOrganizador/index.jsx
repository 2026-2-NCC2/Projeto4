import './style.css'
import { useEffect, useState } from 'react'
import { ArrowLeft, Building2, CalendarDays, MapPin, Mail, Phone, ExternalLink } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import DashboardLayout from '../../../../layouts/DashboardLayout'
import menuFornecedor from '../menuFornecedor'
import { buscarOrganizadorDoServidor } from '../../../../services/eventos'

export default function DetalheOrganizador() {
  const { id } = useParams()
  const [dados, setDados] = useState({ organizador: null, eventos: [] })
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    let ativo = true
    buscarOrganizadorDoServidor(id)
      .then((resultado) => { if (ativo) setDados(resultado) })
      .catch((e) => { if (ativo) setErro(e.message || 'Não foi possível carregar o organizador.') })
      .finally(() => { if (ativo) setCarregando(false) })
    return () => { ativo = false }
  }, [id])

  const organizador = dados.organizador
  return (
    <DashboardLayout tipoUsuario="FORNECEDOR" itensMenu={menuFornecedor}>
      <section className="detalhe-organizador-fornecedor">
        <Link className="detalhe-organizador-voltar" to="/fornecedor/procurar-evento"><ArrowLeft size={15}/> Voltar aos eventos</Link>
        {carregando ? <div className="detalhe-organizador-estado">Carregando perfil do organizador…</div> : erro ? <div className="detalhe-organizador-estado erro">{erro}</div> : !organizador ? <div className="detalhe-organizador-estado">Organizador não encontrado.</div> : <>
          <header className="detalhe-organizador-cabecalho">
            <div className="detalhe-organizador-avatar">{organizador.fotoPerfil ? <img src={organizador.fotoPerfil} alt=""/> : <Building2 size={30}/>}</div>
            <div><span>ORGANIZADOR VERIFICADO</span><h1>{organizador.nome}</h1><p>{organizador.responsavel ? `Responsável: ${organizador.responsavel}` : 'Perfil público do organizador'}</p></div>
          </header>
          <div className="detalhe-organizador-grade">
            <section className="detalhe-organizador-card">
              <h2>Informações de contato</h2>
              {organizador.email && <p><Mail size={16}/><a href={`mailto:${organizador.email}`}>{organizador.email}</a></p>}
              {organizador.telefone && <p><Phone size={16}/><a href={`tel:${organizador.telefone}`}>{organizador.telefone}</a></p>}
              {(organizador.cidade || organizador.estado) && <p><MapPin size={16}/>{[organizador.cidade, organizador.estado].filter(Boolean).join(' / ')}</p>}
              {organizador.site && <p><ExternalLink size={16}/><a href={/^https?:\/\//i.test(organizador.site) ? organizador.site : `https://${organizador.site}`} target="_blank" rel="noreferrer">Site da organização</a></p>}
              {organizador.descricao && <div className="detalhe-organizador-descricao"><h3>Sobre a organização</h3><p>{organizador.descricao}</p></div>}
            </section>
            <section className="detalhe-organizador-card">
              <div className="detalhe-organizador-eventos-topo"><div><h2>Eventos publicados</h2><p>Eventos aprovados pela administração.</p></div><span>{dados.eventos.length}</span></div>
              {dados.eventos.length ? <div className="detalhe-organizador-eventos">{dados.eventos.map((evento) => <article key={evento.id}>
                {evento.capa && <img src={evento.capa} alt={`Capa de ${evento.nome}`}/>}
                <div><strong>{evento.nome}</strong><span><CalendarDays size={13}/>{evento.dataInicio || 'Data a definir'}{evento.local ? ` · ${evento.local}` : ''}</span><small>{evento.categoria || 'Evento'}</small></div>
              </article>)}</div> : <div className="detalhe-organizador-estado">Este organizador ainda não possui eventos publicados.</div>}
            </section>
          </div>
        </>}
      </section>
    </DashboardLayout>
  )
}
