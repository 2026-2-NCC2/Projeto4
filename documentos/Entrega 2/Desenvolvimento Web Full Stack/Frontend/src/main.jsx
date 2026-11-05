import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import './index.css'
import App from './App.jsx'
import './responsive.css'
import ErrorBoundary from './componentes/ErrorBoundary.jsx'

// Restaura a preferência de tema antes da primeira renderização para evitar um flash de cores.
const temaSalvo = localStorage.getItem('trocaticket_tema')
document.documentElement.dataset.theme = temaSalvo === 'light' ? 'light' : 'dark'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
)
