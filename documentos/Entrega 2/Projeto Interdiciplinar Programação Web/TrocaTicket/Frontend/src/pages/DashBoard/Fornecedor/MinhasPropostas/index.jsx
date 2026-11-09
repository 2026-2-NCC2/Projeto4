import './style.css'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import DashboardLayout from '../../../../layouts/DashboardLayout'
import menuFornecedor from '../menuFornecedor'
import { atualizarProposta, excluirProposta, listarPropostas, listarPropostasServidor, responderContraproposta } from '../../../../services/propostas'

const moeda = (valor) => Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

function MinhasPropostas() {
  const [propostas, setPropostas] = useState(() => listarPropostas())
  const [erro, setErro] = useState('')
  const [editando, setEditando] = useState('')
  const [formulario, setFormulario] = useState({ valor: '', validade: '', descricao: '', observacoes: '' })
  const [salvando, setSalvando] = useState(false)

  async function atualizarLista() {
    const lista = await listarPropostasServidor()
    setPropostas(Array.isArray(lista) ? lista : [])
  }
  useEffect(() => {
    let ativo = true
    listarPropostasServidor().then((lista) => { if (ativo) setPropostas(Array.isArray(lista) ? lista : []) }).catch((e) => { if (ativo) setErro(e.message) })
    const atualizar = () => setPropostas(listarPropostas())
    window.addEventListener('trocaticket-api-ok', atualizar)
    return () => { ativo = false; window.removeEventListener('trocaticket-api-ok', atualizar) }
  }, [])

  const resumo = useMemo(() => {
    const aceitas = propostas.filter((p) => p.status === 'ACEITA')
    return { aceitas: aceitas.length, recusadas: propostas.filter((p) => p.status === 'RECUSADA').length, pendentes: propostas.filter((p) => p.status === 'EM ANÁLISE').length, bruto: aceitas.reduce((s, p) => s + Number(p.valor || 0), 0) }
  }, [propostas])

  function iniciarEdicao(proposta) {
    setEditando(proposta.id)
    setFormulario({ valor: String(proposta.valor ?? ''), validade: proposta.validade || '', descricao: proposta.descricao || '', observacoes: proposta.observacoes || '' })
    setErro('')
  }
  async function salvarEdicao(evento) {
    evento.preventDefault()
    setSalvando(true)
    try {
      await atualizarProposta(editando, formulario)
      await atualizarLista()
      setEditando('')
      setErro('')
    } catch (e) { setErro(e.message || 'Não foi possível editar a proposta.') }
    finally { setSalvando(false) }
  }
  async function cancelarProposta(id) {
    if (!window.confirm('Deseja cancelar esta proposta?')) return
    try { await excluirProposta(id); await atualizarLista(); setErro('') }
    catch (e) { setErro(e.message || 'Não foi possível cancelar a proposta.') }
  }
  async function responder(proposta, aceitar) {
    const acao = aceitar ? 'aceitar' : 'recusar'
    if (!window.confirm(`Deseja ${acao} a contraproposta do organizador?`)) return
    try { await responderContraproposta(proposta.id, aceitar); await atualizarLista(); setErro('') }
    catch (e) { setErro(e.message || 'Não foi possível responder à contraproposta.') }
  }

  return (
    <DashboardLayout tipoUsuario="FORNECEDOR" itensMenu={menuFornecedor}>
      <section className="pagina-minhas-propostas">
        <div className="titulo-minhas-propostas"><div><h1>Minhas propostas</h1><p>Acompanhe negociações, contrapropostas e resultados.</p></div><Link to="/fornecedor/relatorio" className="link-relatorio-propostas">Ver relatório financeiro</Link></div>
        <div className="resumo-minhas-propostas">
          <article><span>Aceitas</span><strong>{resumo.aceitas}</strong></article>
          <article><span>Em análise</span><strong>{resumo.pendentes}</strong></article>
          <article><span>Recusadas</span><strong>{resumo.recusadas}</strong></article>
          <article className="resumo-minhas-propostas-bruto"><span>Valor bruto aceito</span><strong>{moeda(resumo.bruto)}</strong></article>
        </div>
        {erro && <p className="erro-cancelar-proposta" role="alert">{erro}</p>}
        {propostas.length === 0 ? <div className="propostas-vazio">Nenhuma proposta enviada.</div> : (
          <div className="lista-minhas-propostas">
            {propostas.map((p) => {
              const contraproposta = p.contraproposta
              return <article className="proposta-fornecedor-detalhada" key={p.id}>
                <div className="proposta-fornecedor-topo"><span className={`proposta-fornecedor-status status-${String(p.status).toLowerCase().replaceAll(' ', '-')}`}>{p.status}</span><small>#{String(p.id).slice(0, 8)}</small></div>
                <h2>{p.evento}</h2><p className="proposta-fornecedor-item">{p.categoria} · {p.item}</p>
                <strong className="proposta-fornecedor-valor">{moeda(p.valor)}</strong>
                <p className="proposta-fornecedor-descricao">{p.descricao}</p>
                <small className="proposta-fornecedor-validade">Validade: {p.validade || 'Não informada'}</small>
                {contraproposta && <section className="contraproposta-fornecedor">
                  <div><span>Contraproposta do organizador</span><strong>{moeda(contraproposta.valor)}</strong></div>
                  <p>{contraproposta.descricao}</p>
                  <small>Quantidade: {contraproposta.quantidade} · Situação: {contraproposta.status === 'AGUARDANDO_FORNECEDOR' ? 'Aguardando sua resposta' : contraproposta.status}</small>
                  {contraproposta.status === 'AGUARDANDO_FORNECEDOR' && <div className="acoes-contraproposta-fornecedor"><button type="button" onClick={() => responder(p, true)}>Aceitar contraproposta</button><button type="button" onClick={() => responder(p, false)}>Não aceitar</button></div>}
                </section>}
                {editando === p.id ? <form className="editar-proposta-fornecedor" onSubmit={salvarEdicao}>
                  <label>Valor (R$)<input type="number" min="0.01" step="0.01" required value={formulario.valor} onChange={(e) => setFormulario((f) => ({ ...f, valor: e.target.value }))}/></label>
                  <label>Validade<input type="date" required value={formulario.validade} onChange={(e) => setFormulario((f) => ({ ...f, validade: e.target.value }))}/></label>
                  <label>Descrição<textarea required value={formulario.descricao} onChange={(e) => setFormulario((f) => ({ ...f, descricao: e.target.value }))}/></label>
                  <label>Observações<textarea value={formulario.observacoes} onChange={(e) => setFormulario((f) => ({ ...f, observacoes: e.target.value }))}/></label>
                  <div><button type="submit" disabled={salvando}>{salvando ? 'Salvando…' : 'Salvar alterações'}</button><button type="button" onClick={() => setEditando('')}>Cancelar</button></div>
                </form> : <div className="acoes-proposta-fornecedor">
                  {p.status === 'EM ANÁLISE' && contraproposta?.status !== 'AGUARDANDO_FORNECEDOR' && <button type="button" onClick={() => iniciarEdicao(p)}>Editar proposta</button>}
                  {p.status === 'EM ANÁLISE' && <button type="button" className="cancelar" onClick={() => cancelarProposta(p.id)}>Cancelar proposta</button>}
                </div>}
              </article>
            })}
          </div>
        )}
      </section>
    </DashboardLayout>
  )
}
export default MinhasPropostas
