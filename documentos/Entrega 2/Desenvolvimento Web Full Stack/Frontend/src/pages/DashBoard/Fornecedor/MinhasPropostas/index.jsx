import './style.css'

import { useState } from 'react'

import DashboardLayout from '../../../../layouts/DashboardLayout'
import CardProposta from '../../../../componentes/cardProposta'
import menuFornecedor from '../menuFornecedor'

import {
  listarPropostas,
  excluirProposta
} from '../../../../services/propostas'

function MinhasPropostas() {
  const [propostas, setPropostas] = useState(
    listarPropostas()
  )
  const [erro, setErro] = useState('')

  async function cancelarProposta(id) {
    const confirmou = window.confirm(
      'Deseja cancelar esta proposta?'
    )

    if (!confirmou) {
      return
    }

    try {
      await excluirProposta(id)
      setPropostas(listarPropostas())
      setErro('')
    } catch (erroExclusao) {
      setErro(erroExclusao.message || 'Não foi possível cancelar a proposta.')
    }
  }

  return (
    <DashboardLayout
      tipoUsuario="FORNECEDOR"
      statusVerificacao="Conta em verificação"
      itensMenu={menuFornecedor}
    >

      <section className="pagina-minhas-propostas">

        <div className="titulo-minhas-propostas">

          <h1>Minhas Propostas</h1>

          <p>
            Acompanhe as propostas enviadas e seus status.
          </p>

        </div>

        {erro && <p role="alert" className="erro-cancelar-proposta">{erro}</p>}

        {propostas.length === 0 ? (
          <div className="propostas-vazio">
            Nenhuma proposta enviada.
          </div>
        ) : (
          <div className="lista-minhas-propostas">

            {propostas.map((proposta) => (
              <CardProposta
                key={proposta.id}
                proposta={proposta}
                aoExcluir={cancelarProposta}
              />
            ))}

          </div>
        )}

      </section>

    </DashboardLayout>
  )
}

export default MinhasPropostas