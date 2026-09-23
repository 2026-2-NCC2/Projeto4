import './style.css'

import Cabecalho from '../../componentes/cabecalho'
import Rodape from '../../componentes/rodape'

function Login(){
    return(        
        <div className= "login">
            <Cabecalho
            textoBotao="Voltar"
            destino="/"
            />
            <main className="conteudo-login">

            <section className="card-login">
                <h1>Entrar na conta</h1>
                <p>Entre com suas credenciais para gerenciar seus ingressos.</p>

                <form>
                <fieldset className="tipo-cadastro">
                    <button type="button">Organizador</button>
                    <button type="button">Fornecedor</button>
                </fieldset>

                <label htmlFor="email">E-mail</label>
                <input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                />

                <label htmlFor="senha">Senha</label>
                <input
                    id="senha"
                    type="password"
                    placeholder="Sua senha"
                />

                <button type="submit">
                    Entrar →
                </button>
                </form>

                <p>
                Ainda não tem conta? <a href="/cadastro">Então cadastre-se</a>
                </p>
            </section>

            <aside className="selos-seguranca">
                <span>✓ Transferência Garantida</span>
                <span>♙ Transparencia dos Valores</span>
            </aside>

        </main>
        
        <Rodape/>
        </div>

    )
}

export default Login