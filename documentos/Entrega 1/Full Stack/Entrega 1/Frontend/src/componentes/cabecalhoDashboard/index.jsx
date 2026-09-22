import './style.css'
import Logo from '../../assets/Logo.svg'
import { Link } from 'react-router-dom'

function CabecalhoDashboard({
  textoBotao,
  destino,
  tipoUsuario,
  statusVerificacao
}) {
  return (
    <header className="cabecalho-dashboard">

      <div className="header-esquerda">
        <Link to="/" className="dashboard-logo-container">
          <img
            src={Logo}
            alt="Logo TrocaTicket"
            className="dashboard-logo"
          />

          <span className="dashboard-logo-texto">
            Troca<span className="dashboard-logo-destaque">Ticket</span>
          </span>
        </Link>

        <span className="tipo-usuario">
          {tipoUsuario}
        </span>
      </div>

      <div className="header-direita">

        <span className="alerta-verificacao">
          <span className="ponto-verificacao"></span>
          {statusVerificacao}
        </span>

        <button
          type="button"
          className="icone-sininho"
          aria-label="Notificações"
        >
          ♧
        </button>

        <nav>
          <Link to={destino} className="botao-sair">
            {textoBotao}
          </Link>
        </nav>

      </div>

    </header>
  )
}

export default CabecalhoDashboard