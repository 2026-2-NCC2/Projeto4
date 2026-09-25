import './style.css'

import CabecalhoDashboard from '../../componentes/cabecalhoDashboard'
import MenuLateral from '../../componentes/menuLateral'

function DashboardLayout({
  tipoUsuario,
  statusVerificacao,
  itensMenu,
  children
}) {
  return (
    // As páginas de cada perfil compartilham o mesmo cabeçalho, menu e área de conteúdo.
    <div className="dashboard-layout">

      <CabecalhoDashboard
        textoBotao="Sair"
        destino="/"
        tipoUsuario={tipoUsuario}
        statusVerificacao={statusVerificacao}
      />

      <div className="area-dashboard">

        <MenuLateral itens={itensMenu} />

        <main className="conteudo-dashboard">
          {children}
        </main>

      </div>

    </div>
  )
}

export default DashboardLayout