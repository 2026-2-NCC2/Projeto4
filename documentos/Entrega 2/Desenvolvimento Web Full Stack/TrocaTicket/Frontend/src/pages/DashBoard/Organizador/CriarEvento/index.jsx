import './style.css'

import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ImagePlus,
  Calendar,
  Clock,
  MapPin,
  Users,
  Percent,
  FileText,
  Briefcase,
  Plus,
  Trash2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  X
} from 'lucide-react'

import DashboardLayout from '../../../../layouts/DashboardLayout'
import menuOrganizador from '../menuOrganizador'
import { criarEvento } from '../../../../services/eventos'
import { obterSessao } from '../../../../services/usuarios'

// Categorias padrão para facilitar a seleção de demandas dos fornecedores
const CATEGORIAS_FORNECEDORES = [
  'Segurança & Portaria',
  'Som & Iluminação',
  'Palco & Estruturas',
  'Bar & Bebidas',
  'Limpeza & Sanitários',
  'Fotografia & Vídeo',
  'Alimentação / Food Trucks',
  'Ambulância / Primeiros Socorros',
  'Geradores & Elétrica'
]

function CriarEvento() {
  const usuario = obterSessao()
  const cadastroAprovado = usuario?.status === 'APROVADO'
  const navigate = useNavigate()
  const inputCapaRef = useRef(null)

  // Estados principais
  const [capaPreview, setCapaPreview] = useState(null)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState(false)

  const [formulario, setFormulario] = useState({
    nome: '',
    categoria: 'Festival',
    descricao: '',
    dataInicio: '',
    horaInicio: '18:00',
    dataFim: '',
    horaFim: '04:00',
    local: '',
    cidade: 'São Paulo - SP',
    publicoMinimo: '',
    publicoMaximo: '',
    margemLucro: '20'
  })

  // Lista dinâmica de demandas para fornecedores
  // Não criar demandas demonstrativas automaticamente: somente os dados informados
  // pelo organizador devem ser persistidos como parte do evento.
  const [requisicoesFornecedores, setRequisicoesFornecedores] = useState([])

  // Estado da nova requisição sendo adicionada
  const [novaCategoria, setNovaCategoria] = useState(CATEGORIAS_FORNECEDORES[0])
  const [novaDescricaoReq, setNovaDescricaoReq] = useState('')

  // Manipulação de imagem da capa
  function handleCapaUpload(e) {
    const arquivo = e.target.files[0]
    if (arquivo) {
      if (arquivo.size > 2 * 1024 * 1024) {
        setErro('A imagem deve ter no máximo 2MB para ser salva com segurança.')
        return
      }
      const leitor = new FileReader()
      leitor.onload = () => {
        setCapaPreview(typeof leitor.result === 'string' ? leitor.result : null)
        setErro('')
      }
      leitor.onerror = () => setErro('Não foi possível ler a imagem selecionada.')
      leitor.readAsDataURL(arquivo)
    }
  }

  function removerCapa() {
    setCapaPreview(null)
    if (inputCapaRef.current) inputCapaRef.current.value = ''
  }

  function alterarCampo(evento) {
    const { name, value } = evento.target
    setFormulario((antigo) => ({ ...antigo, [name]: value }))
  }

  // Adicionar e remover requisições para fornecedores
  function adicionarRequisicao() {
    if (!novaDescricaoReq.trim()) {
      setErro('Informe os detalhes da requisição para fornecedores.')
      return
    }

    setRequisicoesFornecedores((antigas) => [
      ...antigas,
      {
        id: Date.now(),
        categoria: novaCategoria,
        descricao: novaDescricaoReq.trim()
      }
    ])

    setNovaDescricaoReq('')
    setErro('')
  }

  function removerRequisicao(id) {
    setRequisicoesFornecedores((antigas) => antigas.filter((item) => item.id !== id))
  }

  async function enviarFormulario(evento) {
    evento.preventDefault()

    if (
      !formulario.nome ||
      !formulario.dataInicio ||
      !formulario.dataFim ||
      !formulario.local ||
      !formulario.publicoMinimo ||
      !formulario.publicoMaximo
    ) {
      setErro('Preencha os campos obrigatórios marcados com asterisco (*).')
      window.scrollTo({ top: 100, behavior: 'smooth' })
      return
    }

    if (Number(formulario.publicoMinimo) > Number(formulario.publicoMaximo)) {
      setErro('O público mínimo não pode ser maior que o público máximo.')
      return
    }

    const payloadEvento = {
      ...formulario,
      capa: capaPreview,
      requisicoesFornecedores
    }

    try {
      await criarEvento(payloadEvento)
      setSucesso(true)
      setTimeout(() => navigate('/organizador/eventos'), 1000)
    } catch (erroCriacao) {
      setErro(erroCriacao.message || 'Não foi possível criar o evento.')
    }
  }

  return (
    <DashboardLayout
      tipoUsuario="ORGANIZADOR"
      statusVerificacao="Conta em verificação"
      itensMenu={menuOrganizador}
    >
      <div className="pagina-criar-evento-custom">
        {!cadastroAprovado ? (
          <section className="bloco-card-form" role="alert" style={{ maxWidth: 780, margin: '0 auto', padding: 24 }}>
            <h2>Criação de eventos indisponível</h2>
            <p style={{ marginTop: 10, lineHeight: 1.6 }}>
              {usuario?.status === 'INCOMPLETO'
                ? 'Complete seu cadastro e envie as informações obrigatórias para análise da equipe TrocaTicket.'
                : usuario?.status === 'REJEITADO'
                  ? 'Seu cadastro foi rejeitado. Consulte seu perfil e entre em contato com a administração para regularizar o acesso.'
                  : 'Seu cadastro ainda não foi aprovado. Você poderá criar eventos assim que a equipe TrocaTicket concluir a análise.'}
            </p>
            <button type="button" className="btn-criar-evento-topo" style={{ marginTop: 18 }} onClick={() => navigate(usuario?.status === 'INCOMPLETO' ? '/organizador/completar-cadastro' : '/organizador/perfil')}>
              {usuario?.status === 'INCOMPLETO' ? 'Completar cadastro' : 'Consultar meu perfil'}
            </button>
          </section>
        ) : (
          <>
        {/* Topo / Header da página */}

        {erro && (
          <div className="alerta-erro-evento">
            <AlertCircle size={16} />
            <span>{erro}</span>
          </div>
        )}

        {sucesso && (
          <div className="alerta-sucesso-evento">
            <CheckCircle2 size={16} />
            <span>Evento criado com sucesso! Redirecionando...</span>
          </div>
        )}

        <form className="grid-formulario-evento" onSubmit={enviarFormulario}>
          {/* BLOCO 1: CAPA DO EVENTO */}
          <section className="bloco-card-form">
            <div className="titulo-bloco">
              <Sparkles size={16} className="icone-verde" />
              <div>
                <h2>Capa & Identidade Visual</h2>
                <p>Essa imagem será a vitrine principal do seu evento na plataforma.</p>
              </div>
            </div>

            <div className="area-upload-capa">
              {capaPreview ? (
                <div className="preview-capa-ativa">
                  <img src={capaPreview} alt="Capa do Evento" />
                  <button
                    type="button"
                    className="btn-remover-capa"
                    onClick={removerCapa}
                    title="Remover foto"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div
                  className="box-drop-upload"
                  onClick={() => inputCapaRef.current.click()}
                >
                  <div className="icone-upload-circulo">
                    <ImagePlus size={24} />
                  </div>
                  <strong>Carregar imagem de destaque</strong>
                  <span>Formato 16:9 recomendado (JPEG, PNG ou WEBP até 2MB)</span>
                  <button type="button" className="btn-selecionar-arquivo">
                    Selecionar Imagem
                  </button>
                </div>
              )}

              <input
                type="file"
                ref={inputCapaRef}
                onChange={handleCapaUpload}
                accept="image/*"
                style={{ display: 'none' }}
              />
            </div>
          </section>

          {/* BLOCO 2: INFORMAÇÕES BÁSICAS */}
          <section className="bloco-card-form">
            <div className="titulo-bloco">
              <FileText size={16} className="icone-verde" />
              <div>
                <h2>Informações Gerais</h2>
                <p>Nome, estilo e descrição atrativa do evento.</p>
              </div>
            </div>

            <div className="linha-campos-dupla-equal">
              <div className="campo-item">
                <label htmlFor="nome">Nome do Evento *</label>
                <input
                  id="nome"
                  name="nome"
                  type="text"
                  placeholder="Ex: Sunset Sound Festival 2026"
                  value={formulario.nome}
                  onChange={alterarCampo}
                  required
                />
              </div>

              <div className="campo-item">
                <label htmlFor="categoria">Categoria / Formato</label>
                <select
                  id="categoria"
                  name="categoria"
                  value={formulario.categoria}
                  onChange={alterarCampo}
                >
                  <option value="Festival">Festival Musical</option>
                  <option value="Show">Show / Apresentação</option>
                  <option value="Festa">Festa / Balada</option>
                  <option value="Corporativo">Evento Corporativo</option>
                  <option value="Gastronomico">Gastronomia / Beer</option>
                </select>
              </div>
            </div>

            <div className="campo-item">
              <label htmlFor="descricao">Descrição do Evento</label>
              <textarea
                id="descricao"
                name="descricao"
                rows="4"
                placeholder="Conte sobre o conceito do evento, atrações esperadas, público-alvo e proposta de experiência..."
                value={formulario.descricao}
                onChange={alterarCampo}
              />
            </div>
          </section>

          {/* BLOCO 3: DATA, HORÁRIOS E LOCAL */}
          <section className="bloco-card-form">
            <div className="titulo-bloco">
              <Calendar size={16} className="icone-verde" />
              <div>
                <h2>Data, Horário e Local</h2>
                <p>Defina o cronograma e o endereço de realização.</p>
              </div>
            </div>

            <div className="linha-campos-quatro">
              <div className="campo-item">
                <label htmlFor="dataInicio">Data de Início *</label>
                <input
                  id="dataInicio"
                  name="dataInicio"
                  type="date"
                  value={formulario.dataInicio}
                  onChange={alterarCampo}
                  required
                />
              </div>

              <div className="campo-item">
                <label htmlFor="horaInicio">Horário Início</label>
                <div className="input-com-icone-prefix">
                  <Clock size={14} />
                  <input
                    id="horaInicio"
                    name="horaInicio"
                    type="time"
                    value={formulario.horaInicio}
                    onChange={alterarCampo}
                  />
                </div>
              </div>

              <div className="campo-item">
                <label htmlFor="dataFim">Data de Encerramento *</label>
                <input
                  id="dataFim"
                  name="dataFim"
                  type="date"
                  value={formulario.dataFim}
                  onChange={alterarCampo}
                  required
                />
              </div>

              <div className="campo-item">
                <label htmlFor="horaFim">Horário Término</label>
                <div className="input-com-icone-prefix">
                  <Clock size={14} />
                  <input
                    id="horaFim"
                    name="horaFim"
                    type="time"
                    value={formulario.horaFim}
                    onChange={alterarCampo}
                  />
                </div>
              </div>
            </div>

            <div className="linha-campos-dupla-local">
              <div className="campo-item">
                <label htmlFor="local">Espaço / Localização *</label>
                <div className="input-com-icone-prefix">
                  <MapPin size={14} />
                  <input
                    id="local"
                    name="local"
                    type="text"
                    placeholder="Ex: Arena Sunset Open Air"
                    value={formulario.local}
                    onChange={alterarCampo}
                    required
                  />
                </div>
              </div>

              <div className="campo-item">
                <label htmlFor="cidade">Cidade / UF</label>
                <input
                  id="cidade"
                  name="cidade"
                  type="text"
                  placeholder="São Paulo - SP"
                  value={formulario.cidade}
                  onChange={alterarCampo}
                />
              </div>
            </div>
          </section>

          {/* BLOCO 4: CAPACIDADE E VIABILIDADE FINANCEIRA */}
          <section className="bloco-card-form">
            <div className="titulo-bloco">
              <Users size={16} className="icone-verde" />
              <div>
                <h2>Capacidade & Margem Comercial</h2>
                <p>Parâmetros para cálculo de lotes e metas de conversão.</p>
              </div>
            </div>

            <div className="linha-campos-tres">
              <div className="campo-item">
                <label htmlFor="publicoMinimo">Público Mínimo (Break-even) *</label>
                <input
                  id="publicoMinimo"
                  name="publicoMinimo"
                  type="number"
                  placeholder="Ex: 500"
                  value={formulario.publicoMinimo}
                  onChange={alterarCampo}
                  required
                />
              </div>

              <div className="campo-item">
                <label htmlFor="publicoMaximo">Capacidade Total Máxima *</label>
                <input
                  id="publicoMaximo"
                  name="publicoMaximo"
                  type="number"
                  placeholder="Ex: 2500"
                  value={formulario.publicoMaximo}
                  onChange={alterarCampo}
                  required
                />
              </div>

              <div className="campo-item">
                <label htmlFor="margemLucro">Margem de Lucro Almejada (%)</label>
                <div className="input-com-icone-prefix">
                  <Percent size={14} />
                  <input
                    id="margemLucro"
                    name="margemLucro"
                    type="number"
                    min="0"
                    max="90"
                    placeholder="25"
                    value={formulario.margemLucro}
                    onChange={alterarCampo}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* BLOCO 5: REQUISITOS E DEMANDAS PARA FORNECEDORES (VITAL) */}
          <section className="bloco-card-form bloco-destaque-fornecedores">
            <div className="titulo-bloco">
              <Briefcase size={16} className="icone-verde" />
              <div>
                <h2>Requisições Abertas para Fornecedores</h2>
                <p>Publique o que seu evento precisa para receber cotações e propostas de parceiros credenciados.</p>
              </div>
            </div>

            {/* Lista das Requisições Cadastradas */}
            <div className="lista-requisicoes-evento">
              {requisicoesFornecedores.length === 0 ? (
                <div className="estado-vazio-requisicoes">
                  Nenhuma demanda adicionada. Adicione os serviços que você precisará contratar abaixo.
                </div>
              ) : (
                requisicoesFornecedores.map((req) => (
                  <div key={req.id} className="item-requisicao-publicada">
                    <div className="info-requisicao-item">
                      <span className="tag-categoria-requisicao">{req.categoria}</span>
                      <p className="descricao-requisicao-item">{req.descricao}</p>
                    </div>

                    <button
                      type="button"
                      className="btn-excluir-requisicao"
                      onClick={() => removerRequisicao(req.id)}
                      title="Excluir requisição"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Formulário para Adicionar Nova Demanda */}
            <div className="box-adicionar-demanda">
              <span className="titulo-box-demanda">+ Adicionar necessidade do evento</span>

              <div className="linha-campos-add-requisicao">
                <div className="campo-item campo-select-fornecedor">
                  <label>Tipo de Serviço</label>
                  <select
                    value={novaCategoria}
                    onChange={(e) => setNovaCategoria(e.target.value)}
                  >
                    {CATEGORIAS_FORNECEDORES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="campo-item campo-input-fornecedor">
                  <label>O que você precisa exatamente?</label>
                  <input
                    type="text"
                    placeholder="Ex: 8 cabines químicas luxo com higienização periódica"
                    value={novaDescricaoReq}
                    onChange={(e) => setNovaDescricaoReq(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        adicionarRequisicao()
                      }
                    }}
                  />
                </div>

                <button
                  type="button"
                  className="btn-adicionar-requisicao-acao"
                  onClick={adicionarRequisicao}
                >
                  <Plus size={16} />
                  Incluir
                </button>
              </div>
            </div>
          </section>

          {/* BARRA DE AÇÕES INFERIOR */}
          <footer className="barra-acoes-evento">
            <button
              type="button"
              className="btn-cancelar-criacao"
              onClick={() => navigate('/organizador/eventos')}
            >
              Cancelar
            </button>

            <button type="submit" className="btn-publicar-evento">
              Publicar Evento & Abrir Demandas
              <ArrowRight size={16} />
            </button>
          </footer>
        </form>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}

export default CriarEvento