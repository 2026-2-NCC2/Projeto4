import './style.css'

import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Plus, Trash2, Pencil, X } from 'lucide-react'

import DashboardLayout from '../../../../layouts/DashboardLayout'
import menuOrganizador from '../menuOrganizador'

import {
  buscarEventoPorId,
  buscarEventoPorIdApi,
  adicionarItemCusto,
  excluirItemCusto
} from '../../../../services/eventos'

function ItensCusto() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [evento, setEvento] = useState(() => buscarEventoPorId(id) || null)
  const [carregandoEvento, setCarregandoEvento] = useState(true)
  const [itemEmEdicao, setItemEmEdicao] = useState('')

  const [formulario, setFormulario] = useState({
    categoria: '',
    descricao: '',
    valorEstimado: '',
    mostrarOrcamentoFornecedor: false
  })

  const [erro, setErro] = useState('')

  useEffect(() => {
    let ativo = true
    setCarregandoEvento(true)
    buscarEventoPorIdApi(id)
      .then((eventoServidor) => { if (ativo) setEvento(eventoServidor || null) })
      .catch((erroBusca) => {
        if (!ativo) return
        const eventoEmCache = buscarEventoPorId(id)
        if (eventoEmCache) setEvento(eventoEmCache)
        else setErro(erroBusca.message || 'Não foi possível carregar o evento no servidor.')
      })
      .finally(() => { if (ativo) setCarregandoEvento(false) })
    return () => { ativo = false }
  }, [id])

  async function atualizarEventoLocal() {
    try {
      const atualizado = await buscarEventoPorIdApi(id)
      if (atualizado) setEvento(atualizado)
      else setEvento(buscarEventoPorId(id) || null)
    } catch {
      setEvento(buscarEventoPorId(id) || null)
    }
  }

  function alterarCampo(event) {
    const { name, value } = event.target

    setFormulario({
      ...formulario,
      [name]: event.target.type === 'checkbox' ? event.target.checked : value
    })
  }

  async function adicionarItem(event) {
    event.preventDefault()
    setErro('')

    if (!formulario.categoria || !formulario.descricao.trim()) {
      setErro('Informe a categoria e a descrição do serviço requerido.')
      return
    }
    if (formulario.valorEstimado !== '' && (!Number.isFinite(Number(formulario.valorEstimado)) || Number(formulario.valorEstimado) < 0)) {
      setErro('O orçamento de referência deve ser um valor total estimado maior ou igual a zero.')
      return
    }

    if (formulario.mostrarOrcamentoFornecedor && !(Number(formulario.valorEstimado) > 0)) {
      setErro('Informe um orçamento de referência maior que zero antes de compartilhá-lo com fornecedores.')
      return
    }

    try {
      await adicionarItemCusto(id, {
        ...formulario,
        id: itemEmEdicao || undefined,
        descricao: formulario.descricao.trim(),
        valorEstimado: formulario.valorEstimado === '' ? null : Number(formulario.valorEstimado),
      })
      await atualizarEventoLocal()
      setFormulario({ categoria: '', descricao: '', valorEstimado: '', mostrarOrcamentoFornecedor: false })
      setItemEmEdicao('')
    } catch (erroCriacao) {
      setErro(erroCriacao.message || 'Não foi possível salvar o custo no servidor.')
    }
  }

  function editarItem(item) {
    setItemEmEdicao(String(item.id))
    setFormulario({
      categoria: item.categoria || '',
      descricao: item.descricao || '',
      valorEstimado: item.valorEstimado == null ? '' : String(item.valorEstimado),
      mostrarOrcamentoFornecedor: item.mostrarOrcamentoFornecedor === true || item.mostrarOrcamentoFornecedor === 1,
    })
    setErro('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function cancelarEdicao() {
    setItemEmEdicao('')
    setFormulario({ categoria: '', descricao: '', valorEstimado: '', mostrarOrcamentoFornecedor: false })
    setErro('')
  }

  async function removerItem(itemId) {
    setErro('')
    try {
      await excluirItemCusto(id, itemId)
      await atualizarEventoLocal()
    } catch (erroExclusao) {
      setErro(erroExclusao.message || 'Não foi possível excluir o serviço requerido.')
    }
  }

  if (carregandoEvento && !evento) {
    return (
      <DashboardLayout tipoUsuario="ORGANIZADOR" itensMenu={menuOrganizador}>
        <section className="pagina-itens-custo"><p>Carregando os dados do evento...</p></section>
      </DashboardLayout>
    )
  }

  if (!evento) {
    return (
      <DashboardLayout
        tipoUsuario="ORGANIZADOR"
        statusVerificacao="Conta em verificação"
        itensMenu={menuOrganizador}
      >
        <h1>Evento não encontrado</h1>
      </DashboardLayout>
    )
  }

  const itens = Array.isArray(evento?.itensCusto) ? evento.itensCusto : []

  return (
    <DashboardLayout
      tipoUsuario="ORGANIZADOR"
      statusVerificacao="Conta em verificação"
      itensMenu={menuOrganizador}
    >
      <section className="pagina-itens-custo">

        <div className="cabecalho-itens-custo">
          <div>
            <h1>Serviços requeridos</h1>

            <p>
              {evento.nome}
            </p>
          </div>

          <div className="acoes-custos-cabecalho">
            <button type="button" onClick={() => navigate(`/organizador/eventos/${id}/precificacao`)}>
              Ver cálculo do ticket
            </button>
            <button type="button" onClick={() => navigate(`/organizador/eventos/${id}`)}>
              Voltar ao evento
            </button>
          </div>
        </div>

        <form
          className="formulario-item-custo"
          onSubmit={adicionarItem}
        >
          <div>
            <label htmlFor="categoria">
              Categoria
            </label>

            <select
              id="categoria"
              name="categoria"
              value={formulario.categoria}
              onChange={alterarCampo}
            >
              <option value="">
                Selecione
              </option>

              <option value="Iluminação">
                Iluminação
              </option>

              <option value="Alimentação">
                Alimentação
              </option>

              <option value="Bebidas">
                Bebidas
              </option>

              <option value="Segurança">
                Segurança
              </option>

              <option value="Estrutura">
                Estrutura
              </option>

              <option value="Fiscal">Custos fiscais</option>
              <option value="Operacional">Custos operacionais</option>
              <option value="Variável">Custos variáveis</option>
              <option value="Marketing">Marketing e divulgação</option>
              <option value="Logística">Logística</option>
              <option value="Outros">Outros</option>
            </select>
          </div>

          <div className="campo-descricao-item">
            <label htmlFor="descricao">
              Descrição
            </label>

            <input
              id="descricao"
              name="descricao"
              type="text"
              value={formulario.descricao}
              onChange={alterarCampo}
              placeholder="Ex: 20 profissionais de segurança"
            />
          </div>

          <div className="campo-valor-estimado-custo">
            <label htmlFor="valorEstimado">Orçamento de referência (R$)</label>
            <input
              id="valorEstimado"
              name="valorEstimado"
              type="number"
              min="0"
              step="0.01"
              value={formulario.valorEstimado}
              onChange={alterarCampo}
              placeholder="Ex.: 2500,00"
            />
            <small>Valor total que você estima gastar com este serviço, não por unidade. É uma referência de planejamento, não uma média de mercado nem o preço final. Se aceitar uma proposta, ela substituirá esta estimativa no orçamento.</small>
            <label className="opcao-compartilhar-orcamento" htmlFor="mostrarOrcamentoFornecedor">
              <input
                id="mostrarOrcamentoFornecedor"
                name="mostrarOrcamentoFornecedor"
                type="checkbox"
                checked={Boolean(formulario.mostrarOrcamentoFornecedor)}
                onChange={alterarCampo}
              />
              Compartilhar este orçamento de referência com os fornecedores
            </label>
            <small className="nota-privacidade-orcamento">Desmarcado por padrão: fornecedores não verão o valor. Eles sempre poderão enviar sua própria proposta.</small>
          </div>

          <div className="acoes-formulario-custo">
            <button type="submit">
              {itemEmEdicao ? <Pencil size={16} /> : <Plus size={16} />}
              {itemEmEdicao ? 'Salvar alterações' : 'Adicionar serviço'}
            </button>
            {itemEmEdicao && <button type="button" className="cancelar-edicao-custo" onClick={cancelarEdicao}><X size={15} /> Cancelar</button>}
          </div>
        </form>

        {erro && (
          <p className="erro-item-custo">
            {erro}
          </p>
        )}

        {itens.length === 0 ? (
          <div className="itens-custo-vazio">
            <p>
              Nenhum serviço requerido cadastrado.
            </p>
          </div>
        ) : (
          <div className="lista-itens-custo">

            {itens.map((item) => (
              <article
                key={item.id}
                className="item-custo"
              >
                <div>
                  <span>{item.categoria}</span>
                  <h2>{item.descricao}</h2>
                  <small>{item.status || 'Serviço cadastrado'}</small>
                  {item.valorEstimado != null && Number(item.valorEstimado) > 0 && (
                    <strong className="valor-item-custo">Orçamento de referência: {Number(item.valorEstimado).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
                  )}
                  <small className={item.mostrarOrcamentoFornecedor ? 'orcamento-status visivel' : 'orcamento-status privado'}>
                    {item.mostrarOrcamentoFornecedor ? 'Orçamento compartilhado com fornecedores' : 'Orçamento privado: fornecedores não veem este valor'}
                  </small>
                </div>

                <div className="item-custo-acoes">
                  <button type="button" className="botao-editar-custo" onClick={() => editarItem(item)} aria-label={`Editar ${item.descricao}`} title="Editar serviço requerido">
                    <Pencil size={15} />
                  </button>
                  <button type="button" className="botao-excluir-custo" onClick={() => removerItem(item.id)} aria-label={`Excluir ${item.descricao}`} title="Excluir custo">
                    <Trash2 size={15} />
                  </button>
                </div>
              </article>
            ))}

          </div>
        )}

      </section>
    </DashboardLayout>
  )
}

export default ItensCusto