import './style.css'

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import DashboardLayout from '../../../layouts/DashboardLayout'
import CardCadastroPendente from '../../../componentes/cardCadastroPendente'
import CardDesempenho from '../../../componentes/cardDesempenho'
import CardRequisicao from '../../../componentes/cardRequisicao'
import menuOrganizador from './menuOrganizador'
import { carregarResumoDashboard } from '../../../services/dashboard'

function Organizador() {
  const requisicoes = []

  const [carregando, setCarregando] = useState(true)
  const [erroCarregamento, setErroCarregamento] = useState('')

  useEffect(() => {
    carregarResumoDashboard()
      .then(() => {
        setCarregando(false)
      })
      .catch((erro) => {
        setErroCarregamento(erro.message)
        setCarregando(false)
      })
  }, [])

  return (
    <DashboardLayout
      tipoUsuario="ORGANIZADOR"
      statusVerificacao="Conta em verificação"
      itensMenu={menuOrganizador}
    >
      {carregando && (
        <div className="estado-carregamento">
          Carregando informações...
        </div>
      )}

      {erroCarregamento && (
        <div className="estado-erro">
          {erroCarregamento}
        </div>
      )}

      <CardCadastroPendente
        destinoCadastro="/organizador/completar-cadastro"
      />

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