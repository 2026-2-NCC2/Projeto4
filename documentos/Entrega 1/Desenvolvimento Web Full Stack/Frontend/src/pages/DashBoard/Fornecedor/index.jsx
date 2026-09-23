import './style.css'

import { Link } from 'react-router-dom'

import DashboardLayout from '../../../layouts/DashboardLayout'
import CardCadastroPendente from '../../../componentes/cardCadastroPendente'
import CardDesempenho from '../../../componentes/cardDesempenho'
import CardProposta from '../../../componentes/cardProposta'

import menuFornecedor from './menuFornecedor'
import { listarPropostas } from '../../../services/propostas'

function Fornecedor() {
  const propostas = listarPropostas()

  const aceitas = propostas.filter(
    (proposta) => proposta.status === 'ACEITA'
  )

  const recusadas = propostas.filter(
    (proposta) => proposta.status === 'RECUSADA'
  )

  const recentes = propostas.slice(-2).reverse()

  return (
    <DashboardLayout
      tipoUsuario="FORNECEDOR"
      statusVerificacao="Conta em verificação"
      itensMenu={menuFornecedor}
    >

      <CardCadastroPendente
        destinoCadastro="/fornecedor/completar-cadastro"
      />

      <section className="desempenho-fornecedor">

        <div className="titulo-secao-fornecedor">
          <h2>Desempenho Geral</h2>
          <span>Dados atuais</span>
        </div>

        <div className="cards-fornecedor">

          <CardDesempenho
            titulo="Propostas enviadas"
            valor={propostas.length}
            detalhe="Total de propostas"
          />

          <CardDesempenho
            titulo="Propostas aceitas"
            valor={aceitas.length}
            detalhe="Propostas aprovadas"
            destaque
          />

          <CardDesempenho
            titulo="Propostas recusadas"
            valor={recusadas.length}
            detalhe="Propostas não selecionadas"
          />

        </div>

      </section>

      <section className="propostas-recentes">

        <div className="titulo-secao-fornecedor">

          <h2>Minhas Propostas Recentes</h2>

          <Link to="/fornecedor/propostas">
            Ver todas
          </Link>

        </div>

        {recentes.length === 0 ? (
          <div className="nenhuma-proposta">

            <p>
              Você ainda não enviou nenhuma proposta.
            </p>

            <Link to="/fornecedor/procurar-evento">
              Procurar eventos
            </Link>

          </div>
        ) : (
          <div className="lista-propostas-recentes">

            {recentes.map((proposta) => (
              <CardProposta
                key={proposta.id}
                proposta={proposta}
              />
            ))}

          </div>
        )}

      </section>

    </DashboardLayout>
  )
}

export default Fornecedor