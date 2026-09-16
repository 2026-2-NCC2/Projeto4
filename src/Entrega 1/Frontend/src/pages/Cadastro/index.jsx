import './style.css'

import Cabecalho from '../../componentes/cabecalho'
import Rodape from '../../componentes/rodape'

function Cadastro() {
  return (
    <div className="cadastro">
      <Cabecalho
        textoBotao="Voltar"
        destino="/login"
      />

      <main className="conteudo-cadastro">
        <section className="card-cadastro">
          <h1>Faça seu cadastro</h1>

          <p>
            Preencha seus dados para acessar o marketplace.
          </p>

          <form>
            <label className="titulo-perfil">
              Selecione seu perfil
            </label>

            <fieldset className="tipo-cadastro">
              <button type="button">
                Organizador
              </button>

              <button type="button">
                Fornecedor
              </button>
            </fieldset>

            <label htmlFor="email">
              E-mail
            </label>

            <input
              id="email"
              type="email"
              placeholder="seu@email.com"
            />

            <label htmlFor="senha">
              Senha
            </label>

            <input
              id="senha"
              type="password"
              placeholder="Sua senha"
            />

            <label htmlFor="confirmar-senha">
              Confirmar senha
            </label>

            <input
              id="confirmar-senha"
              type="password"
              placeholder="Confirme sua senha"
            />


            <button type="submit">
              Cadastrar →
            </button>
          </form>

          <p>
            Já tem uma conta? <a href="/login">Entre agora →</a>
          </p>
        </section>

        <aside className="selos-cadastro">
          <span>✓ Transferência Garantida</span>
          <span>♙ Transparência dos Valores</span>
        </aside>
      </main>

      <Rodape />
    </div>
  )
}

export default Cadastro