import './style.css'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FileText, TrendingUp } from 'lucide-react'
import DashboardLayout from '../../../layouts/DashboardLayout'
import CardCadastroPendente from '../../../componentes/cardCadastroPendente'
import CardDesempenho from '../../../componentes/cardDesempenho'
import CardProposta from '../../../componentes/cardProposta'
import menuFornecedor from './menuFornecedor'
import { listarPropostas, listarPropostasServidor } from '../../../services/propostas'
import { obterSessao } from '../../../services/usuarios'

const moeda = (valor) => Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

function Fornecedor() {
  const usuario = obterSessao()
  const [propostas, setPropostas] = useState(() => listarPropostas())
  const aprovado = usuario?.status === 'APROVADO'

  useEffect(() => {
    let ativo = true
    listarPropostasServidor().then((lista) => { if (ativo) setPropostas(Array.isArray(lista) ? lista : []) }).catch(() => {})
    const atualizar = () => setPropostas(listarPropostas())
    window.addEventListener('trocaticket-api-ok', atualizar)
    return () => { ativo = false; window.removeEventListener('trocaticket-api-ok', atualizar) }
  }, [])

  const resumo = useMemo(() => {
    const aceitas = propostas.filter((p) => String(p.status).toUpperCase() === 'ACEITA')
    const recusadas = propostas.filter((p) => String(p.status).toUpperCase() === 'RECUSADA')
    return { aceitas, recusadas, pendentes: propostas.filter((p) => String(p.status).toUpperCase() === 'EM ANÁLISE'), bruto: aceitas.reduce((total, p) => total + Number(p.valor || 0), 0) }
  }, [propostas])
  const recentes = propostas.slice(0, 2)

  return (
    <DashboardLayout tipoUsuario="FORNECEDOR" itensMenu={menuFornecedor}>
      {usuario?.status === 'INCOMPLETO' && <CardCadastroPendente destinoCadastro="/fornecedor/completar-cadastro" />}
      {usuario?.status === 'PENDENTE' && <div className="aviso-status-cadastro aviso-padrao">Seu cadastro está em análise. Você poderá consultar oportunidades e enviar propostas após a aprovação.</div>}
      {usuario?.status === 'REJEITADO' && <div className="aviso-status-cadastro aviso-padrao">Seu cadastro foi rejeitado. Entre em contato com a administração.</div>}

      <section className="desempenho-fornecedor">
        <div className="titulo-secao-fornecedor"><h2>Desempenho geral</h2><span>Dados atualizados do servidor</span></div>
        <div className="cards-fornecedor">
          <CardDesempenho titulo="Propostas enviadas" valor={propostas.length} detalhe="Total de propostas registradas" />
          <CardDesempenho titulo="Propostas aceitas" valor={resumo.aceitas.length} detalhe="Negociações confirmadas" destaque />
          <CardDesempenho titulo="Propostas recusadas" valor={resumo.recusadas.length} detalhe="Não selecionadas pelo organizador" />
        </div>
        <article className="resumo-financeiro-fornecedor">
          <div className="resumo-financeiro-fornecedor-icone"><TrendingUp size={20}/></div>
          <div><span>Valor bruto previsto de propostas aceitas</span><strong>{moeda(resumo.bruto)}</strong><small>Não representa lucro líquido: despesas e impostos do fornecedor não são descontados.</small></div>
          <Link to="/fornecedor/relatorio"><FileText size={16}/> Ver relatório completo</Link>
        </article>
      </section>

      <section className="propostas-recentes">
        <div className="titulo-secao-fornecedor"><h2>Minhas propostas recentes</h2><Link to="/fornecedor/propostas">Ver todas</Link></div>
        {recentes.length === 0 ? <div className="nenhuma-proposta"><p>Você ainda não enviou nenhuma proposta.</p>{aprovado ? <Link to="/fornecedor/procurar-evento">Procurar eventos</Link> : <p>Após a aprovação do cadastro, as oportunidades ficarão disponíveis.</p>}</div> : <div className="lista-propostas-recentes">{recentes.map((proposta) => <CardProposta key={proposta.id} proposta={proposta}/>)}</div>}
      </section>
      {!aprovado && <div className="fornecedor-acesso-bloqueado"><strong>Oportunidades bloqueadas</strong><p>Complete seu cadastro e aguarde a aprovação da TrocaTicket para visualizar eventos e enviar propostas.</p><Link to={usuario?.status === 'INCOMPLETO' ? '/fornecedor/completar-cadastro' : '/fornecedor/perfil'}>{usuario?.status === 'INCOMPLETO' ? 'Completar cadastro' : 'Consultar perfil'}</Link></div>}
    </DashboardLayout>
  )
}
export default Fornecedor
