import './style.css'
import Logo from '../../assets/Logo.svg'
import { Link } from 'react-router-dom'
import ThemeToggle from '../ThemeToggle'

function Cabecalho({ textoBotao, destino }) {
  return (
    <header className="cabecalho-publico">

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
        <ThemeToggle />
        <Link to={destino}>
          {textoBotao}
        </Link>
      </nav>

    </header>
  )
}

export default Cabecalho