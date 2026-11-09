import '../../PerfilCompartilhado.css'
import { useRef, useState } from 'react'
import { Building2, Mail, Phone, Lock, MapPin, Camera, KeyRound, ShieldCheck, Check, UserRound, FileText, Upload } from 'lucide-react'
import DashboardLayout from '../../../../layouts/DashboardLayout'
import menuOrganizador from '../menuOrganizador'
import { obterSessao, atualizarUsuarioNoServidor, alterarSenhaUsuario, enviarDocumento } from '../../../../services/usuarios'

function iniciais(nome) {
  const partes = String(nome || '').trim().split(/\s+/).filter(Boolean)
  if (!partes.length) return 'OR'
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase()
  return `${partes[0][0]}${partes[partes.length - 1][0]}`.toUpperCase()
}

function PerfilOrganizador() {
  const inputFotoRef = useRef(null)
  const inputDocumentoRef = useRef(null)
  const sessaoInicial = obterSessao() || {}
  const [formulario, setFormulario] = useState({
    nome: sessaoInicial.nome || '',
    responsavel: sessaoInicial.responsavel || sessaoInicial.nome || '',
    razaoSocial: sessaoInicial.razaoSocial || '',
    email: sessaoInicial.email || '',
    telefone: sessaoInicial.telefone || '',
    cnpj: sessaoInicial.cnpj || '',
    cidade: sessaoInicial.cidade || '',
    estado: sessaoInicial.estado || '',
    areaAtuacao: sessaoInicial.areaAtuacao || sessaoInicial.segmento || '',
    descricao: sessaoInicial.descricao || '',
  })
  const [fotoPerfil, setFotoPerfil] = useState(sessaoInicial.fotoPerfil || null)
  const [arquivoDocumento, setArquivoDocumento] = useState(null)
  const [comprovante, setComprovante] = useState(sessaoInicial.comprovante || '')
  const [erroPerfil, setErroPerfil] = useState('')
  const [mensagemPerfil, setMensagemPerfil] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [mostrarAlterarSenha, setMostrarAlterarSenha] = useState(false)
  const [senhaAtual, setSenhaAtual] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmarNovaSenha, setConfirmarNovaSenha] = useState('')
  const [erroSenha, setErroSenha] = useState('')
  const [senhaAlterada, setSenhaAlterada] = useState(false)

  function alterarCampo(evento) {
    const { name, value } = evento.target
    setFormulario((atual) => ({ ...atual, [name]: value }))
  }

  function selecionarFoto(evento) {
    const arquivo = evento.target.files?.[0]
    if (!arquivo) return
    if (!arquivo.type.startsWith('image/')) return setErroPerfil('Selecione uma imagem válida.')
    if (arquivo.size > 1 * 1024 * 1024) return setErroPerfil('A foto deve possuir no máximo 1 MB.')
    const leitor = new FileReader()
    leitor.onload = () => { if (typeof leitor.result === 'string') { setFotoPerfil(leitor.result); setErroPerfil(''); setMensagemPerfil('') } }
    leitor.onerror = () => setErroPerfil('Não foi possível ler a foto selecionada.')
    leitor.readAsDataURL(arquivo)
    evento.target.value = ''
  }

  function selecionarDocumento(evento) {
    const arquivo = evento.target.files?.[0]
    if (!arquivo) return
    const extensaoValida = /\.(pdf|png|jpe?g)$/i.test(arquivo.name)
    if (!extensaoValida) { setErroPerfil('O documento deve ser PDF, PNG ou JPG.'); evento.target.value = ''; return }
    if (arquivo.size > 10 * 1024 * 1024) { setErroPerfil('O documento deve possuir no máximo 10 MB.'); evento.target.value = ''; return }
    setArquivoDocumento(arquivo)
    setErroPerfil('')
    setMensagemPerfil('')
    evento.target.value = ''
  }

  async function salvarAlteracoes(evento) {
    evento.preventDefault()
    const usuario = obterSessao()
    if (!usuario) return setErroPerfil('Sua sessão expirou. Entre novamente.')
    setSalvando(true)
    setErroPerfil('')
    setMensagemPerfil('')
    try {
      if (arquivoDocumento) {
        const usuarioDocumento = await enviarDocumento(arquivoDocumento)
        setComprovante(usuarioDocumento?.comprovante || arquivoDocumento.name)
        setArquivoDocumento(null)
      }
      const atualizado = await atualizarUsuarioNoServidor(usuario.id, {
        ...formulario,
        razaoSocial: formulario.razaoSocial,
        cnpj: formulario.cnpj,
        fotoPerfil,
      })
      setFormulario((atual) => ({ ...atual, nome: atualizado.nome || atual.nome, email: atualizado.email || atual.email }))
      setFotoPerfil(atualizado.fotoPerfil ?? fotoPerfil)
      setComprovante(atualizado.comprovante || comprovante)
      setMensagemPerfil('Dados do perfil atualizados com sucesso.')
    } catch (erro) {
      setErroPerfil(erro.message || 'Não foi possível salvar o perfil.')
    } finally {
      setSalvando(false)
    }
  }

  async function salvarNovaSenha() {
    setErroSenha('')
    setSenhaAlterada(false)
    if (novaSenha.length < 8) return setErroSenha('A nova senha deve possuir no mínimo 8 caracteres.')
    if (novaSenha !== confirmarNovaSenha) return setErroSenha('A confirmação da nova senha não confere.')
    try {
      const resposta = await alterarSenhaUsuario(senhaAtual, novaSenha)
      setSenhaAlterada(true)
      setErroSenha(resposta.mensagem || 'Senha alterada com sucesso.')
      setSenhaAtual(''); setNovaSenha(''); setConfirmarNovaSenha('')
    } catch (erro) {
      setSenhaAlterada(false)
      setErroSenha(erro.message || 'Não foi possível alterar a senha.')
    }
  }

  return (
    <DashboardLayout tipoUsuario="ORGANIZADOR" itensMenu={menuOrganizador}>
      <div className="pagina-perfil-centralizada">
        <section className="card-perfil-central">
          <div className="badge-perfil-oficial"><span className="ponto-verde" /> ORGANIZADOR • PERFIL DA CONTA</div>
          <h1 className="titulo-meu-perfil">Meu perfil</h1>
          <p className="subtitulo-meu-perfil">Atualize os dados pessoais e da organização, os contatos e o documento cadastral.</p>

          <div className="secao-avatar-perfil">
            <div className="avatar-circulo-verde">
              {fotoPerfil ? <img src={fotoPerfil} alt="Foto do perfil do organizador" className="imagem-foto" /> : <span className="iniciais-avatar">{iniciais(formulario.razaoSocial || formulario.nome)}</span>}
              <button type="button" className="btn-icone-camera" onClick={() => inputFotoRef.current?.click()} title="Alterar foto de perfil" aria-label="Alterar foto de perfil"><Camera size={14} /></button>
            </div>
            <div className="secao-avatar-acoes">
              <strong><Building2 size={15} /> Foto de perfil da organização</strong>
              <small>Imagem JPG, PNG ou WEBP de até 1 MB.</small>
              <button type="button" className="link-alterar-foto" onClick={() => inputFotoRef.current?.click()}>Alterar foto</button>
            </div>
            <input ref={inputFotoRef} className="input-foto-perfil-compartilhado" type="file" accept="image/*" onChange={selecionarFoto} />
          </div>

          <div className="status-conta-perfil"><span>Status da conta</span><strong>{String(sessaoInicial.status || 'INCOMPLETO').replaceAll('_', ' ')}</strong></div>

          <form className="formulario-meu-perfil" onSubmit={salvarAlteracoes}>
            <div className="campo-grupo"><label htmlFor="org-nome"><UserRound size={13} /> Nome do usuário</label><input id="org-nome" name="nome" value={formulario.nome} onChange={alterarCampo} required /></div>
            <div className="campo-grupo"><label htmlFor="org-responsavel"><UserRound size={13} /> Responsável pela organização</label><input id="org-responsavel" name="responsavel" value={formulario.responsavel} onChange={alterarCampo} /></div>
            <div className="campo-grupo"><label htmlFor="org-razao-social"><Building2 size={13} /> Razão social / nome fantasia</label><input id="org-razao-social" name="razaoSocial" value={formulario.razaoSocial} onChange={alterarCampo} /></div>
            <div className="campo-grupo"><label htmlFor="org-cnpj"><Lock size={13} /> CNPJ</label><input id="org-cnpj" name="cnpj" value={formulario.cnpj} onChange={alterarCampo} placeholder="00.000.000/0001-00" /></div>
            <div className="campo-grupo"><label htmlFor="org-email"><Mail size={13} /> E-mail</label><input id="org-email" name="email" type="email" value={formulario.email} onChange={alterarCampo} required /></div>
            <div className="campo-grupo"><label htmlFor="org-telefone"><Phone size={13} /> Telefone / WhatsApp</label><input id="org-telefone" name="telefone" value={formulario.telefone} onChange={alterarCampo} /></div>
            <div className="campo-grupo"><label htmlFor="org-cidade"><MapPin size={13} /> Cidade</label><input id="org-cidade" name="cidade" value={formulario.cidade} onChange={alterarCampo} /></div>
            <div className="campo-grupo"><label htmlFor="org-estado">Estado</label><select id="org-estado" name="estado" value={formulario.estado} onChange={alterarCampo}><option value="">Selecione o estado</option>{['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'].map((uf) => <option key={uf} value={uf}>{uf}</option>)}</select></div>
            <div className="campo-grupo"><label htmlFor="org-area">Área de atuação</label><input id="org-area" name="areaAtuacao" value={formulario.areaAtuacao} onChange={alterarCampo} placeholder="Ex.: eventos universitários" /></div>
            <div className="campo-grupo largo"><label htmlFor="org-descricao">Descrição da organização</label><textarea id="org-descricao" name="descricao" value={formulario.descricao} onChange={alterarCampo} maxLength={1000} placeholder="Descreva a organização e os tipos de evento que realiza." /></div>
            <div className="campo-grupo largo"><label><FileText size={13} /> Documento cadastral</label><div className="upload-documento-perfil"><div className="upload-documento-info"><strong>{arquivoDocumento?.name || comprovante || 'Nenhum documento cadastral enviado'}</strong><span>PDF, PNG ou JPG até 10 MB. Você pode substituir o arquivo.</span></div><button type="button" onClick={() => inputDocumentoRef.current?.click()}><Upload size={14} /> Selecionar documento</button></div><input ref={inputDocumentoRef} className="input-documento-perfil" type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={selecionarDocumento} /></div>
            {erroPerfil && <p className="mensagem-erro-perfil" role="alert">{erroPerfil}</p>}
            {mensagemPerfil && <p className="mensagem-sucesso-perfil" role="status">{mensagemPerfil}</p>}
            <div className="linha-seguranca"><button type="button" className="link-alterar-senha" onClick={() => { setMostrarAlterarSenha((valor) => !valor); setErroSenha(''); setSenhaAlterada(false) }}><KeyRound size={14} /> Alterar senha de acesso</button><span className="texto-seguranca"><ShieldCheck size={13} /> Dados protegidos</span></div>
            {mostrarAlterarSenha && <div className="painel-alterar-senha"><h3>Alterar senha</h3><label htmlFor="org-senha-atual">Senha atual</label><input id="org-senha-atual" type="password" value={senhaAtual} onChange={(e) => setSenhaAtual(e.target.value)} /><label htmlFor="org-senha-nova">Nova senha</label><input id="org-senha-nova" type="password" value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} /><label htmlFor="org-senha-confirma">Confirmar nova senha</label><input id="org-senha-confirma" type="password" value={confirmarNovaSenha} onChange={(e) => setConfirmarNovaSenha(e.target.value)} />{erroSenha && <p className={senhaAlterada ? 'mensagem-sucesso-perfil' : 'mensagem-erro-perfil'} role="status">{erroSenha}</p>}<div className="acoes-alterar-senha"><button type="button" onClick={() => setMostrarAlterarSenha(false)}>Cancelar</button><button type="button" onClick={salvarNovaSenha}>Atualizar senha</button></div></div>}
            <button className="btn-salvar-perfil" type="submit" disabled={salvando}>{salvando ? 'Salvando...' : <>Salvar alterações <Check size={16} /></>}</button>
          </form>
        </section>
        <div className="garantias-rodape-perfil"><span><ShieldCheck size={14} /> Planejamento centralizado</span><span><Lock size={13} /> Dados protegidos</span></div>
      </div>
    </DashboardLayout>
  )
}

export default PerfilOrganizador
