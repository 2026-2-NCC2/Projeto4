import './style.css'

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload } from 'lucide-react'

import DashboardLayout from '../../../../layouts/DashboardLayout'
import menuFornecedor from '../menuFornecedor'

function CompletarCadastroFornecedor() {
  const navigate = useNavigate()

  const [formulario, setFormulario] = useState({
    documento: '',
    nome: '',
    telefone: '',
    cidade: '',
    estado: '',
    segmento: '',
    descricao: ''
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

    if (selecionado.size > 10 * 1024 * 1024) {
      setErro('O arquivo deve possuir no máximo 10 MB.')
      return
    }

    setArquivo(selecionado)
    setErro('')
  }

  function enviar(evento) {
    evento.preventDefault()

    const completo = Object.values(formulario).every(
      (valor) => valor.trim() !== ''
    )

    if (!completo) {
      setErro('Preencha todos os campos obrigatórios.')
      return
    }

    if (!arquivo) {
      setErro('Selecione um documento de identificação.')
      return
    }

    const dados = {
      ...formulario,
      comprovante: arquivo.name,
      cadastroCompleto: true,
      status: 'PENDENTE'
    }

    localStorage.setItem(
      'trocaticket_perfil_fornecedor',
      JSON.stringify(dados)
    )

    setErro('')
    setSucesso('Cadastro enviado para análise.')

    setTimeout(() => {
      navigate('/fornecedor/perfil')
    }, 1000)
  }

  return (
    <DashboardLayout
      tipoUsuario="FORNECEDOR"
      statusVerificacao="Conta em verificação"
      itensMenu={menuFornecedor}
    >

      <section className="completar-cadastro-fornecedor">

        <div className="titulo-cadastro-fornecedor">
          <span>Dados do fornecedor</span>

          <h1>Complete seu cadastro</h1>

          <p>
            Informe seus dados de identificação e atuação para enviar
            seu cadastro para aprovação.
          </p>
        </div>

        <form
          className="formulario-cadastro-fornecedor"
          onSubmit={enviar}
        >

          <label htmlFor="documento">
            CPF ou CNPJ
          </label>

          <input
            id="documento"
            name="documento"
            value={formulario.documento}
            onChange={alterarCampo}
            placeholder="CPF ou CNPJ"
          />

          <label htmlFor="nome">
            Nome completo / Razão social
          </label>

          <input
            id="nome"
            name="nome"
            value={formulario.nome}
            onChange={alterarCampo}
            placeholder="Nome ou razão social"
          />

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

          <div className="linha-fornecedor">
            <div>
              <label htmlFor="cidade">
                Cidade
              </label>

              <input
                id="cidade"
                name="cidade"
                value={formulario.cidade}
                onChange={alterarCampo}
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
              </select>
            </div>
          </div>

          <label htmlFor="segmento">
            Segmento de atuação
          </label>

          <select
            id="segmento"
            name="segmento"
            value={formulario.segmento}
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

          <label htmlFor="descricao">
            Descrição dos serviços e produtos
          </label>

          <textarea
            id="descricao"
            name="descricao"
            maxLength="500"
            value={formulario.descricao}
            onChange={alterarCampo}
            placeholder="Descreva os serviços ou produtos oferecidos"
          />

          <label htmlFor="documentoArquivo">
            Documento de identificação / Cartão CNPJ
          </label>

          <label
            htmlFor="documentoArquivo"
            className="upload-fornecedor"
          >
            <Upload />

            <span>
              {arquivo
                ? arquivo.name
                : 'Selecionar documento'}
            </span>

            <small>
              PDF, PNG ou JPG — máximo 10 MB
            </small>
          </label>

          <input
            id="documentoArquivo"
            className="input-arquivo-fornecedor"
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={selecionarArquivo}
          />

          {erro && (
            <p className="erro-cadastro-fornecedor">
              {erro}
            </p>
          )}

          {sucesso && (
            <p className="sucesso-cadastro-fornecedor">
              {sucesso}
            </p>
          )}

          <button
            type="submit"
            className="enviar-cadastro-fornecedor"
          >
            Completar cadastro
          </button>

        </form>

      </section>

    </DashboardLayout>
  )
}

export default CompletarCadastroFornecedor