import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { erro: null, pilhaComponente: '' }
  }

  static getDerivedStateFromError(erro) {
    return { erro }
  }

  componentDidCatch(erro, informacoes) {
    console.error('TrocaTicket: erro ao renderizar a página.', erro, informacoes)
    this.setState({ pilhaComponente: informacoes?.componentStack || '' })
  }

  render() {
    if (this.state.erro) {
      return (
        <main
          style={{
            minHeight: '100vh',
            display: 'grid',
            placeItems: 'center',
            padding: '24px',
            background: '#0f1113',
            color: '#fff',
            fontFamily: 'Arial, sans-serif'
          }}
        >
          <section
            style={{
              width: '100%',
              maxWidth: '680px',
              padding: '28px',
              border: '1px solid #343a36',
              borderRadius: '14px',
              background: '#151918'
            }}
          >
            <h1 style={{ marginTop: 0, fontSize: '1.5rem' }}>Não foi possível abrir esta página</h1>
            <p style={{ color: '#d6dbd7', lineHeight: 1.6 }}>
              A aplicação encontrou um erro ao exibir esta tela. A mensagem abaixo ajuda a identificar a causa:
            </p>
            <p style={{ color: '#a8b0aa', fontSize: '0.9rem', overflowWrap: 'anywhere' }}>
              Página: {typeof window !== 'undefined' ? window.location.pathname : 'desconhecida'}
            </p>
            <pre
              style={{
                padding: '14px',
                background: '#090c0b',
                borderRadius: '8px',
                color: '#ffb4a8',
                whiteSpace: 'pre-wrap',
                overflowWrap: 'anywhere'
              }}
            >
              {String(this.state.erro?.message || this.state.erro)}
            </pre>
            {this.state.pilhaComponente && (
              <details style={{ marginTop: '12px', color: '#a8b0aa' }}>
                <summary style={{ cursor: 'pointer' }}>Detalhes técnicos</summary>
                <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                  {this.state.pilhaComponente}
                </pre>
              </details>
            )}
            <button
              type="button"
              onClick={() => window.location.reload()}
              style={{
                marginTop: '8px',
                padding: '11px 16px',
                border: 0,
                borderRadius: '8px',
                background: '#28c94a',
                color: '#07110b',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Recarregar a TrocaTicket
            </button>
            <p style={{ color: '#a8b0aa', fontSize: '0.85rem', lineHeight: 1.5 }}>
              Se o erro continuar, envie esta mensagem junto com o endereço da página onde aconteceu.
            </p>
          </section>
        </main>
      )
    }

    return this.props.children
  }
}
