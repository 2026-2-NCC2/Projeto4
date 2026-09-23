import './style.css'

import {
  Link,
  useLocation
} from 'react-router-dom'

import {
  House,
  CalendarDays,
  Search,
  CirclePlus,
  User,
  FileText,
  Users,
  ClipboardCheck
} from 'lucide-react'

const icones = {
  inicio: House,
  eventos: CalendarDays,
  procurar: Search,
  criar: CirclePlus,
  perfil: User,
  propostas: FileText,
  usuarios: Users,
  cadastros: ClipboardCheck
}

function MenuLateral({ itens }) {
  const location = useLocation()

  return (
    <aside className="menu-lateral">

      <nav>

        {itens.map((item) => {
          const Icone = icones[item.icone]

          const ativo =
            location.pathname === item.destino

          return (
            <Link
              key={item.destino}
              to={item.destino}
              className={ativo ? 'menu-ativo' : ''}
            >
              <Icone />

              <span>
                {item.texto}
              </span>
            </Link>
          )
        })}

      </nav>

    </aside>
  )
}

export default MenuLateral