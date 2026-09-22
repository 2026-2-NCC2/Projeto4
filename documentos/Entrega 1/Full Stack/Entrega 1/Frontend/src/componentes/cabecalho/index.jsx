import './style.css'
import Logo from '../../assets/Logo.svg'
import { Link } from 'react-router-dom'

function Cabecalho({ textoBotao, destino }) {
  return (
    <header>

      <Link to="/" className="logo-container">
        <img
          src={Logo}
          alt="Logo TrocaTicket"
          className="logo"
        />

        <span className="logo-texto">
          Troca<span className="destaque">Ticket</span>
        </span>
      </Link>
      
      <nav>
        <Link to={destino}>
          {textoBotao}
        </Link>
      </nav>

    </header>
  )
}

export default Cabecalho