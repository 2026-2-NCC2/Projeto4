import './style.css'

import { Link } from 'react-router-dom'
import { TriangleAlert } from 'lucide-react'

function CardCadastroPendente({ destinoCadastro }) {
  return (
    <section className="card-cadastro-pendente">

      <span className="icone-alerta">
        <TriangleAlert />
      </span>

      <div className="conteudo-cadastro-pendente">

        <h2>
          Cadastro pendente
        </h2>

        <p>
          Complete as informações obrigatórias do seu cadastro
          para enviar seus dados para análise da equipe TrocaTicket.
        </p>

      </div>

      <Link
        to={destinoCadastro}
        className="botao-completar-cadastro"
      >
        Completar cadastro
      </Link>

    </section>
  )
}

export default CardCadastroPendente