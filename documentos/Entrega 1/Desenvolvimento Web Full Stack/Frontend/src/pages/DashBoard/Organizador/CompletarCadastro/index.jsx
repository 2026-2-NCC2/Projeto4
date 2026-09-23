import './style.css'

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload } from 'lucide-react'

import DashboardLayout from '../../../../layouts/DashboardLayout'
import menuOrganizador from '../menuOrganizador'

function CompletarCadastroOrganizador() {
  const navigate = useNavigate()

  const [formulario, setFormulario] = useState({
    responsavel: '',
    razaoSocial: '',
    cnpj: '',
    telefone: '',
    cidade: '',
    estado: ''
  })

  const [arquivo, setArquivo] = useState(null)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')

  function alterarCampo(evento) {
    const { name, value } = evento.target

    setFormulario({
      ...formulario,
      [name]: value
    })
  }

  function selecionarArquivo(evento) {
    const selecionado = evento.target.files[0]

    if (!selecionado) {
      return
    }

    const tamanhoMaximo = 10 * 1024 * 1024

    if (selecionado.size > tamanhoMaximo) {
      setErro('O arquivo deve possuir no máximo 10 MB.')
      return
    }

    setArquivo(selecionado)
    setErro('')
  }

  function enviar(evento) {
    evento.preventDefault()

    const camposPreenchidos = Object.values(formulario).every(
      (valor) => valor.trim() !== ''
    )

    if (!camposPreenchidos) {
      setErro('Preencha todos os campos obrigatórios.')
      return
    }

    if (!arquivo) {
      setErro('Selecione o comprovante de inscrição ou cartão CNPJ.')
      return
    }

    const dados = {
      ...formulario,
      comprovante: arquivo.name,
      cadastroCompleto: true,
      status: 'PENDENTE'
    }

    localStorage.setItem(
      'trocaticket_perfil_organizador',
      JSON.stringify(dados)
    )

    setErro('')
    setSucesso('Cadastro enviado para análise.')

    setTimeout(() => {
      navigate('/organizador/perfil')
    }, 1000)
  }

  return (
    <DashboardLayout
      tipoUsuario="ORGANIZADOR"
      statusVerificacao="Conta em verificação"
      itensMenu={menuOrganizador}
    >

      <section className="completar-cadastro-organizador">

        <div className="titulo-completar-cadastro">
          <span>Dados empresariais</span>

          <h1>Complete seu cadastro</h1>

          <p>
            Preencha os dados da organização para enviar seu cadastro
            para análise da TrocaTicket.
          </p>
        </div>

        <form
          className="formulario-completar-cadastro"
          onSubmit={enviar}
        >

          <label htmlFor="responsavel">
            Nome do responsável
          </label>

          <input
            id="responsavel"
            name="responsavel"
            value={formulario.responsavel}
            onChange={alterarCampo}
            placeholder="Nome completo"
          />

          <label htmlFor="razaoSocial">
            Razão Social / Nome Fantasia
          </label>

          <input
            id="razaoSocial"
            name="razaoSocial"
            value={formulario.razaoSocial}
            onChange={alterarCampo}
            placeholder="Nome da organização"
          />

          <div className="linha-cadastro">
            <div>
              <label htmlFor="cnpj">
                CNPJ
              </label>

              <input
                id="cnpj"
                name="cnpj"
                value={formulario.cnpj}
                onChange={alterarCampo}
                placeholder="00.000.000/0001-00"
              />
            </div>

            <div>
              <label htmlFor="telefone">
                Telefone / WhatsApp
              </label>

              <input
                id="telefone"
                name="telefone"
                value={formulario.telefone}
                onChange={alterarCampo}
                placeholder="(11) 99999-9999"
              />
            </div>
          </div>

          <div className="linha-cadastro">
            <div>
              <label htmlFor="cidade">
                Cidade
              </label>

              <input
                id="cidade"
                name="cidade"
                value={formulario.cidade}
                onChange={alterarCampo}
                placeholder="São Paulo"
              />
            </div>

            <div>
              <label htmlFor="estado">
                Estado
              </label>

              <select
                id="estado"
                name="estado"
                value={formulario.estado}
                onChange={alterarCampo}
              >
                <option value="">UF</option>
                <option value="SP">SP</option>
                <option value="RJ">RJ</option>
                <option value="MG">MG</option>
                <option value="PR">PR</option>
                <option value="SC">SC</option>
                <option value="RS">RS</option>
                <option value="BA">BA</option>
                <option value="PE">PE</option>
                <option value="GO">GO</option>
                <option value="DF">DF</option>
              </select>
            </div>
          </div>

          <label htmlFor="comprovante">
            Comprovante de inscrição / Cartão CNPJ
          </label>

          <label
            htmlFor="comprovante"
            className="campo-upload"
          >
            <Upload />

            <span>
              {arquivo
                ? arquivo.name
                : 'Selecionar comprovante'}
            </span>

            <small>
              PDF, PNG ou JPG — máximo 10 MB
            </small>
          </label>

          <input
            id="comprovante"
            className="input-arquivo"
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={selecionarArquivo}
          />

          {erro && (
            <p className="erro-cadastro-completo">
              {erro}
            </p>
          )}

          {sucesso && (
            <p className="sucesso-cadastro-completo">
              {sucesso}
            </p>
          )}

          <button
            className="botao-enviar-cadastro"
            type="submit"
          >
            Completar cadastro
          </button>

        </form>

      </section>

    </DashboardLayout>
  )
}

export default CompletarCadastroOrganizador