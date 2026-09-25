import './style.css'

import { useState } from 'react'

import DashboardLayout from '../../../../layouts/DashboardLayout'
import menuOrganizador from '../menuOrganizador'

import { listarPropostas } from '../../../../services/propostas'

function PropostasOrganizador() {
  const [propostas, setPropostas] = useState(
    listarPropostas()
  )

  function alterarStatus(id, status) {
    const atualizadas = propostas.map((proposta) => {
      if (String(proposta.id) === String(id)) {
        return {
          ...proposta,
          status
        }
      }

      return proposta
    })

    // A decisão do organizador é persistida para manter o status ao reabrir a página.
    localStorage.setItem(
      'trocaticket_propostas',
      JSON.stringify(atualizadas)
    )

    setPropostas(atualizadas)
  }

  return (
    <DashboardLayout
      tipoUsuario="ORGANIZADOR"
      statusVerificacao="Conta em verificação"
      itensMenu={menuOrganizador}
    >

      <section className="pagina-propostas-organizador">

        <h1>
          Propostas Recebidas
        </h1>

        <p>
          Consulte as propostas enviadas pelos fornecedores.
        </p>

        {propostas.length === 0 ? (
          <div className="sem-propostas-organizador">
            Nenhuma proposta recebida.
          </div>
        ) : (
          <div className="lista-propostas-organizador">

            {propostas.map((proposta) => (
              <article
                key={proposta.id}
                className="proposta-organizador"
              >

                <span>
                  {proposta.status}
                </span>

                <h2>
                  {proposta.evento}
                </h2>

                <p>
                  {proposta.categoria} — {proposta.item}
                </p>

                <strong>
                  R$ {Number(proposta.valor).toLocaleString(
                    'pt-BR',
                    {
                      minimumFractionDigits: 2
                    }
                  )}
                </strong>

                <div>

                  <button
                    type="button"
                    onClick={() =>
                      alterarStatus(
                        proposta.id,
                        'ACEITA'
                      )
                    }
                  >
                    Aceitar
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      alterarStatus(
                        proposta.id,
                        'RECUSADA'
                      )
                    }
                  >
                    Recusar
                  </button>

                </div>

              </article>
            ))}

          </div>
        )}

      </section>

    </DashboardLayout>
  )
}

export default PropostasOrganizador