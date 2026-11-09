import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { CHAVE_TOKEN, requisicaoApi } from '../services/api'
import { encerrarSessao, rotaInicialPorPerfil, salvarSessao } from '../services/usuarios'

function codigoHttp(mensagem = '') {
  const encontrado = String(mensagem).match(/HTTP (\d{3})/)
  return encontrado ? Number(encontrado[1]) : null
}

function PaginaEstado({ titulo, mensagem, children }) {
  return (
    <main role="status" aria-live="polite" style={{
      minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24,
      boxSizing: 'border-box', background: 'var(--cor-de-fundo, #0f1113)', color: 'var(--cor-branco, #f5f7f5)',
      fontFamily: 'Arial, sans-serif', textAlign: 'center'
    }}>
      <section style={{ maxWidth: 560 }}>
        <h1 style={{ fontSize: '1.25rem', marginBottom: 10 }}>{titulo}</h1>
        <p style={{ color: 'var(--cor-texto-secundario, #a8b0aa)', lineHeight: 1.6 }}>{mensagem}</p>
        {children}
      </section>
    </main>
  )
}

export default function RotaPublica({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(CHAVE_TOKEN))
  const [tentativa, setTentativa] = useState(0)
  const [auth, setAuth] = useState(() => ({ status: token ? 'checking' : 'public', token, user: null, error: '' }))

  useEffect(() => {
    const atualizarToken = () => setToken(localStorage.getItem(CHAVE_TOKEN))
    const aoMudarStorage = (evento) => {
      if (evento.key === CHAVE_TOKEN || evento.key === null) atualizarToken()
    }
    window.addEventListener('storage', aoMudarStorage)
    window.addEventListener('trocaticket-token-atualizado', atualizarToken)
    return () => {
      window.removeEventListener('storage', aoMudarStorage)
      window.removeEventListener('trocaticket-token-atualizado', atualizarToken)
    }
  }, [])

  useEffect(() => {
    let ativo = true
    if (!token) {
      setAuth({ status: 'public', token: null, user: null, error: '' })
      return () => { ativo = false }
    }

    setAuth({ status: 'checking', token, user: null, error: '' })
    requisicaoApi('/auth/me').then((resposta) => {
      if (!ativo) return
      if (localStorage.getItem(CHAVE_TOKEN) !== token) {
        setToken(localStorage.getItem(CHAVE_TOKEN))
        return
      }
      if (!resposta?.usuario?.id || !resposta?.usuario?.perfil) {
        throw new Error('O servidor não retornou os dados válidos da sessão.')
      }
      salvarSessao(resposta.usuario)
      setAuth({ status: 'authenticated', token, user: resposta.usuario, error: '' })
    }).catch((erro) => {
      if (!ativo) return
      const status = codigoHttp(erro?.message)
      if (status === 401 || status === 403 || !localStorage.getItem(CHAVE_TOKEN)) {
        encerrarSessao()
        setToken(null)
        setAuth({ status: 'public', token: null, user: null, error: '' })
        return
      }
      setAuth({ status: 'error', token, user: null, error: erro?.message || 'Não foi possível confirmar sua sessão.' })
    })
    return () => { ativo = false }
  }, [token, tentativa])

  const authAtual = auth.token === token
  if (authAtual && auth.status === 'authenticated') {
    return <Navigate to={rotaInicialPorPerfil(auth.user.perfil, auth.user.status)} replace />
  }
  if (!token && (!authAtual || auth.status === 'public')) return children
  if (authAtual && auth.status === 'error') {
    return (
      <PaginaEstado titulo="Não foi possível confirmar sua sessão" mensagem={auth.error}>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginTop: 18 }}>
          <button type="button" onClick={() => setTentativa((valor) => valor + 1)} style={{ padding: '10px 16px', cursor: 'pointer' }}>Tentar novamente</button>
          <button type="button" onClick={() => { encerrarSessao(); setToken(null) }} style={{ padding: '10px 16px', cursor: 'pointer' }}>Limpar sessão e continuar</button>
        </div>
      </PaginaEstado>
    )
  }
  return <PaginaEstado titulo="Verificando sua sessão…" mensagem="Se você já estiver conectado, será levado diretamente à sua área da TrocaTicket." />
}
