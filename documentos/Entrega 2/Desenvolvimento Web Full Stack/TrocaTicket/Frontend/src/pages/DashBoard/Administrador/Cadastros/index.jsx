import './style.css'
import { useEffect, useState } from 'react'
import { Check, X, FileText, RefreshCw, RotateCcw, Clock3, Archive } from 'lucide-react'

import DashboardLayout from '../../../../layouts/DashboardLayout'
import menuAdministrador from '../menuAdministrador'
import {
  listarUsuariosDoServidor,
  alterarStatusUsuarioNoServidor,
  baixarDocumentoUsuario
} from '../../../../services/usuarios'

function normalizarStatus(valor) {
  return String(valor || 'INCOMPLETO').trim().toUpperCase()
}

function valorOuPadrao(valor) {
  if (valor === null || valor === undefined || String(valor).trim() === '') return 'Não informado'
  return String(valor)
}

function formatarData(valor) {
  if (!valor) return 'Não informada'
  const data = new Date(valor)
  return Number.isNaN(data.getTime()) ? String(valor) : data.toLocaleString('pt-BR')
}

function abaDoStatus(status) {
  const normalizado = normalizarStatus(status)
  if (normalizado === 'APROVADO' || normalizado === 'REJEITADO') return 'verificados'
  if (normalizado === 'INCOMPLETO') return 'incompletos'
  return 'pendentes'
}

function CadastrosAdministrador() {
  const [usuarios, setUsuarios] = useState([])
  const [aba, setAba] = useState('pendentes')
  const [carregando, setCarregando] = useState(true)
  const [atualizandoId, setAtualizandoId] = useState('')
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')

  async function carregarUsuarios() {
    setCarregando(true)
    setErro('')
    try {
      const lista = await listarUsuariosDoServidor()
      setUsuarios(Array.isArray(lista) ? lista : [])
    } catch (falha) {
      setErro(falha.message || 'Não foi possível carregar os cadastros do servidor.')
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => { carregarUsuarios() }, [])

  const pendentes = usuarios.filter((usuario) => normalizarStatus(usuario.status) === 'PENDENTE')
  const verificados = usuarios.filter((usuario) => ['APROVADO', 'REJEITADO'].includes(normalizarStatus(usuario.status)))
  const incompletos = usuarios.filter((usuario) => normalizarStatus(usuario.status) === 'INCOMPLETO')
  const listaVisivel = aba === 'verificados' ? verificados : aba === 'incompletos' ? incompletos : pendentes

  async function alterarStatus(usuario, status) {
    setAtualizandoId(String(usuario.id))
    setErro('')
    setSucesso('')
    try {
      const atualizado = await alterarStatusUsuarioNoServidor(usuario.id, status)
      setUsuarios((atuais) => atuais.map((item) => String(item.id) === String(atualizado.id) ? atualizado : item))
      setAba(abaDoStatus(atualizado.status || status))
      const nome = atualizado.razaoSocial || atualizado.nome || atualizado.email
      const destino = abaDoStatus(atualizado.status || status) === 'verificados'
        ? ' O cadastro foi movido para a lista Verificados.'
        : abaDoStatus(atualizado.status || status) === 'incompletos'
          ? ' O cadastro foi movido para a lista Incompletos.'
          : ' O cadastro foi movido para a lista Para verificar.'
      setSucesso(`Cadastro de ${nome} atualizado para ${normalizarStatus(atualizado.status || status)}.${destino}`)
    } catch (falha) {
      setErro(falha.message || 'Não foi possível alterar o status do cadastro.')
    } finally {
      setAtualizandoId('')
    }
  }

  function botoesDoStatus(usuario) {
    const status = normalizarStatus(usuario.status)
    const atualizando = atualizandoId === String(usuario.id)
    if (status === 'PENDENTE') {
      return (
        <>
          <button type="button" className="aprovar-cadastro" disabled={atualizando} onClick={() => alterarStatus(usuario, 'APROVADO')}>
            <Check size={15} /> {atualizando ? 'Salvando...' : 'Aprovar cadastro'}
          </button>
          <button type="button" className="rejeitar-cadastro" disabled={atualizando} onClick={() => alterarStatus(usuario, 'REJEITADO')}>
            <X size={15} /> Rejeitar cadastro
          </button>
        </>
      )
    }
    if (status === 'REJEITADO') {
      return (
        <>
          <button type="button" className="aprovar-cadastro" disabled={atualizando} onClick={() => alterarStatus(usuario, 'APROVADO')}>
            <Check size={15} /> {atualizando ? 'Salvando...' : 'Reaprovar cadastro'}
          </button>
          <button type="button" className="reabrir-cadastro" disabled={atualizando} onClick={() => alterarStatus(usuario, 'PENDENTE')}>
            <RotateCcw size={15} /> Voltar para análise
          </button>
        </>
      )
    }
    if (status === 'APROVADO') {
      return (
        <>
          <button type="button" className="rejeitar-cadastro" disabled={atualizando} onClick={() => alterarStatus(usuario, 'REJEITADO')}>
            <X size={15} /> Rejeitar cadastro
          </button>
          <button type="button" className="reabrir-cadastro" disabled={atualizando} onClick={() => alterarStatus(usuario, 'PENDENTE')}>
            <RotateCcw size={15} /> Voltar para análise
          </button>
        </>
      )
    }
    return (
      <>
        <button type="button" className="aprovar-cadastro" disabled={atualizando} onClick={() => alterarStatus(usuario, 'PENDENTE')}>
          <Clock3 size={15} /> Enviar para análise
        </button>
        <button type="button" className="rejeitar-cadastro" disabled={atualizando} onClick={() => alterarStatus(usuario, 'REJEITADO')}>
          <X size={15} /> Rejeitar cadastro
        </button>
      </>
    )
  }

  const titulos = {
    pendentes: ['Cadastros para verificar', 'Confira os dados e aprove ou rejeite os cadastros que aguardam análise.'],
    verificados: ['Cadastros verificados', 'Consulte os cadastros aprovados ou rejeitados e altere o status quando necessário.'],
    incompletos: ['Cadastros incompletos', 'Confira os cadastros que ainda não foram enviados para análise.']
  }

  return (
    <DashboardLayout tipoUsuario="ADMINISTRADOR" statusVerificacao="Gestão da plataforma" itensMenu={menuAdministrador}>
      <section className="pagina-cadastros-admin">
        <div className="titulo-cadastros-admin">
          <div>
            <h1>Verificação de usuários</h1>
            <p>Gerencie os cadastros e consulte o histórico de aprovação dos organizadores e fornecedores.</p>
          </div>
          <button type="button" className="atualizar-cadastros-admin" onClick={carregarUsuarios} disabled={carregando}>
            <RefreshCw size={15} /> Atualizar lista
          </button>
        </div>

        <div className="abas-cadastros-admin" role="tablist" aria-label="Listas de cadastros">
          <button type="button" role="tab" aria-selected={aba === 'pendentes'} className={aba === 'pendentes' ? 'aba-cadastro-admin ativa' : 'aba-cadastro-admin'} onClick={() => setAba('pendentes')}>
            <Clock3 size={15} /> Para verificar <span>{pendentes.length}</span>
          </button>
          <button type="button" role="tab" aria-selected={aba === 'verificados'} className={aba === 'verificados' ? 'aba-cadastro-admin ativa' : 'aba-cadastro-admin'} onClick={() => setAba('verificados')}>
            <Archive size={15} /> Verificados <span>{verificados.length}</span>
          </button>
          <button type="button" role="tab" aria-selected={aba === 'incompletos'} className={aba === 'incompletos' ? 'aba-cadastro-admin ativa' : 'aba-cadastro-admin'} onClick={() => setAba('incompletos')}>
            <FileText size={15} /> Incompletos <span>{incompletos.length}</span>
          </button>
        </div>

        <div className="subtitulo-lista-cadastros-admin">
          <div>
            <h2>{titulos[aba][0]}</h2>
            <p>{titulos[aba][1]}</p>
          </div>
        </div>

        {erro && <p className="mensagem-erro-admin" role="alert">{erro}</p>}
        {sucesso && <p className="mensagem-sucesso-admin" role="status">{sucesso}</p>}
        {carregando && <p className="estado-lista-admin">Carregando cadastros do banco de dados...</p>}
        {!carregando && listaVisivel.length === 0 && !erro && (
          <p className="estado-lista-admin">
            {aba === 'pendentes' ? 'Não há cadastros aguardando verificação.' : aba === 'verificados' ? 'Ainda não há cadastros aprovados ou rejeitados.' : 'Não há cadastros incompletos.'}
          </p>
        )}

        <div className="lista-cadastros-admin">
          {listaVisivel.map((usuario) => {
            const nomeExibicao = usuario.razaoSocial || usuario.nome || usuario.responsavel || usuario.email
            const localidade = [usuario.cidade, usuario.estado].filter(Boolean).join(' / ')
            const statusNormalizado = normalizarStatus(usuario.status)
            const statusClasse = statusNormalizado.toLowerCase().replace(/[^a-z0-9-]/g, '-')
            const campos = [
              ['Responsável', usuario.responsavel],
              ['Nome / razão social', usuario.razaoSocial || usuario.nome],
              ['CPF / CNPJ', usuario.cnpj || usuario.documento],
              ['E-mail', usuario.email],
              ['Telefone / WhatsApp', usuario.telefone],
              ['Cidade / estado', localidade],
              ['Área de atuação', usuario.segmento || usuario.areaAtuacao],
              ['Descrição dos serviços / produtos', usuario.descricao],
              ['Documento anexado', usuario.comprovante],
              ['Enviado em', formatarData(usuario.comprovanteEnviadoEm)]
            ]
            return (
              <article className="card-cadastro-admin" key={usuario.id}>
                <div className="cabecalho-card-cadastro-admin">
                  <div className="dados-cadastro-admin">
                    <span>{usuario.perfil === 'FORNECEDOR' ? 'Fornecedor' : 'Organizador'}</span>
                    <h2>{nomeExibicao}</h2>
                    <p>Cadastro criado em {formatarData(usuario.criado_em || usuario.criadoEm)}</p>
                  </div>
                  <div className="status-cadastro-admin">
                    <strong className={`status-admin ${statusClasse}`}>{statusNormalizado}</strong>
                    {usuario.comprovanteArquivo && (
                      <button type="button" className="aprovar-cadastro" onClick={async () => {
                        setErro('')
                        try { await baixarDocumentoUsuario(usuario.id, usuario.comprovante || 'comprovante') }
                        catch (falha) { setErro(falha.message || 'Não foi possível baixar o documento.') }
                      }}>
                        <FileText size={15} /> Ver documento
                      </button>
                    )}
                  </div>
                </div>

                <div className="detalhes-cadastro-admin">
                  <h3>Dados complementares informados</h3>
                  <dl className="grade-dados-cadastro-admin">
                    {campos.map(([rotulo, valor]) => (
                      <div className={rotulo.startsWith('Descrição') ? 'campo-dado-admin campo-dado-largo-admin' : 'campo-dado-admin'} key={rotulo}>
                        <dt>{rotulo}</dt>
                        <dd>{valorOuPadrao(valor)}</dd>
                      </div>
                    ))}
                  </dl>
                  {usuario.fotoPerfil && (
                    <div className="foto-cadastro-admin">
                      <span>Foto de perfil</span>
                      <img src={usuario.fotoPerfil} alt={`Foto de perfil de ${nomeExibicao}`} />
                    </div>
                  )}
                </div>

                <div className="acoes-cadastro-admin acoes-cadastro-admin-rodape">
                  {botoesDoStatus(usuario)}
                </div>
              </article>
            )
          })}
        </div>
      </section>
    </DashboardLayout>
  )
}

export default CadastrosAdministrador
