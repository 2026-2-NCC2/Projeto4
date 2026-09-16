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