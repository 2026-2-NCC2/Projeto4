import './style.css'

import { useEffect, useState } from 'react'

import DashboardLayout from '../../../../layouts/DashboardLayout'
import menuOrganizador from '../menuOrganizador'

import { listarPropostas, listarPropostasServidor, atualizarStatusProposta } from '../../../../services/propostas'

function PropostasOrganizador() {
  const [propostas, setPropostas] = useState(
    listarPropostas()
  )
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    let ativo = true
    listarPropostasServidor()
      .then((lista) => { if (ativo) setPropostas(Array.isArray(lista) ? lista : []) })
      .catch((erroConsulta) => { if (ativo) setErro(erroConsulta?.message || 'Não foi possível carregar as propostas do servidor.') })
      .finally(() => { if (ativo) setCarregando(false) })
    return () => { ativo = false }
  }, [])

  async function alterarStatus(id, status) {
    try {
      await atualizarStatusProposta(id, status)
      try {
        const atualizadas = await listarPropostasServidor()
        setPropostas(Array.isArray(atualizadas) ? atualizadas : listarPropostas())
      } catch {
        setPropostas(listarPropostas())
      }
      setErro('')
    } catch (erroStatus) {
      setErro(erroStatus.message || 'Não foi possível atualizar a proposta.')
    }
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

        {erro && <p role="alert" className="erro-proposta-organizador">{erro}</p>}

        {carregando ? (
          <div className="sem-propostas-organizador">Carregando propostas...</div>
        ) : propostas.length === 0 ? (
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

                {proposta.status === 'EM ANÁLISE' && (
                  <div>
                    <button
                      type="button"
                      onClick={() => alterarStatus(proposta.id, 'ACEITA')}
                    >
                      Aceitar
                    </button>
                    <button
                      type="button"
                      onClick={() => alterarStatus(proposta.id, 'RECUSADA')}
                    >
                      Recusar
                    </button>
                  </div>
                )}

                {String(proposta.status || '').toUpperCase() === 'ACEITA' && proposta.contatoFornecedor && (
                  <section className="contato-fornecedor-aceito" aria-label="Contato comercial do fornecedor">
                    <div className="contato-fornecedor-aceito-topo">
                      <span className="contato-fornecedor-aceito-icone" aria-hidden="true">✓</span>
                      <div>
                        <h3>Contato liberado — proposta aceita</h3>
                        <p>Entre em contato com o fornecedor para combinar os próximos passos.</p>
                      </div>
                    </div>
                    <dl className="contato-fornecedor-aceito-dados">
                      {proposta.contatoFornecedor.razaoSocial && <div><dt>Empresa</dt><dd>{proposta.contatoFornecedor.razaoSocial}</dd></div>}
                      {proposta.contatoFornecedor.responsavel && <div><dt>Responsável</dt><dd>{proposta.contatoFornecedor.responsavel}</dd></div>}
                      {proposta.contatoFornecedor.email && <div><dt>E-mail</dt><dd><a href={`mailto:${proposta.contatoFornecedor.email}`}>{proposta.contatoFornecedor.email}</a></dd></div>}
                      {proposta.contatoFornecedor.telefone && <div><dt>Telefone / WhatsApp</dt><dd>{proposta.contatoFornecedor.telefone}</dd></div>}
                      {(proposta.contatoFornecedor.cidade || proposta.contatoFornecedor.estado) && <div><dt>Localização</dt><dd>{[proposta.contatoFornecedor.cidade, proposta.contatoFornecedor.estado].filter(Boolean).join(' / ')}</dd></div>}
                    </dl>
                    <div className="contato-fornecedor-aceito-acoes">
                      {proposta.contatoFornecedor.email && <a href={`mailto:${proposta.contatoFornecedor.email}`}>Enviar e-mail</a>}
                      {proposta.contatoFornecedor.telefone && <a href={`https://wa.me/${String(proposta.contatoFornecedor.whatsapp || proposta.contatoFornecedor.telefone).replace(/\D/g, '').replace(/^0+/, '').replace(/^(?!55)(\d{10,11})$/, '55$1')}`} target="_blank" rel="noreferrer">Abrir WhatsApp</a>}
                      {proposta.contatoFornecedor.site && <a href={/^https?:\/\//i.test(proposta.contatoFornecedor.site) ? proposta.contatoFornecedor.site : `https://${proposta.contatoFornecedor.site}`} target="_blank" rel="noreferrer">Site</a>}
                    </div>
                  </section>
                )}

              </article>
            ))}

          </div>
        )}

      </section>

    </DashboardLayout>
  )
}

export default PropostasOrganizador