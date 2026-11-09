import './style.css'
import { useEffect, useMemo, useState } from 'react'
import { Printer, ArrowLeft, TrendingUp, Clock3, CheckCircle2, XCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import DashboardLayout from '../../../../layouts/DashboardLayout'
import menuFornecedor from '../menuFornecedor'
import { listarPropostas, listarPropostasServidor } from '../../../../services/propostas'

const moeda = (valor) => Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function RelatorioFornecedor() {
  const [propostas, setPropostas] = useState(() => listarPropostas())
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    let ativo = true
    listarPropostasServidor()
      .then((lista) => { if (ativo) setPropostas(Array.isArray(lista) ? lista : []) })
      .catch((e) => { if (ativo) setErro(e.message || 'Não foi possível atualizar o relatório.') })
      .finally(() => { if (ativo) setCarregando(false) })
    const atualizar = () => setPropostas(listarPropostas())
    window.addEventListener('trocaticket-api-ok', atualizar)
    return () => { ativo = false; window.removeEventListener('trocaticket-api-ok', atualizar) }
  }, [])

  const resumo = useMemo(() => {
    const aceitas = propostas.filter((p) => String(p.status).toUpperCase() === 'ACEITA')
    const recusadas = propostas.filter((p) => String(p.status).toUpperCase() === 'RECUSADA')
    const pendentes = propostas.filter((p) => String(p.status).toUpperCase() === 'EM ANÁLISE')
    return {
      total: propostas.length,
      aceitas: aceitas.length,
      recusadas: recusadas.length,
      pendentes: pendentes.length,
      bruto: aceitas.reduce((soma, p) => soma + Number(p.valor || 0), 0),
      aguardando: pendentes.reduce((soma, p) => soma + Number(p.valor || 0), 0),
    }
  }, [propostas])

  return (
    <DashboardLayout tipoUsuario="FORNECEDOR" itensMenu={menuFornecedor}>
      <section className="relatorio-fornecedor-pagina">
        <div className="relatorio-fornecedor-topo nao-imprimir">
          <div><span>DESEMPENHO COMERCIAL</span><h1>Relatório de propostas</h1><p>Resumo dos resultados e dos valores negociados na TrocaTicket.</p></div>
          <div className="relatorio-fornecedor-acoes">
            <Link to="/fornecedor/propostas"><ArrowLeft size={16}/> Minhas propostas</Link>
            <button type="button" onClick={() => window.print()}><Printer size={16}/> Salvar / imprimir PDF</button>
          </div>
        </div>
        {erro && <p className="relatorio-fornecedor-erro" role="alert">{erro}</p>}
        <div className="relatorio-fornecedor-resumo">
          <article><span>Total enviadas</span><strong>{resumo.total}</strong><small>Propostas registradas</small></article>
          <article><span>Propostas aceitas</span><strong>{resumo.aceitas}</strong><small>Contratações confirmadas</small></article>
          <article><span>Em análise</span><strong>{resumo.pendentes}</strong><small>{moeda(resumo.aguardando)} aguardando decisão</small></article>
          <article><span>Recusadas</span><strong>{resumo.recusadas}</strong><small>Não selecionadas</small></article>
          <article className="relatorio-fornecedor-bruto"><span>Valor bruto aceito</span><strong>{moeda(resumo.bruto)}</strong><small>Soma das propostas aceitas</small></article>
        </div>
        <div className="relatorio-fornecedor-nota">
          <TrendingUp size={19}/><p><strong>Como interpretar:</strong> o valor bruto aceito representa o total das propostas aceitas. Não é lucro líquido: custos com equipe, materiais, impostos, deslocamento e demais despesas do fornecedor não são descontados pela plataforma.</p>
        </div>
        <section className="relatorio-fornecedor-tabela">
          <div className="relatorio-fornecedor-secao-titulo"><div><h2>Histórico de propostas</h2><p>Valores e situação atual de cada negociação.</p></div><span>{carregando ? 'Atualizando…' : `${propostas.length} registro(s)`}</span></div>
          {propostas.length === 0 ? <div className="relatorio-fornecedor-vazio">Você ainda não enviou propostas.</div> : (
            <div className="relatorio-fornecedor-linhas">
              {propostas.map((p) => <article key={p.id}>
                <div><strong>{p.evento || 'Evento'}</strong><span>{p.item || p.descricao || 'Serviço requerido'}</span></div>
                <div className="relatorio-fornecedor-status">{String(p.status).toUpperCase() === 'ACEITA' ? <CheckCircle2 size={15}/> : String(p.status).toUpperCase() === 'RECUSADA' ? <XCircle size={15}/> : <Clock3 size={15}/>} {p.status}</div>
                <strong>{moeda(p.valor)}</strong>
              </article>)}
            </div>
          )}
        </section>
        <footer className="relatorio-fornecedor-rodape">Relatório gerado em {new Date().toLocaleString('pt-BR')}. As informações refletem os dados cadastrados na plataforma.</footer>
      </section>
    </DashboardLayout>
  )
}
