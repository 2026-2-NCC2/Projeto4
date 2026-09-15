import './style.css'

import Cabecalho from '../../componentes/Cabecalho'
import Rodape from '../../componentes/Rodape'

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
          <button className="botao-cadastro">
            Cadastrar-se →
          </button>
        </div>

      </main>

      <Rodape />

    </div>
  )
}

export default Home