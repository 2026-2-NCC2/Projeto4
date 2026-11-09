import './style.css'

import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  ImagePlus,
  LoaderCircle,
  MapPin,
  Percent,
  Save,
  Users,
  X,
} from 'lucide-react'

import DashboardLayout from '../../../../layouts/DashboardLayout'
import menuOrganizador from '../menuOrganizador'
import { buscarEventoPorIdApi, atualizarEvento } from '../../../../services/eventos'
import { obterSessao } from '../../../../services/usuarios'

const VALORES_INICIAIS = {
  nome: '',
  categoria: 'Festival',
  descricao: '',
  dataInicio: '',
  horaInicio: '',
  dataFim: '',
  horaFim: '',
  local: '',
  cidade: '',
  publicoMinimo: '',
  publicoMaximo: '',
  margemLucro: '20',
}

function dataParaInput(valor) {
  if (!valor) return ''
  const texto = String(valor)
  if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) return texto
  const iso = texto.match(/^(\d{4}-\d{2}-\d{2})/)
  if (iso) return iso[1]
  const brasileira = texto.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (brasileira) return `${brasileira[3]}-${brasileira[2]}-${brasileira[1]}`
  return ''
}

function normalizarFormulario(evento) {
  return {
    nome: evento?.nome || '',
    categoria: evento?.categoria || 'Festival',
    descricao: evento?.descricao || '',
    dataInicio: dataParaInput(evento?.dataInicio),
    horaInicio: evento?.horaInicio || '',
    dataFim: dataParaInput(evento?.dataFim),
    horaFim: evento?.horaFim || '',
    local: evento?.local || '',
    cidade: evento?.cidade || '',
    publicoMinimo: evento?.publicoMinimo ?? '',
    publicoMaximo: evento?.publicoMaximo ?? '',
    margemLucro: evento?.margemLucro ?? '20',
  }
}

function EditarEvento() {
  const { id } = useParams()
  const navigate = useNavigate()
  const usuario = obterSessao()
  const inputCapaRef = useRef(null)

  const [eventoOriginal, setEventoOriginal] = useState(null)
  const [formulario, setFormulario] = useState(VALORES_INICIAIS)
  const [capaPreview, setCapaPreview] = useState(null)
  const [capaAlterada, setCapaAlterada] = useState(false)
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState(false)

  useEffect(() => {
    let cancelado = false
    setCarregando(true)
    setErro('')

    buscarEventoPorIdApi(id)
      .then((evento) => {
        if (cancelado) return
        if (!evento) {
          setErro('Não foi possível localizar este evento.')
          return
        }
        setEventoOriginal(evento)
        setFormulario(normalizarFormulario(evento))
        setCapaPreview(evento.capa || null)
        setCapaAlterada(false)
      })
      .catch((erroBusca) => {
        if (!cancelado) setErro(erroBusca.message || 'Não foi possível carregar os dados do evento.')
      })
      .finally(() => {
        if (!cancelado) setCarregando(false)
      })

    return () => { cancelado = true }
  }, [id])

  function alterarCampo(evento) {
    const { name, value } = evento.target
    setFormulario((atual) => ({ ...atual, [name]: value }))
  }

  function selecionarCapa(evento) {
    const arquivo = evento.target.files?.[0]
    if (!arquivo) return

    const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp']
    if (!tiposPermitidos.includes(arquivo.type)) {
      setErro('Escolha uma imagem JPG, PNG ou WEBP.')
      evento.target.value = ''
      return
    }
    if (arquivo.size > 2 * 1024 * 1024) {
      setErro('A imagem deve ter no máximo 2 MB.')
      evento.target.value = ''
      return
    }

    const leitor = new FileReader()
    leitor.onload = () => {
      if (typeof leitor.result === 'string') {
        setCapaPreview(leitor.result)
        setCapaAlterada(true)
        setErro('')
      }
    }
    leitor.onerror = () => setErro('Não foi possível ler a imagem selecionada.')
    leitor.readAsDataURL(arquivo)
  }

  function removerCapa() {
    setCapaPreview(null)
    setCapaAlterada(true)
    if (inputCapaRef.current) inputCapaRef.current.value = ''
  }

  async function enviarFormulario(evento) {
    evento.preventDefault()
    setErro('')
    setSucesso(false)

    if (!formulario.nome.trim() || !formulario.categoria.trim() || !formulario.dataInicio || !formulario.dataFim || !formulario.local.trim() || !formulario.publicoMinimo || !formulario.publicoMaximo) {
      setErro('Preencha os campos obrigatórios marcados com asterisco (*).')
      return
    }
    if (formulario.dataFim < formulario.dataInicio) {
      setErro('A data de término não pode ser anterior à data de início.')
      return
    }
    if (Number(formulario.publicoMinimo) < 1 || Number(formulario.publicoMaximo) < 1) {
      setErro('Informe uma quantidade de público maior que zero.')
      return
    }
    if (Number(formulario.publicoMinimo) > Number(formulario.publicoMaximo)) {
      setErro('O público mínimo não pode ser maior que o público máximo.')
      return
    }
    if (Number(formulario.margemLucro) < 0 || Number(formulario.margemLucro) > 99) {
      setErro('A margem de lucro deve estar entre 0% e 99%.')
      return
    }

    setSalvando(true)
    try {
      const dadosAtualizados = {
        ...formulario,
        nome: formulario.nome.trim(),
        categoria: formulario.categoria.trim(),
        descricao: formulario.descricao.trim(),
        local: formulario.local.trim(),
        cidade: formulario.cidade.trim(),
        publicoMinimo: Number(formulario.publicoMinimo),
        publicoMaximo: Number(formulario.publicoMaximo),
        margemLucro: Number(formulario.margemLucro || 0),
        // Se a imagem não foi alterada, preserva exatamente a capa já salva.
        capa: capaAlterada ? capaPreview : (eventoOriginal?.capa || null),
      }

      await atualizarEvento(id, dadosAtualizados)
      setSucesso(true)
      window.setTimeout(() => navigate(`/organizador/eventos/${id}`), 700)
    } catch (erroAtualizacao) {
      setErro(erroAtualizacao.message || 'Não foi possível atualizar o evento.')
    } finally {
      setSalvando(false)
    }
  }

  const statusAprovacao = String(eventoOriginal?.statusAprovacao || 'PENDENTE').toUpperCase()
  const statusCabecalho = usuario?.status === 'APROVADO'
    ? 'Conta aprovada'
    : usuario?.status === 'PENDENTE'
      ? 'Conta em verificação'
      : usuario?.status === 'REJEITADO'
        ? 'Conta rejeitada'
        : 'Cadastro incompleto'
  const mensagemStatus = statusAprovacao === 'APROVADO'
    ? 'Este evento já foi aprovado. Ao salvar alterações, ele voltará para análise administrativa.'
    : statusAprovacao === 'REJEITADO'
      ? 'Este evento foi rejeitado. Ao salvar as alterações, ele será enviado novamente para análise.'
      : 'As alterações serão enviadas para análise da equipe TrocaTicket.'

  return (
    <DashboardLayout
      tipoUsuario="ORGANIZADOR"
      statusVerificacao={statusCabecalho}
      itensMenu={menuOrganizador}
    >
      <section className="pagina-editar-evento">
        <header className="titulo-editar-evento">
          <button type="button" className="voltar-edicao-evento" onClick={() => navigate(`/organizador/eventos/${id}`)}>
            <ArrowLeft size={16} /> Voltar ao evento
          </button>
          <h1>Editar evento</h1>
          <p>Altere os dados e a imagem de capa do seu evento.</p>
        </header>

        {carregando ? (
          <div className="estado-edicao-evento">
            <LoaderCircle className="girar-icone" size={22} />
            <span>Carregando os dados atuais do evento...</span>
          </div>
        ) : !eventoOriginal ? (
          <div className="mensagem-erro-edicao" role="alert">
            <AlertCircle size={18} />
            <div>
              <strong>Não foi possível abrir a edição</strong>
              <p>{erro || 'O evento não foi encontrado.'}</p>
              <button type="button" onClick={() => navigate('/organizador/eventos')}>Voltar para meus eventos</button>
            </div>
          </div>
        ) : (
          <form className="formulario-editar-evento" onSubmit={enviarFormulario}>
            <section className="secao-edicao-evento">
              <div className="subtitulo-secao-edicao">
                <ImagePlus size={18} />
                <div>
                  <h2>Capa do evento</h2>
                  <p>Envie uma nova imagem ou remova a atual. JPG, PNG ou WEBP, até 2 MB.</p>
                </div>
              </div>

              {capaPreview ? (
                <div className="preview-capa-edicao">
                  <img src={capaPreview} alt={`Capa de ${formulario.nome || 'evento'}`} />
                  <div className="acoes-capa-edicao">
                    <button type="button" onClick={() => inputCapaRef.current?.click()}>
                      <ImagePlus size={15} /> Trocar imagem
                    </button>
                    <button type="button" className="remover-capa-edicao" onClick={removerCapa}>
                      <X size={15} /> Remover
                    </button>
                  </div>
                </div>
              ) : (
                <button type="button" className="area-capa-vazia-edicao" onClick={() => inputCapaRef.current?.click()}>
                  <ImagePlus size={25} />
                  <strong>Adicionar imagem de capa</strong>
                  <span>Selecione uma imagem para destacar seu evento.</span>
                </button>
              )}
              <input
                ref={inputCapaRef}
                className="input-arquivo-capa-edicao"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={selecionarCapa}
              />
            </section>

            <section className="secao-edicao-evento">
              <div className="subtitulo-secao-edicao">
                <CalendarDays size={18} />
                <div>
                  <h2>Informações gerais</h2>
                  <p>Esses dados serão exibidos aos usuários conforme as regras de aprovação.</p>
                </div>
              </div>

              <div className="grade-campos-edicao">
                <div className="campo-edicao campo-edicao-largo">
                  <label htmlFor="nome">Nome do evento *</label>
                  <input id="nome" name="nome" maxLength={180} value={formulario.nome} onChange={alterarCampo} required />
                </div>

                <div className="campo-edicao">
                  <label htmlFor="categoria">Categoria *</label>
                  <input id="categoria" name="categoria" maxLength={100} value={formulario.categoria} onChange={alterarCampo} required />
                </div>

                <div className="campo-edicao campo-edicao-largo">
                  <label htmlFor="descricao">Descrição do evento</label>
                  <textarea id="descricao" name="descricao" rows={4} maxLength={5000} value={formulario.descricao} onChange={alterarCampo} placeholder="Conte aos fornecedores e à equipe sobre o evento." />
                </div>

                <div className="campo-edicao">
                  <label htmlFor="dataInicio"><CalendarDays size={13} /> Data de início *</label>
                  <input id="dataInicio" name="dataInicio" type="date" value={formulario.dataInicio} onChange={alterarCampo} required />
                </div>
                <div className="campo-edicao">
                  <label htmlFor="horaInicio"><Clock3 size={13} /> Horário de início</label>
                  <input id="horaInicio" name="horaInicio" type="time" value={formulario.horaInicio} onChange={alterarCampo} />
                </div>
                <div className="campo-edicao">
                  <label htmlFor="dataFim"><CalendarDays size={13} /> Data de término *</label>
                  <input id="dataFim" name="dataFim" type="date" value={formulario.dataFim} onChange={alterarCampo} required />
                </div>
                <div className="campo-edicao">
                  <label htmlFor="horaFim"><Clock3 size={13} /> Horário de término</label>
                  <input id="horaFim" name="horaFim" type="time" value={formulario.horaFim} onChange={alterarCampo} />
                </div>
                <div className="campo-edicao">
                  <label htmlFor="local"><MapPin size={13} /> Local *</label>
                  <input id="local" name="local" maxLength={180} value={formulario.local} onChange={alterarCampo} required />
                </div>
                <div className="campo-edicao">
                  <label htmlFor="cidade">Cidade / Estado</label>
                  <input id="cidade" name="cidade" maxLength={120} value={formulario.cidade} onChange={alterarCampo} placeholder="Ex.: São Paulo - SP" />
                </div>
                <div className="campo-edicao">
                  <label htmlFor="publicoMinimo"><Users size={13} /> Público mínimo *</label>
                  <input id="publicoMinimo" name="publicoMinimo" type="number" min="1" value={formulario.publicoMinimo} onChange={alterarCampo} required />
                </div>
                <div className="campo-edicao">
                  <label htmlFor="publicoMaximo"><Users size={13} /> Público máximo *</label>
                  <input id="publicoMaximo" name="publicoMaximo" type="number" min="1" value={formulario.publicoMaximo} onChange={alterarCampo} required />
                </div>
                <div className="campo-edicao">
                  <label htmlFor="margemLucro"><Percent size={13} /> Margem de lucro</label>
                  <input id="margemLucro" name="margemLucro" type="number" min="0" max="99" step="0.01" value={formulario.margemLucro} onChange={alterarCampo} />
                </div>
              </div>
            </section>

            <div className="aviso-revisao-edicao">
              <AlertCircle size={17} />
              <span>{mensagemStatus}</span>
            </div>

            {erro && (
              <div className="mensagem-erro-edicao" role="alert">
                <AlertCircle size={17} /> <span>{erro}</span>
              </div>
            )}
            {sucesso && (
              <div className="mensagem-sucesso-edicao" role="status">
                <CheckCircle2 size={17} /> Alterações salvas. O evento será enviado para análise novamente.
              </div>
            )}

            <footer className="acoes-editar-evento">
              <button type="button" className="botao-cancelar-edicao" onClick={() => navigate(`/organizador/eventos/${id}`)} disabled={salvando}>
                Cancelar
              </button>
              <button type="submit" className="botao-salvar-edicao" disabled={salvando}>
                {salvando ? <LoaderCircle className="girar-icone" size={16} /> : <Save size={16} />}
                {salvando ? 'Salvando...' : 'Salvar alterações'}
              </button>
            </footer>
          </form>
        )}
      </section>
    </DashboardLayout>
  )
}

export default EditarEvento
