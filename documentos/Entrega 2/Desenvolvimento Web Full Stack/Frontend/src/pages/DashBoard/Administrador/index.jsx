import './style.css'

import DashboardLayout from '../../../layouts/DashboardLayout'
import CardDesempenho from '../../../componentes/cardDesempenho'

import menuAdministrador from './menuAdministrador'

import { listarUsuarios } from '../../../services/usuarios'
import { listarEventos } from '../../../services/eventos'
import { listarPropostas } from '../../../services/propostas'
import { useEffect, useState } from 'react'
import { listarEventosAdministracao } from '../../../services/eventos'

function Administrador() {
  const usuarios = listarUsuarios()
  const [eventos, setEventos] = useState(() => listarEventos())
  const propostas = listarPropostas()
  useEffect(() => {
    let ativo = true
    listarEventosAdministracao().then((lista) => { if (ativo) setEventos(Array.isArray(lista) ? lista : []) }).catch(() => {})
    const atualizar = () => setEventos(listarEventos())
    window.addEventListener('trocaticket-api-ok', atualizar)
    return () => { ativo = false; window.removeEventListener('trocaticket-api-ok', atualizar) }
  }, [])
  const comissaoMedia = eventos.reduce((soma, evento) => soma + Number(evento.comissao?.medio?.comissaoTrocaTicket ?? evento.comissao?.medio?.comissaoTicketCobertura ?? 0), 0)

  const pendentes = usuarios.filter(
    (usuario) => usuario.status === 'PENDENTE'
  )

  return (
    <DashboardLayout
      tipoUsuario="ADMINISTRADOR"
      statusVerificacao="Gestão da plataforma"
      itensMenu={menuAdministrador}
    >

      <section className="dashboard-administrador">

        <div className="titulo-administrador">

          <div>
            <h1>
              Visão Administrativa
            </h1>

            <p>
              Acompanhe os principais dados da plataforma.
            </p>
          </div>

        </div>

        <div className="cards-administrador">

          <CardDesempenho
            titulo="Cadastros pendentes"
            valor={pendentes.length}
            detalhe="Aguardando análise"
          />

          <CardDesempenho
            titulo="Eventos"
            valor={eventos.length}
            detalhe="Eventos cadastrados"
          />

          <CardDesempenho
            titulo="Propostas"
            valor={propostas.length}
            detalhe="Propostas registradas"
          />

          <CardDesempenho
            titulo="Comissão estimada da plataforma"
            valor={comissaoMedia.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            detalhe="Soma das projeções no cenário médio"
            destaque
          />

        </div>

      </section>

    </DashboardLayout>
  )
}

export default Administrador