import './style.css'
import { useEffect, useState } from 'react'
import DashboardLayout from '../../../../layouts/DashboardLayout'
import menuOrganizador from '../menuOrganizador'
import { listarPropostas, listarPropostasServidor, atualizarStatusProposta, enviarContraproposta } from '../../../../services/propostas'

const moeda = (valor) => Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

function PropostasOrganizador() {
  const [propostas, setPropostas] = useState(() => listarPropostas())
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [contrapropostaId, setContrapropostaId] = useState('')
  const [formulario, setFormulario] = useState({ valor: '', quantidade: '1', descricao: '', observacoes: '' })
  const [ocupado, setOcupado] = useState('')

  async function atualizarLista() {
    const lista = await listarPropostasServidor()
    setPropostas(Array.isArray(lista) ? lista : [])
  }
  useEffect(() => {
    let ativo = true
    listarPropostasServidor().then((lista) => { if (ativo) setPropostas(Array.isArray(lista) ? lista : []) }).catch((e) => { if (ativo) setErro(e.message || 'Não foi possível carregar as propostas do servidor.') }).finally(() => { if (ativo) setCarregando(false) })
    const atualizar = () => setPropostas(listarPropostas())
    window.addEventListener('trocaticket-api-ok', atualizar)
    return () => { ativo = false; window.removeEventListener('trocaticket-api-ok', atualizar) }
  }, [])

  async function alterarStatus(id, status) {
    setOcupado(id); setErro('')
    try { await atualizarStatusProposta(id, status); await atualizarLista() }
    catch (e) { setErro(e.message || 'Não foi possível atualizar a proposta.') }
    finally { setOcupado('') }
  }

  async function enviarNegociacao(evento, id) {
    evento.preventDefault(); setOcupado(id); setErro('')
    try {
      await enviarContraproposta(id, formulario)
      await atualizarLista()
      setContrapropostaId('')
      setFormulario({ valor: '', quantidade: '1', descricao: '', observacoes: '' })
    } catch (e) { setErro(e.message || 'Não foi possível enviar a contraproposta.') }
    finally { setOcupado('') }
  }

  return (
    <DashboardLayout tipoUsuario="ORGANIZADOR" itensMenu={menuOrganizador}>
      <section className="pagina-propostas-organizador">
        <h1>Propostas recebidas</h1>
        <p>Compare os valores enviados pelos fornecedores, aceite, recuse ou negocie condições.</p>
        {erro && <p className="erro-proposta-organizador" role="alert">{erro}</p>}
        {carregando ? <div className="sem-propostas-organizador">Carregando propostas…</div> : propostas.length === 0 ? <div className="sem-propostas-organizador">Nenhuma proposta recebida.</div> : (
          <div className="lista-propostas-organizador">
            {propostas.map((p) => <article className="proposta-organizador" key={p.id}>
              <div className="proposta-organizador-topo"><span className={`status-proposta-organizador status-${String(p.status).toLowerCase().replaceAll(' ', '-')}`}>{p.status}</span><small>{p.fornecedor || 'Fornecedor'}</small></div>
              <h2>{p.evento}</h2><p>{p.categoria} — {p.item}</p>
              <strong>Valor enviado: {moeda(p.valor)}</strong>
              <p>{p.descricao}</p>
              {p.validade && <small>Validade: {p.validade}</small>}
              {p.status === 'EM ANÁLISE' && (p.contraproposta?.status === 'AGUARDANDO_FORNECEDOR' ? (
                <div className="aviso-contraproposta-pendente" role="status">Aguarde o fornecedor responder à contraproposta antes de concluir esta proposta.</div>
              ) : <div className="acoes-proposta-organizador">
                <button type="button" disabled={ocupado === p.id} onClick={() => alterarStatus(p.id, 'ACEITA')}>Aceitar</button>
                <button type="button" disabled={ocupado === p.id} onClick={() => alterarStatus(p.id, 'RECUSADA')}>Recusar</button>
                <button type="button" disabled={ocupado === p.id} onClick={() => { setContrapropostaId(contrapropostaId === p.id ? '' : p.id); setFormulario({ valor: String(p.valor || ''), quantidade: '1', descricao: p.descricao || '', observacoes: '' }) }}>Enviar contraproposta</button>
              </div>)}
              {p.contraproposta && <section className="contraproposta-organizador">
                <strong>Contraproposta enviada</strong><span>{moeda(p.contraproposta.valor)} · Quantidade: {p.contraproposta.quantidade}</span><p>{p.contraproposta.descricao}</p><small>Status: {p.contraproposta.status === 'AGUARDANDO_FORNECEDOR' ? 'Aguardando resposta do fornecedor' : p.contraproposta.status}</small>
              </section>}
              {contrapropostaId === p.id && <form className="form-contraproposta-organizador" onSubmit={(e) => enviarNegociacao(e, p.id)}>
                <h3>Negociar condições</h3>
                <div className="form-contraproposta-grade">
                  <label>Novo valor total (R$)<input type="number" min="0.01" step="0.01" required value={formulario.valor} onChange={(e) => setFormulario((f) => ({ ...f, valor: e.target.value }))}/></label>
                  <label>Quantidade<input type="number" min="1" step="1" required value={formulario.quantidade} onChange={(e) => setFormulario((f) => ({ ...f, quantidade: e.target.value }))}/></label>
                </div>
                <label>Descrição das novas condições<textarea required value={formulario.descricao} onChange={(e) => setFormulario((f) => ({ ...f, descricao: e.target.value }))}/></label>
                <label>Observações<textarea value={formulario.observacoes} onChange={(e) => setFormulario((f) => ({ ...f, observacoes: e.target.value }))}/></label>
                <div><button type="submit" disabled={ocupado === p.id}>{ocupado === p.id ? 'Enviando…' : 'Enviar contraproposta'}</button><button type="button" onClick={() => setContrapropostaId('')}>Cancelar</button></div>
              </form>}
              {p.status === 'ACEITA' && p.contatoFornecedor && <section className="contato-fornecedor-aceito">
                <div className="contato-fornecedor-aceito-topo"><span className="contato-fornecedor-aceito-icone">✓</span><div><h3>Contato liberado — proposta aceita</h3><p>Entre em contato com o fornecedor para combinar os próximos passos.</p></div></div>
                <dl className="contato-fornecedor-aceito-dados">
                  {p.contatoFornecedor.razaoSocial && <div><dt>Empresa</dt><dd>{p.contatoFornecedor.razaoSocial}</dd></div>}
                  {p.contatoFornecedor.responsavel && <div><dt>Responsável</dt><dd>{p.contatoFornecedor.responsavel}</dd></div>}
                  {p.contatoFornecedor.email && <div><dt>E-mail</dt><dd><a href={`mailto:${p.contatoFornecedor.email}`}>{p.contatoFornecedor.email}</a></dd></div>}
                  {p.contatoFornecedor.telefone && <div><dt>Telefone / WhatsApp</dt><dd>{p.contatoFornecedor.telefone}</dd></div>}
                </dl>
                <div className="contato-fornecedor-aceito-acoes">{p.contatoFornecedor.email && <a href={`mailto:${p.contatoFornecedor.email}`}>Enviar e-mail</a>}{p.contatoFornecedor.telefone && <a href={`https://wa.me/${String(p.contatoFornecedor.whatsapp || p.contatoFornecedor.telefone).replace(/\D/g, '').replace(/^0+/, '').replace(/^(?!55)(\d{10,11})$/, '55$1')}`} target="_blank" rel="noreferrer">Abrir WhatsApp</a>}</div>
              </section>}
            </article>)}
          </div>
        )}
      </section>
    </DashboardLayout>
  )
}
export default PropostasOrganizador
