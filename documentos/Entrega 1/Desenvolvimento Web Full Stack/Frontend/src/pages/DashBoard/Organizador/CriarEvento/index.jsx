import './style.css'

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import DashboardLayout from '../../../../layouts/DashboardLayout'
import menuOrganizador from '../menuOrganizador'
import { criarEvento } from '../../../../services/eventos'

function CriarEvento() {
  const navigate = useNavigate()

  const [formulario, setFormulario] = useState({
    nome: '',
    dataInicio: '',
    dataFim: '',
    local: '',
    publicoMinimo: '',
    publicoMaximo: '',
    margemLucro: ''
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

    criarEvento(formulario)

    navigate('/organizador/eventos')
  }

  return (
    <DashboardLayout
      tipoUsuario="ORGANIZADOR"
      statusVerificacao="Conta em verificação"
      itensMenu={menuOrganizador}
    >
      <section className="pagina-criar-evento">
        <div className="titulo-criar-evento">
          <div>
            <h1>Criar Evento</h1>
            <p>
              Preencha os dados necessários para iniciar o planejamento.
            </p>
          </div>
        </div>

        <form
          className="formulario-evento"
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
            placeholder="Ex: Festival Sunset 2026"
          />

          <div className="linha-formulario">
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
            placeholder="Local do evento"
          />

          <div className="linha-formulario">
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
                placeholder="1000"
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
                placeholder="5000"
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
            placeholder="20"
          />

          {erro && (
            <p className="mensagem-erro">
              {erro}
            </p>
          )}

          <div className="acoes-formulario">
            <button
              type="button"
              className="botao-cancelar"
              onClick={() => navigate('/organizador/eventos')}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="botao-salvar-evento"
            >
              Criar evento
            </button>
          </div>
        </form>
      </section>
    </DashboardLayout>
  )
}

export default CriarEvento