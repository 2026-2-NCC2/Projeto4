import './style.css'

import DashboardLayout from '../../../layouts/DashboardLayout'
import CardCadastroPendente from '../../../componentes/cardCadastroPendente'
import CardDesempenho from '../../../componentes/cardDesempenho'

function Fornecedor() {
  const menuFornecedor = [
    {
      texto: 'Início',
      destino: '/fornecedor',
      icone: 'inicio',
      ativo: true
    },
    {
      texto: 'Criar Proposta',
      destino: '/fornecedor/criar-proposta',
      icone: 'criar'
    },
    {
      texto: 'Procurar Evento',
      destino: '/fornecedor/procurar-evento',
      icone: 'procurar'
    },
    {
      texto: 'Minhas Propostas',
      destino: '/fornecedor/propostas',
      icone: 'propostas'
    },
    {
      texto: 'Perfil',
      destino: '/fornecedor/perfil',
      icone: 'perfil'
    }
  ]

  return (
    <DashboardLayout
      tipoUsuario="FORNECEDOR"
      statusVerificacao="Conta em verificação"
      itensMenu={menuFornecedor}
    >

      <CardCadastroPendente />

      <section className="desempenho-fornecedor">

        <div className="titulo-secao-fornecedor">
          <h2>Desempenho Geral</h2>

          <span>
            Atualizado há 5 min
          </span>
        </div>

        <div className="cards-fornecedor">

          <CardDesempenho
            titulo="Propostas enviadas"
            valor="42"
            detalhe="Propostas realizadas"
          />

          <CardDesempenho
            titulo="Propostas aceitas"
            valor="28"
            detalhe="Propostas aprovadas"
            destaque
          />

          <CardDesempenho
            titulo="Propostas negadas"
            valor="6"
            detalhe="Propostas recusadas"
          />

        </div>

      </section>

    </DashboardLayout>
  )
}

export default Fornecedor