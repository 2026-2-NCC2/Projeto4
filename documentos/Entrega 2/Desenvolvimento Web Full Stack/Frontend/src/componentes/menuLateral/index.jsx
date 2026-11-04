import './style.css'

import { Link, useLocation } from 'react-router-dom'
import { obterSessao } from '../../services/usuarios'
import { useEffect, useState } from 'react'

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

function MenuLateral({ itens = [] }) {
  const itensSeguros = Array.isArray(itens) ? itens : []
  const location = useLocation()

  const [usuario, setUsuario] = useState(() => obterSessao() || { nome: 'Usuário', email: '' })

  useEffect(() => {
    const atualizar = (evento) => setUsuario(evento?.detail || obterSessao() || { nome: 'Usuário', email: '' })
    window.addEventListener('trocaticket-sessao-atualizada', atualizar)
    window.addEventListener('storage', atualizar)
    atualizar()
    return () => {
      window.removeEventListener('trocaticket-sessao-atualizada', atualizar)
      window.removeEventListener('storage', atualizar)
    }
  }, [])
  const destinoPerfil = usuario.perfil === 'FORNECEDOR'
    ? '/fornecedor/perfil'
    : usuario.perfil === 'ADMINISTRADOR'
      ? '/administrador'
      : '/organizador/perfil'

  // O atalho de criação só aparece depois da aprovação do cadastro do organizador.
  const itensVisiveis = itensSeguros.filter((item) => {
    if (usuario.perfil === 'ORGANIZADOR' && String(usuario.status || '').toUpperCase() !== 'APROVADO') {
      return item.destino !== '/organizador/criar-evento'
    }
    return true
  })

  // Função para gerar as iniciais automáticas com base no nome
  const obterIniciais = (nome) => {
    if (!nome) return 'TT'
    const partes = nome.trim().split(' ').filter(Boolean)
    if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase()
    return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase()
  }

  return (
    <aside className="menu-lateral">
      <nav>
        {itensVisiveis.map((item) => {
          const Icone = icones[item.icone] || CirclePlus
          const ativo = location.pathname === item.destino

          return (
            <Link
              key={item.destino}
              to={item.destino}
              className={ativo ? 'menu-ativo' : ''}
            >
              <Icone />
              <span>{item.texto}</span>
            </Link>
          )
        })}
      </nav>

      {/* Bloco do perfil com iniciais e dados do usuário */}
      <Link to={destinoPerfil} className="perfil-menu-lateral">
        <div className="avatar-iniciais">
          {usuario.fotoPerfil ? (
            <img src={usuario.fotoPerfil} alt="Foto do perfil" />
          ) : (
            obterIniciais(usuario.razaoSocial || usuario.nome || 'Usuário')
          )}
        </div>

        <div className="dados-usuario-menu">
          <span className="nome-usuario-menu" title={usuario.razaoSocial || usuario.nome || 'Usuário'}>
            {usuario.razaoSocial || usuario.nome || 'Usuário'}
          </span>
          <span className="email-usuario-menu" title={usuario.email}>
            {usuario.email}
          </span>
        </div>
      </Link>
    </aside>
  )
}

export default MenuLateral