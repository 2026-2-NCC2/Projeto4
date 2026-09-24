import './style.css'

import { useState } from 'react'
import {
  useNavigate,
  useSearchParams
} from 'react-router-dom'

import DashboardLayout from '../../../../layouts/DashboardLayout'
import menuFornecedor from '../menuFornecedor'

import { buscarEventoPorId } from '../../../../services/eventos'
import { criarProposta } from '../../../../services/propostas'

function CriarProposta() {
  const navigate = useNavigate()

  const [parametros] = useSearchParams()

  const eventoId = parametros.get('evento')
  const itemId = parametros.get('item')

  const evento = buscarEventoPorId(eventoId)

  const item = evento?.itensCusto?.find(
    (item) => String(item.id) === String(itemId)
  )

  const [formulario, setFormulario] = useState({
    valor: '',
    validade: '',
    descricao: '',
    observacoes: ''
  })

  const [erro, setErro] = useState('')

  function alterarCampo(evento) {
    const { name, value } = evento.target

    setFormulario({
      ...formulario,
      [name]: value
    })
  }

  function enviar(eventoFormulario) {
    eventoFormulario.preventDefault()

    if (!evento || !item) {
      setErro('Selecione um evento e um item válido.')
      return
    }

    if (
      !formulario.valor ||
      !formulario.validade ||
      !formulario.descricao
    ) {
      setErro('Preencha todos os campos obrigatórios.')
      return
    }

    if (Number(formulario.valor) <= 0) {
      setErro('Informe um valor válido.')
      return
    }

    criarProposta({
      ...formulario,
      eventoId: evento.id,
      evento: evento.nome,
      itemId: item.id,
      item: item.descricao,
      categoria: item.categoria
    })

    navigate('/fornecedor/propostas')
  }

  if (!evento || !item) {
    return (
      <DashboardLayout
        tipoUsuario="FORNECEDOR"
        statusVerificacao="Conta em verificação"
        itensMenu={menuFornecedor}
      >
        <section className="proposta-sem-oportunidade">
          <h1>Selecione uma oportunidade</h1>

          <p>
            Escolha um evento e um item antes de criar uma proposta.
          </p>

          <button
            type="button"
            onClick={() => navigate('/fornecedor/procurar-evento')}
          >
            Procurar evento
          </button>
        </section>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      tipoUsuario="FORNECEDOR"
      statusVerificacao="Conta em verificação"
      itensMenu={menuFornecedor}
    >

      <section className="pagina-criar-proposta">

        <div className="titulo-criar-proposta">
          <h1>Criar Proposta</h1>

          <p>
            {evento.nome} — {item.categoria}
          </p>
        </div>

        <div className="resumo-oportunidade">
          <span>Item solicitado</span>
          <strong>{item.descricao}</strong>
        </div>

        <form
          className="formulario-proposta"
          onSubmit={enviar}
        >

          <label htmlFor="valor">
            Valor da proposta
          </label>

          <input
            id="valor"
            name="valor"
            type="number"
            min="0"
            step="0.01"
            value={formulario.valor}
            onChange={alterarCampo}
            placeholder="0,00"
          />

          <label htmlFor="validade">
            Validade
          </label>

          <input
            id="validade"
            name="validade"
            type="date"
            value={formulario.validade}
            onChange={alterarCampo}
          />

          <label htmlFor="descricao">
            Descrição
          </label>

          <textarea
            id="descricao"
            name="descricao"
            value={formulario.descricao}
            onChange={alterarCampo}
            placeholder="Descreva os serviços oferecidos"
          />

          <label htmlFor="observacoes">
            Observações
          </label>

          <textarea
            id="observacoes"
            name="observacoes"
            value={formulario.observacoes}
            onChange={alterarCampo}
            placeholder="Informações adicionais"
          />

          {erro && (
            <p className="erro-proposta">
              {erro}
            </p>
          )}

          <div className="acoes-proposta">

            <button
              type="button"
              onClick={() =>
                navigate(`/fornecedor/eventos/${evento.id}`)
              }
            >
              Cancelar
            </button>

            <button type="submit">
              Enviar proposta
            </button>

          </div>

        </form>

      </section>

    </DashboardLayout>
  )
}

export default CriarProposta