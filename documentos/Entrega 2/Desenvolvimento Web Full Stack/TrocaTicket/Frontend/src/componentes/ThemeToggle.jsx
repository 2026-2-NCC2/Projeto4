import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import './ThemeToggle.css'

const CHAVE_TEMA = 'trocaticket_tema'

function temaAtual() {
  if (typeof document !== 'undefined' && document.documentElement.dataset.theme) {
    return document.documentElement.dataset.theme
  }
  return localStorage.getItem(CHAVE_TEMA) || 'dark'
}

export default function ThemeToggle({ compacto = false }) {
  const [tema, setTema] = useState(temaAtual)

  useEffect(() => {
    const sincronizar = () => setTema(temaAtual())
    window.addEventListener('storage', sincronizar)
    window.addEventListener('trocaticket-tema-alterado', sincronizar)
    return () => {
      window.removeEventListener('storage', sincronizar)
      window.removeEventListener('trocaticket-tema-alterado', sincronizar)
    }
  }, [])

  function alternarTema() {
    const novoTema = tema === 'light' ? 'dark' : 'light'
    document.documentElement.dataset.theme = novoTema
    localStorage.setItem(CHAVE_TEMA, novoTema)
    setTema(novoTema)
    window.dispatchEvent(new CustomEvent('trocaticket-tema-alterado', { detail: novoTema }))
  }

  const claro = tema === 'light'
  return (
    <button
      type="button"
      className={`theme-toggle${compacto ? ' theme-toggle-compacto' : ''}`}
      onClick={alternarTema}
      aria-label={claro ? 'Ativar tema escuro' : 'Ativar tema claro'}
      title={claro ? 'Ativar tema escuro' : 'Ativar tema claro'}
    >
      {claro ? <Moon size={16} aria-hidden="true" /> : <Sun size={16} aria-hidden="true" />}
      {!compacto && <span>{claro ? 'Tema escuro' : 'Tema claro'}</span>}
    </button>
  )
}
