import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import './index.css'

import App from './App.jsx'

import { criarAdministradorPadrao } from './services/usuarios'

// Garante que exista uma conta administrativa antes de abrir as telas.
criarAdministradorPadrao()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)