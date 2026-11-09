import './style.css'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

import CabecalhoDashboard from '../../componentes/cabecalhoDashboard'
import MenuLateral from '../../componentes/menuLateral'
import { obterSessao } from '../../services/usuarios'

function textoStatusConta(status) {
  const statusNormalizado = String(status || '').toUpperCase()
  const textos = {
    APROVADO: 'Conta aprovada',
    PENDENTE: 'Conta em análise',
    INCOMPLETO: 'Cadastro incompleto',
    REJEITADO: 'Conta rejeitada'
  }
  return textos[statusNormalizado] || 'Status não disponível'
}

function classeStatusConta(status, tipoUsuario) {
  if (tipoUsuario === 'ADMINISTRADOR') return 'administrador'
  const normalizado = String(status || '').toLowerCase()
  return ['aprovado', 'pendente', 'incompleto', 'rejeitado'].includes(normalizado)
    ? normalizado
    : 'indefinido'
}

function DashboardLayout({ tipoUsuario, statusVerificacao, itensMenu = [], children }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [erroApi, setErroApi] = useState(() => localStorage.getItem('trocaticket_api_erro') || '')
  const [sessao, setSessao] = useState(() => obterSessao() || {})

  useEffect(() => {
    const aoFalhar = (evento) => setErroApi(evento.detail || localStorage.getItem('trocaticket_api_erro') || 'Falha na sincronização com o servidor.')
    const aoNormalizar = () => setErroApi('')
    const atualizarSessao = (evento) => setSessao(evento?.detail || obterSessao() || {})
    window.addEventListener('trocaticket-api-erro', aoFalhar)
    window.addEventListener('trocaticket-api-ok', aoNormalizar)
    window.addEventListener('trocaticket-sessao-atualizada', atualizarSessao)
    window.addEventListener('storage', atualizarSessao)
    atualizarSessao()
    return () => {
      window.removeEventListener('trocaticket-api-erro', aoFalhar)
      window.removeEventListener('trocaticket-api-ok', aoNormalizar)
      window.removeEventListener('trocaticket-sessao-atualizada', atualizarSessao)
      window.removeEventListener('storage', atualizarSessao)
    }
  }, [])

  const statusSessao = String(sessao.status || '').toUpperCase()
  const itensMenuVisiveis = tipoUsuario === 'ORGANIZADOR' && statusSessao !== 'APROVADO'
    ? (Array.isArray(itensMenu) ? itensMenu.filter((item) => item.destino !== '/organizador/criar-evento') : [])
    : (Array.isArray(itensMenu) ? itensMenu : [])

  const textoStatus = tipoUsuario === 'ADMINISTRADOR'
    ? (statusVerificacao || 'Gestão da plataforma')
    : textoStatusConta(sessao.status)
  const classeStatus = classeStatusConta(sessao.status, tipoUsuario)
  const rotaInicio = tipoUsuario === 'ADMINISTRADOR' ? '/administrador' : tipoUsuario === 'FORNECEDOR' ? '/fornecedor' : '/organizador'
  const podeVoltar = location.pathname !== rotaInicio
  const voltar = () => {
    const indiceHistorico = Number(window.history.state?.idx ?? 0)
    if (indiceHistorico > 0) navigate(-1)
    else navigate(rotaInicio)
  }

  return (
    <div className="dashboard-layout">
      <CabecalhoDashboard
        textoBotao="Sair"
        destino={rotaInicio}
        tipoUsuario={tipoUsuario}
        statusVerificacao={textoStatus}
        classeStatus={classeStatus}
      />
      <div className="area-dashboard">
        <MenuLateral itens={itensMenuVisiveis} />
        <main className="conteudo-dashboard">
          {erroApi && (
            <div className="alerta-sincronizacao" role="alert">
              <span>Não foi possível sincronizar os dados com o servidor: {erroApi}</span>
              <button type="button" onClick={() => window.location.reload()}>Tentar novamente</button>
            </div>
          )}
          {podeVoltar && <div className="navegacao-voltar-pagina"><button type="button" onClick={voltar}><ArrowLeft size={15}/> Voltar</button></div>}
          {children}
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout
