import { useNavigate } from 'react-router-dom'

import { encerrarSessao } from '../../services/usuarios'

function BotaoSair({ className }) {
  const navigate = useNavigate()

  function sair() {
    encerrarSessao()

    navigate('/login')
  }

  return (
    <button
      type="button"
      className={className}
      onClick={sair}
    >
      Sair
    </button>
  )
}

export default BotaoSair