import './style.css'

import { useState } from 'react'
import { Search } from 'lucide-react'

import DashboardLayout from '../../../../layouts/DashboardLayout'
import menuOrganizador from '../menuOrganizador'

const fornecedores = [
  {
    id: 1,
    nome: 'Luz Eventos',
    categoria: 'Iluminação'
  },
  {
    id: 2,
    nome: 'Segurança Prime',
    categoria: 'Segurança'
  },
  {
    id: 3,
    nome: 'Estrutura Brasil',
    categoria: 'Estrutura'
  },
  {
    id: 4,
    nome: 'Buffet Eventos',
    categoria: 'Alimentação'
  }
]

function Procurar() {
  const [busca, setBusca] = useState('')

  const resultado = fornecedores.filter((fornecedor) => {
    const texto = busca.toLowerCase()

    return (
      fornecedor.nome.toLowerCase().includes(texto) ||
      fornecedor.categoria.toLowerCase().includes(texto)
    )
  })

  return (
    <DashboardLayout
      tipoUsuario="ORGANIZADOR"
      statusVerificacao="Conta em verificação"
      itensMenu={menuOrganizador}
    >
      <section className="pagina-procurar">

        <div className="titulo-procurar">
          <h1>Procurar</h1>

          <p>
            Pesquise fornecedores e serviços disponíveis.
          </p>
        </div>

        <div className="campo-busca">
          <Search />

          <input
            type="search"
            value={busca}
            onChange={(evento) => setBusca(evento.target.value)}
            placeholder="Pesquisar por nome ou categoria"
          />
        </div>

        <div className="resultado-busca">

          {resultado.length === 0 ? (
            <p className="sem-resultado">
              Nenhum resultado encontrado.
            </p>
          ) : (
            resultado.map((fornecedor) => (
              <article
                key={fornecedor.id}
                className="card-fornecedor"
              >
                <span>
                  {fornecedor.categoria}
                </span>

                <h2>
                  {fornecedor.nome}
                </h2>

                <button type="button">
                  Ver fornecedor
                </button>
              </article>
            ))
          )}

        </div>

      </section>
    </DashboardLayout>
  )
}

export default Procurar