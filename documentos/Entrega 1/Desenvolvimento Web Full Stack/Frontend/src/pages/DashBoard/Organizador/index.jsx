import './style.css'

import DashboardLayout from '../../../layouts/DashboardLayout'
import CardCadastroPendente from '../../../componentes/cardCadastroPendente'
import CardDesempenho from '../../../componentes/cardDesempenho'
import CardRequisicao from '../../../componentes/cardRequisicao'

import { Link } from 'react-router-dom'

function Organizador() {
  const menuOrganizador = [
    {
      texto: 'Início',
      destino: '/organizador',
      icone: 'inicio',
      ativo: true
    },
    {
      texto: 'Eventos',
      destino: '/organizador/eventos',
      icone: 'eventos'
    },
    {
      texto: 'Procurar',
      destino: '/organizador/procurar',
      icone: 'procurar'
    },
    {
      texto: 'Criar Evento',
      destino: '/organizador/criar-evento',
      icone: 'criar'
    },
    {
      texto: 'Perfil',
      destino: '/organizador/perfil',
      icone: 'perfil'
    }
  ]

  const requisicoes = []

  return (
    <DashboardLayout
      tipoUsuario="ORGANIZADOR"
      statusVerificacao="Conta em verificação"
      itensMenu={menuOrganizador}
    >

      <CardCadastroPendente />

      <section className="desempenho-geral">

        <div className="titulo-secao">
          <h2>Desempenho Geral</h2>
          <span>Atualizado há 5 min</span>
        </div>

        <div className="cards-desempenho">

          <CardDesempenho
            titulo="Eventos ativos"
            valor="3"
            detalhe="Eventos em andamento"
          />

          <CardDesempenho
            titulo="Requisições abertas"
            valor="8"
            detalhe="Aguardando fornecedores"
          />

          <CardDesempenho
            titulo="Requisições concluídas"
            valor="21"
            detalhe="Serviços finalizados"
            destaque
          />

        </div>

      </section>

      {requisicoes.length > 0 && (
        <section className="requisicoes">

          <div className="titulo-secao">
            <h2>Requisições Recentes</h2>

            <Link to="/organizador/requisicoes">
              Ver todas
            </Link>
          </div>

          <div className="lista-requisicoes">

            {requisicoes.map((requisicao) => (
              <CardRequisicao
                key={requisicao.id}
                {...requisicao}
              />
            ))}

          </div>

        </section>
      )}

    </DashboardLayout>
  )
}

export default Organizador