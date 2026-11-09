import './style.css'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import DashboardLayout from '../../../../layouts/DashboardLayout'
import menuFornecedor from '../menuFornecedor'
import { buscarEventoPorIdApi } from '../../../../services/eventos'
import { criarProposta, listarPropostas, listarPropostasServidor } from '../../../../services/propostas'

function CriarProposta() {
  const navigate = useNavigate()
  const [parametros] = useSearchParams()
  const eventoId = parametros.get('evento')
  const itemId = parametros.get('item')
  const [evento, setEvento] = useState(null)
  const [propostaExistente, setPropostaExistente] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [formulario, setFormulario] = useState({ valor: '', validade: '', descricao: '', observacoes: '' })
  const [erro, setErro] = useState('')

  useEffect(() => {
    let ativo = true
    Promise.all([buscarEventoPorIdApi(eventoId), listarPropostasServidor()])
      .then(([eventoAtual, propostas]) => {
        if (!ativo) return
        setEvento(eventoAtual)
        setPropostaExistente((Array.isArray(propostas) ? propostas : []).find((p) => String(p.eventoId ?? p.evento_id) === String(eventoId) && String(p.itemId ?? p.item_id) === String(itemId)) || null)
      })
      .catch((e) => { if (ativo) { setErro(e.message || 'Não foi possível carregar a oportunidade.'); setEvento(null) } })
      .finally(() => { if (ativo) setCarregando(false) })
    return () => { ativo = false }
  }, [eventoId, itemId])

  const item = evento?.itensCusto?.find((atual) => String(atual.id) === String(itemId))
  function alterarCampo(event) { const { name, value } = event.target; setFormulario((atual) => ({ ...atual, [name]: value })) }

  async function enviar(event) {
    event.preventDefault()
    if (!evento || !item) { setErro('Selecione um evento e um serviço requerido válido.'); return }
    if (propostaExistente) { setErro('Você já enviou uma proposta para este serviço. Consulte Minhas Propostas para acompanhar ou editar.'); return }
    if (!formulario.valor || !formulario.validade || !formulario.descricao) { setErro('Preencha valor, validade e descrição.'); return }
    if (!(Number(formulario.valor) > 0)) { setErro('Informe um valor maior que zero.'); return }
    try {
      await criarProposta({ ...formulario, eventoId: evento.id, evento: evento.nome, itemId: item.id, item: item.descricao, categoria: item.categoria })
      navigate('/fornecedor/propostas', { state: { sucesso: 'Proposta enviada com sucesso.' } })
    } catch (e) {
      setErro(e.message || 'Não foi possível enviar a proposta.')
      if (String(e.message || '').includes('HTTP 409')) setPropostaExistente({ status: 'EM ANÁLISE' })
    }
  }

  if (carregando) return <DashboardLayout tipoUsuario="FORNECEDOR" itensMenu={menuFornecedor}><div className="proposta-sem-oportunidade">Carregando oportunidade…</div></DashboardLayout>
  if (!evento || !item) return <DashboardLayout tipoUsuario="FORNECEDOR" itensMenu={menuFornecedor}><section className="proposta-sem-oportunidade"><h1>Oportunidade indisponível</h1><p>{erro || 'O serviço não foi encontrado ou não está mais disponível.'}</p><Link to="/fornecedor/procurar-evento">Procurar eventos</Link></section></DashboardLayout>

  return (
    <DashboardLayout tipoUsuario="FORNECEDOR" itensMenu={menuFornecedor}>
      <section className="pagina-criar-proposta">
        <div className="titulo-criar-proposta"><h1>Enviar proposta</h1><p>{evento.nome} — {item.categoria}</p></div>
        <div className="resumo-oportunidade"><span>Serviço requerido</span><strong>{item.descricao}</strong></div>
        {item.mostrarOrcamentoFornecedor === true && Number(item.valorEstimado) > 0 && <div className="orcamento-referencia-proposta"><span>Orçamento de referência compartilhado pelo organizador</span><strong>{Number(item.valorEstimado).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong><p>É uma referência opcional. Apresente o preço real cobrado pelo seu serviço.</p></div>}
        {propostaExistente ? <div className="proposta-duplicada-aviso"><strong>Proposta já enviada</strong><p>Você já enviou uma proposta para este serviço. Não é permitido criar uma segunda proposta para a mesma oportunidade.</p><Link to="/fornecedor/propostas">Ver ou editar minha proposta</Link></div> : <form className="formulario-proposta" onSubmit={enviar}>
          <label htmlFor="valor">Valor total da proposta (R$)</label><input id="valor" name="valor" type="number" min="0.01" step="0.01" required value={formulario.valor} onChange={alterarCampo} placeholder="0,00"/>
          <label htmlFor="validade">Validade</label><input id="validade" name="validade" type="date" required value={formulario.validade} onChange={alterarCampo}/>
          <label htmlFor="descricao">Descrição do que está incluso</label><textarea id="descricao" name="descricao" required value={formulario.descricao} onChange={alterarCampo} placeholder="Descreva o serviço, a quantidade e as condições oferecidas"/>
          <label htmlFor="observacoes">Observações</label><textarea id="observacoes" name="observacoes" value={formulario.observacoes} onChange={alterarCampo} placeholder="Informações adicionais"/>
          {erro && <p className="erro-proposta" role="alert">{erro}</p>}
          <div className="acoes-proposta"><button type="button" onClick={() => navigate(`/fornecedor/eventos/${evento.id}`)}>Cancelar</button><button type="submit">Enviar proposta</button></div>
        </form>}
      </section>
    </DashboardLayout>
  )
}
export default CriarProposta
