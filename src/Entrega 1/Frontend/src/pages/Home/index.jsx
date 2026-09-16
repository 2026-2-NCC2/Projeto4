import './style.css'
import { Link } from 'react-router-dom'

import Cabecalho from '../../componentes/cabecalho'
import Rodape from '../../componentes/rodape'

function Home() {
  return (
    <div className="home">

      <Cabecalho
        textoBotao="Entrar"
        destino="/login"
      />

      <main className="secao-principal">

        <h1 className="titulo">
          Troca<span className="destaque">Ticket</span>
        </h1>

        <p className="descricao">
          O marketplace seguro e transparente para comprar,
          vender e trocar ingressos de shows, festivais e
          eventos diretamente entre pessoas, sem burocracia.
        </p>

        <div className="div-botao">
          <Link to="/cadastro" className="botao-cadastro">
            Cadastrar-se →
          </Link>
        </div>

      </main>

      <Rodape />

    </div>
  )
}

export default Home