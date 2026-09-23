import './style.css'

import { useState } from 'react'
import {
  Check,
  X
} from 'lucide-react'

import DashboardLayout from '../../../../layouts/DashboardLayout'
import menuAdministrador from '../menuAdministrador'

import {
  listarUsuarios,
  alterarStatusUsuario
} from '../../../../services/usuarios'

const usuariosDemonstracao = [
  {
    id: 'demo-organizador',
    nome: 'Nexus Produções',
    email: 'nexus@email.com',
    perfil: 'ORGANIZADOR',
    status: 'PENDENTE'
  },
  {
    id: 'demo-fornecedor',
    nome: 'Som & Luz Eventos',
    email: 'contato@someluz.com',
    perfil: 'FORNECEDOR',
    status: 'PENDENTE'
  }
]

function CadastrosAdministrador() {
  const usuariosSalvos = listarUsuarios()

  const [usuarios, setUsuarios] = useState(
    usuariosSalvos.length > 0
      ? usuariosSalvos
      : usuariosDemonstracao
  )

  function alterarStatus(id, status) {
    setUsuarios((usuariosAtuais) =>
      usuariosAtuais.map((usuario) => {
        if (String(usuario.id) === String(id)) {
          return {
            ...usuario,
            status
          }
        }

        return usuario
      })
    )

    const usuarioReal = usuariosSalvos.find(
      (usuario) => String(usuario.id) === String(id)
    )

    if (usuarioReal) {
      alterarStatusUsuario(id, status)
    }
  }

  return (
    <DashboardLayout
      tipoUsuario="ADMINISTRADOR"
      statusVerificacao="Gestão da plataforma"
      itensMenu={menuAdministrador}
    >

      <section className="pagina-cadastros-admin">

        <div className="titulo-cadastros-admin">

          <h1>
            Cadastros
          </h1>

          <p>
            Analise os cadastros de Organizadores e Fornecedores.
          </p>

        </div>

        <div className="lista-cadastros-admin">

          {usuarios.map((usuario) => (
            <article
              className="card-cadastro-admin"
              key={usuario.id}
            >

              <div className="dados-cadastro-admin">

                <span>
                  {usuario.perfil}
                </span>

                <h2>
                  {usuario.nome || usuario.razaoSocial}
                </h2>

                <p>
                  {usuario.email}
                </p>

              </div>

              <div className="status-cadastro-admin">

                <strong
                  className={`status-admin ${usuario.status.toLowerCase()}`}
                >
                  {usuario.status}
                </strong>

                {usuario.status === 'PENDENTE' && (
                  <div className="acoes-cadastro-admin">

                    <button
                      type="button"
                      className="aprovar-cadastro"
                      onClick={() =>
                        alterarStatus(usuario.id, 'APROVADO')
                      }
                    >
                      <Check />
                      Aprovar
                    </button>

                    <button
                      type="button"
                      className="rejeitar-cadastro"
                      onClick={() =>
                        alterarStatus(usuario.id, 'REJEITADO')
                      }
                    >
                      <X />
                      Rejeitar
                    </button>

                  </div>
                )}

              </div>

            </article>
          ))}

        </div>

      </section>

    </DashboardLayout>
  )
}

export default CadastrosAdministrador