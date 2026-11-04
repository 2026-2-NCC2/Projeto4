import { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { CHAVE_TOKEN, requisicaoApi, sincronizarDadosIniciais } from '../services/api'
import { encerrarSessao, rotaInicialPorPerfil, salvarSessao } from '../services/usuarios'

const TEMPO_MAXIMO_CARGA = 6000

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

export default function RotaProtegida({ perfis, statusNecessario, children }) {
  const localizacao = useLocation()
  const [token, setToken] = useState(() => localStorage.getItem(CHAVE_TOKEN))
  const [tentativa, setTentativa] = useState(0)
  const [auth, setAuth] = useState(() => ({ status: token ? 'checking' : 'anonymous', token, pathname: localizacao.pathname, user: null, error: '' }))

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
    let temporizador = null

    if (!token) {
      setAuth({ status: 'anonymous', token: null, pathname: localizacao.pathname, user: null, error: '' })
      return () => { ativo = false }
    }

    setAuth({ status: 'checking', token, pathname: localizacao.pathname, user: null, error: '' })

    async function validarSessao() {
      try {
        // A identidade e o perfil vêm sempre do servidor, nunca apenas do localStorage.
        const resposta = await requisicaoApi('/auth/me')
        const usuario = resposta?.usuario
        if (!usuario?.id || !usuario?.perfil) {
          throw new Error('O servidor não retornou os dados válidos da sessão. Entre novamente.')
        }
        if (localStorage.getItem(CHAVE_TOKEN) !== token) {
          if (ativo) setToken(localStorage.getItem(CHAVE_TOKEN))
          return
        }

        salvarSessao(usuario)

        // Atualiza listas locais uma vez por intervalo, sem deixar que uma falha de dados
        // secundários autentique outra conta ou mantenha a tela travada para sempre.
        const sincronizacao = sincronizarDadosIniciais(usuario).catch((erro) => {
          if (!ativo || localStorage.getItem(CHAVE_TOKEN) !== token) return
          localStorage.setItem('trocaticket_api_erro', erro?.message || 'Falha ao atualizar os dados da conta.')
          window.dispatchEvent(new CustomEvent('trocaticket-api-erro', { detail: erro?.message || 'Falha ao atualizar os dados da conta.' }))
        })
        await Promise.race([
          sincronizacao,
          new Promise((resolve) => { temporizador = window.setTimeout(resolve, TEMPO_MAXIMO_CARGA) })
        ])

        if (!ativo || localStorage.getItem(CHAVE_TOKEN) !== token) {
          if (ativo) setToken(localStorage.getItem(CHAVE_TOKEN))
          return
        }
        setAuth({ status: 'authenticated', token, pathname: localizacao.pathname, user: usuario, error: '' })
      } catch (erro) {
        if (!ativo) return
        const status = codigoHttp(erro?.message)
        if (status === 401 || status === 403 || !localStorage.getItem(CHAVE_TOKEN)) {
          // Token inválido/rejeitado: encerra também os caches para que outra conta
          // não herde dados que ficaram no navegador.
          encerrarSessao()
          setToken(null)
          setAuth({ status: 'anonymous', token: null, pathname: localizacao.pathname, user: null, error: '' })
          return
        }
        setAuth({ status: 'error', token, pathname: localizacao.pathname, user: null, error: erro?.message || 'Não foi possível confirmar sua sessão.' })
      } finally {
        if (temporizador !== null) window.clearTimeout(temporizador)
      }
    }

    validarSessao()
    return () => {
      ativo = false
      if (temporizador !== null) window.clearTimeout(temporizador)
    }
  }, [token, localizacao.pathname, tentativa])

  const authAtual = auth.token === token && auth.pathname === localizacao.pathname
  if (!token || (authAtual && auth.status === 'anonymous')) {
    return <Navigate to="/login" replace state={{ de: localizacao.pathname }} />
  }

  if (!authAtual || auth.status === 'checking') {
    return <PaginaEstado titulo="Conferindo sua conta…" mensagem="A TrocaTicket está validando sua sessão antes de abrir esta página." />
  }

  if (auth.status === 'error') {
    return (
      <PaginaEstado titulo="Não foi possível validar sua sessão" mensagem={auth.error}>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginTop: 18 }}>
          <button type="button" onClick={() => setTentativa((valor) => valor + 1)} style={{ padding: '10px 16px', cursor: 'pointer' }}>Tentar novamente</button>
          <button type="button" onClick={() => { encerrarSessao(); setToken(null) }} style={{ padding: '10px 16px', cursor: 'pointer' }}>Sair e voltar ao login</button>
        </div>
      </PaginaEstado>
    )
  }

  if (perfis && !perfis.includes(auth.user.perfil)) {
    return <Navigate to={rotaInicialPorPerfil(auth.user.perfil, auth.user.status)} replace />
  }

  // Algumas áreas exigem cadastro aprovado, além de exigir o perfil correto.
  // A API continua aplicando a mesma regra para impedir acesso por chamadas diretas.
  if (statusNecessario && String(auth.user.status || '').toUpperCase() !== String(statusNecessario).toUpperCase()) {
    const destino = auth.user.perfil === 'ORGANIZADOR'
      ? (String(auth.user.status || '').toUpperCase() === 'INCOMPLETO' ? '/organizador/completar-cadastro' : '/organizador')
      : rotaInicialPorPerfil(auth.user.perfil, auth.user.status)
    return <Navigate to={destino} replace state={{ avisoStatus: `Esta área exige cadastro com status ${statusNecessario}.` }} />
  }

  return children
}
