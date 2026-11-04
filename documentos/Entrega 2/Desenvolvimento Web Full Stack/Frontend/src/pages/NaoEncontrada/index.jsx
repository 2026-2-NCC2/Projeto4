import './style.css'

import { Link } from 'react-router-dom'

function NaoEncontrada() {
  return (
    <main className="pagina-404">

      <span>
        404
      </span>

      <h1>
        Página não encontrada
      </h1>

      <p>
        O endereço acessado não existe.
      </p>

      <Link to="/">
        Voltar ao início
      </Link>

    </main>
  )
}

export default NaoEncontrada