import './style.css'

import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Plus, Trash2 } from 'lucide-react'

import DashboardLayout from '../../../../layouts/DashboardLayout'
import menuOrganizador from '../menuOrganizador'

import {
  buscarEventoPorId,
  adicionarItemCusto,
  excluirItemCusto
} from '../../../../services/eventos'

function ItensCusto() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [evento, setEvento] = useState(buscarEventoPorId(id))

  const [formulario, setFormulario] = useState({
    categoria: '',
    descricao: ''
  })

  const [erro, setErro] = useState('')

  function alterarCampo(event) {
    const { name, value } = event.target

    setFormulario({
      ...formulario,
      [name]: value
    })
  }

  function adicionarItem(event) {
    event.preventDefault()

    if (!formulario.categoria || !formulario.descricao) {
      setErro('Informe a categoria e a descrição do item.')
      return
    }

    adicionarItemCusto(id, formulario)

    setEvento(buscarEventoPorId(id))

    setFormulario({
      categoria: '',
      descricao: ''
    })

    setErro('')
  }

  function removerItem(itemId) {
    excluirItemCusto(id, itemId)

    setEvento(buscarEventoPorId(id))
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

  const itens = evento.itensCusto || []

  return (
    <DashboardLayout
      tipoUsuario="ORGANIZADOR"
      statusVerificacao="Conta em verificação"
      itensMenu={menuOrganizador}
    >
      <section className="pagina-itens-custo">

        <div className="cabecalho-itens-custo">
          <div>
            <h1>Itens de Custo</h1>

            <p>
              {evento.nome}
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate(`/organizador/eventos/${id}`)}
          >
            Voltar ao evento
          </button>
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

              <option value="Outros">
                Outros
              </option>
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

          <button type="submit">
            <Plus />
            Adicionar
          </button>
        </form>

        {erro && (
          <p className="erro-item-custo">
            {erro}
          </p>
        )}

        {itens.length === 0 ? (
          <div className="itens-custo-vazio">
            <p>
              Nenhum item de custo cadastrado.
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
                  <small>{item.status}</small>
                </div>

                <button
                  type="button"
                  onClick={() => removerItem(item.id)}
                  aria-label="Excluir item"
                >
                  <Trash2 />
                </button>
              </article>
            ))}

          </div>
        )}

      </section>
    </DashboardLayout>
  )
}

export default ItensCusto