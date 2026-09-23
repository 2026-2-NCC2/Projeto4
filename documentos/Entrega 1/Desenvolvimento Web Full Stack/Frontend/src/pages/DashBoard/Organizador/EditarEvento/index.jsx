import './style.css'

import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import DashboardLayout from '../../../../layouts/DashboardLayout'
import menuOrganizador from '../menuOrganizador'

import {
  buscarEventoPorId,
  atualizarEvento
} from '../../../../services/eventos'

function EditarEvento() {
  const { id } = useParams()
  const navigate = useNavigate()

  const eventoSalvo = buscarEventoPorId(id)

  const [formulario, setFormulario] = useState({
    nome: eventoSalvo?.nome || '',
    dataInicio: eventoSalvo?.dataInicio || '',
    dataFim: eventoSalvo?.dataFim || '',
    local: eventoSalvo?.local || '',
    publicoMinimo: eventoSalvo?.publicoMinimo || '',
    publicoMaximo: eventoSalvo?.publicoMaximo || '',
    margemLucro: eventoSalvo?.margemLucro || ''
  })

  const [erro, setErro] = useState('')

  function alterarCampo(evento) {
    const { name, value } = evento.target

    setFormulario({
      ...formulario,
      [name]: value
    })
  }

  function enviarFormulario(evento) {
    evento.preventDefault()

    if (
      !formulario.nome ||
      !formulario.dataInicio ||
      !formulario.dataFim ||
      !formulario.local ||
      !formulario.publicoMinimo ||
      !formulario.publicoMaximo
    ) {
      setErro('Preencha todos os campos obrigatórios.')
      return
    }

    if (
      Number(formulario.publicoMinimo) >
      Number(formulario.publicoMaximo)
    ) {
      setErro('O público mínimo não pode ser maior que o público máximo.')
      return
    }

    atualizarEvento(id, formulario)

    navigate(`/organizador/eventos/${id}`)
  }

  if (!eventoSalvo) {
    return (
      <DashboardLayout
        tipoUsuario="ORGANIZADOR"
        statusVerificacao="Conta em verificação"
        itensMenu={menuOrganizador}
      >
        <section className="edicao-nao-encontrada">
          <h1>Evento não encontrado</h1>

          <button
            type="button"
            onClick={() => navigate('/organizador/eventos')}
          >
            Voltar
          </button>
        </section>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      tipoUsuario="ORGANIZADOR"
      statusVerificacao="Conta em verificação"
      itensMenu={menuOrganizador}
    >
      <section className="pagina-editar-evento">

        <div className="titulo-editar-evento">
          <h1>Editar Evento</h1>

          <p>
            Atualize as informações do evento.
          </p>
        </div>

        <form
          className="formulario-editar-evento"
          onSubmit={enviarFormulario}
        >
          <label htmlFor="nome">
            Nome do evento
          </label>

          <input
            id="nome"
            name="nome"
            type="text"
            value={formulario.nome}
            onChange={alterarCampo}
          />

          <div className="linha-editar-evento">
            <div>
              <label htmlFor="dataInicio">
                Data de início
              </label>

              <input
                id="dataInicio"
                name="dataInicio"
                type="date"
                value={formulario.dataInicio}
                onChange={alterarCampo}
              />
            </div>

            <div>
              <label htmlFor="dataFim">
                Data de término
              </label>

              <input
                id="dataFim"
                name="dataFim"
                type="date"
                value={formulario.dataFim}
                onChange={alterarCampo}
              />
            </div>
          </div>

          <label htmlFor="local">
            Local
          </label>

          <input
            id="local"
            name="local"
            type="text"
            value={formulario.local}
            onChange={alterarCampo}
          />

          <div className="linha-editar-evento">
            <div>
              <label htmlFor="publicoMinimo">
                Público mínimo
              </label>

              <input
                id="publicoMinimo"
                name="publicoMinimo"
                type="number"
                min="1"
                value={formulario.publicoMinimo}
                onChange={alterarCampo}
              />
            </div>

            <div>
              <label htmlFor="publicoMaximo">
                Público máximo
              </label>

              <input
                id="publicoMaximo"
                name="publicoMaximo"
                type="number"
                min="1"
                value={formulario.publicoMaximo}
                onChange={alterarCampo}
              />
            </div>
          </div>

          <label htmlFor="margemLucro">
            Margem de lucro (%)
          </label>

          <input
            id="margemLucro"
            name="margemLucro"
            type="number"
            min="0"
            max="99"
            value={formulario.margemLucro}
            onChange={alterarCampo}
          />

          {erro && (
            <p className="mensagem-erro-edicao">
              {erro}
            </p>
          )}

          <div className="acoes-editar-evento">
            <button
              type="button"
              className="botao-cancelar-edicao"
              onClick={() => navigate(`/organizador/eventos/${id}`)}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="botao-salvar-edicao"
            >
              Salvar alterações
            </button>
          </div>

        </form>

      </section>
    </DashboardLayout>
  )
}

export default EditarEvento