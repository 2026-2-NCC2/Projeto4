import './style.css'
import { Link } from 'react-router-dom'
import { TriangleAlert } from 'lucide-react'

function CardCadastroPendente() {
  return (
    <section className="card-cadastro-pendente">
      <span className="icone-alerta">
        <TriangleAlert />
      </span>

      <div className="conteudo-cadastro-pendente">
        <h2>Cadastro pendente</h2>

        <p>
          Complete a verificação da sua conta de organizador e dados bancários
          para liberar o repasse automático das vendas e emissão de ingressos.
        </p>
      </div>

      <Link
        to="/organizador/perfil"
        className="botao-completar-cadastro"
      >
        Completar cadastro
      </Link>
    </section>
  )
}

export default CardCadastroPendente