import './style.css'
import { Link } from 'react-router-dom'

import {
  House,
  CalendarDays,
  Search,
  CirclePlus,
  User,
  FileText
} from 'lucide-react'

const icones = {
  inicio: House,
  eventos: CalendarDays,
  procurar: Search,
  criar: CirclePlus,
  perfil: User,
  propostas: FileText
}

function MenuLateral({ itens }) {
  return (
    <aside className="menu-lateral">

      <nav>

        {itens.map((item) => {
          const Icone = icones[item.icone]

          return (
            <Link
              key={item.destino}
              to={item.destino}
              className={item.ativo ? 'menu-ativo' : ''}
            >
              <Icone />
              <span>{item.texto}</span>
            </Link>
          )
        })}

      </nav>

    </aside>
  )
}

export default MenuLateral