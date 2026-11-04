import './style.css'
import Logo from '../../assets/Logo.svg'
import { Link } from 'react-router-dom'
import BotaoSair from '../botaoSair'
import { obterSessao, rotaInicialPorPerfil } from '../../services/usuarios'
import ThemeToggle from '../ThemeToggle'

function CabecalhoDashboard({ tipoUsuario, statusVerificacao, classeStatus = 'indefinido' }) {
  const sessao = obterSessao()
  const destinoInicio = rotaInicialPorPerfil(sessao?.perfil, sessao?.status)

  return (
    <header className="cabecalho-dashboard">
      <div className="header-esquerda">
        <Link to={destinoInicio} className="dashboard-logo-container" aria-label="Ir para o início da minha área">
          <img src={Logo} alt="Logo TrocaTicket" className="dashboard-logo" />
          <span className="dashboard-logo-texto">
            Troca<span className="dashboard-logo-destaque">Ticket</span>
          </span>
        </Link>
        <span className="tipo-usuario">{tipoUsuario}</span>
      </div>

      <div className="header-direita">
        <ThemeToggle compacto />
        <span className={`alerta-verificacao status-${classeStatus}`}>
          <span className="ponto-verificacao"></span>
          {statusVerificacao}
        </span>
        <nav>
          <BotaoSair className="botao-sair" />
        </nav>
      </div>
    </header>
  )
}

export default CabecalhoDashboard
