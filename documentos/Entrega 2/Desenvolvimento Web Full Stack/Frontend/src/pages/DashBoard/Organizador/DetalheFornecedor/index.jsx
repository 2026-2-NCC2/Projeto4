import './style.css'

import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Globe,
  AtSign,
  Mail,
  MapPin,
  Package,
  Phone,
  UserRound,
  BriefcaseBusiness,
} from 'lucide-react'

import DashboardLayout from '../../../../layouts/DashboardLayout'
import menuOrganizador from '../menuOrganizador'
import { buscarFornecedorDoServidor } from '../../../../services/usuarios'

const iniciais = (nome = '') => {
  const partes = String(nome).trim().split(/\s+/).filter(Boolean)
  if (!partes.length) return 'F'
  return partes.length === 1
    ? partes[0].slice(0, 2).toUpperCase()
    : `${partes[0][0]}${partes[partes.length - 1][0]}`.toUpperCase()
}

function LinhaContato({ icone: Icone, titulo, valor, href }) {
  return (
    <div className="detalhe-fornecedor-contato">
      <span className="detalhe-fornecedor-contato-icone"><Icone size={17} /></span>
      <div>
        <small>{titulo}</small>
        {href && valor ? <a href={href}>{valor}</a> : <strong>{valor || 'Não informado'}</strong>}
      </div>
    </div>
  )
}

function DetalheFornecedor() {
  const { id } = useParams()
  const [fornecedor, setFornecedor] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    let ativo = true
    setCarregando(true)
    setErro('')
    buscarFornecedorDoServidor(id)
      .then((dados) => {
        if (!ativo) return
        setFornecedor(dados)
        if (!dados) setErro('Fornecedor não encontrado ou ainda não aprovado.')
      })
      .catch((falha) => {
        if (ativo) setErro(falha.message || 'Não foi possível carregar as informações do fornecedor.')
      })
      .finally(() => { if (ativo) setCarregando(false) })
    return () => { ativo = false }
  }, [id])

  const tags = Array.isArray(fornecedor?.tags) ? fornecedor.tags : []
  const produtos = Array.isArray(fornecedor?.produtos) ? fornecedor.produtos : []
  const servicos = Array.isArray(fornecedor?.servicos) ? fornecedor.servicos : []
  const ofertas = [...new Set([...produtos, ...servicos, ...tags].map((item) => String(item).trim()).filter(Boolean))]

  return (
    <DashboardLayout tipoUsuario="ORGANIZADOR" statusVerificacao="Conta em verificação" itensMenu={menuOrganizador}>
      <main className="pagina-detalhe-fornecedor">
        <Link className="voltar-lista-fornecedor" to="/organizador/procurar">
          <ArrowLeft size={16} /> Voltar para fornecedores
        </Link>

        {carregando ? (
          <section className="estado-detalhe-fornecedor">
            <div className="loader-detalhe-fornecedor" />
            <h1>Carregando informações</h1>
            <p>Buscando o perfil atualizado do fornecedor.</p>
          </section>
        ) : erro ? (
          <section className="estado-detalhe-fornecedor">
            <Building2 size={36} />
            <h1>Não foi possível abrir o fornecedor</h1>
            <p>{erro}</p>
            <Link className="botao-voltar-fornecedor" to="/organizador/procurar">Voltar para a lista</Link>
          </section>
        ) : fornecedor && (
          <>
            <header className="hero-detalhe-fornecedor">
              <div className="hero-detalhe-fornecedor-avatar">
                {fornecedor.fotoPerfil
                  ? <img src={fornecedor.fotoPerfil} alt={`Foto de ${fornecedor.nome}`} />
                  : <span>{iniciais(fornecedor.nome)}</span>}
              </div>
              <div className="hero-detalhe-fornecedor-texto">
                <span className="tag-categoria-detalhe-fornecedor">{fornecedor.categoria || 'Outros serviços'}</span>
                <h1>{fornecedor.nome || fornecedor.razaoSocial || 'Fornecedor'}</h1>
                <p>{fornecedor.descricao || 'Este fornecedor ainda não adicionou uma descrição dos serviços.'}</p>
                {!fornecedor.verificado && <div className="aviso-status-fornecedor">{fornecedor.status === 'INCOMPLETO' ? 'Este fornecedor ainda não concluiu o cadastro.' : 'Este cadastro ainda está aguardando a análise da administração.'}</div>}
                <div className="hero-detalhe-fornecedor-meta">
                  <span><MapPin size={14} /> {[fornecedor.cidade, fornecedor.estado].filter(Boolean).join(' - ') || 'Localização não informada'}</span>
                  <span className={fornecedor.verificado ? 'status-aprovado-detalhe' : 'status-pendente-detalhe'}>{fornecedor.verificado ? <><CheckCircle2 size={14} /> Cadastro aprovado</> : fornecedor.status === 'INCOMPLETO' ? <>Cadastro incompleto</> : <>Cadastro aguardando aprovação</>}</span>
                </div>
              </div>
            </header>

            <div className="grid-detalhe-fornecedor">
              <section className="painel-detalhe-fornecedor">
                <div className="titulo-painel-fornecedor">
                  <span><Phone size={18} /></span>
                  <div><h2>Informações de contato</h2><p>Use estes dados para entrar em contato diretamente com a empresa.</p></div>
                </div>
                <div className="lista-contatos-fornecedor">
                  <LinhaContato icone={Mail} titulo="E-mail" valor={fornecedor.email} href={fornecedor.email ? `mailto:${fornecedor.email}` : undefined} />
                  <LinhaContato icone={Phone} titulo="Telefone / WhatsApp" valor={fornecedor.telefone} href={fornecedor.telefone ? `tel:${String(fornecedor.telefone).replace(/[^\d+]/g, '')}` : undefined} />
                  <LinhaContato icone={UserRound} titulo="Responsável" valor={fornecedor.responsavel} />
                  <LinhaContato icone={Building2} titulo="CNPJ" valor={fornecedor.cnpj} />
                  <LinhaContato icone={MapPin} titulo="Cidade / Estado" valor={[fornecedor.cidade, fornecedor.estado].filter(Boolean).join(' - ')} />
                  <LinhaContato icone={Globe} titulo="Site" valor={fornecedor.site} href={fornecedor.site ? (/^https?:\/\//i.test(fornecedor.site) ? fornecedor.site : `https://${fornecedor.site}`) : undefined} />
                  <LinhaContato icone={AtSign} titulo="Instagram" valor={fornecedor.instagram} href={fornecedor.instagram ? (fornecedor.instagram.startsWith('http') ? fornecedor.instagram : `https://instagram.com/${fornecedor.instagram.replace(/^@/, '')}`) : undefined} />
                </div>
              </section>

              <section className="painel-detalhe-fornecedor">
                <div className="titulo-painel-fornecedor">
                  <span><BriefcaseBusiness size={18} /></span>
                  <div><h2>Produtos e serviços oferecidos</h2><p>Categoria e áreas de atuação cadastradas pelo fornecedor.</p></div>
                </div>
                <div className="categoria-principal-fornecedor">
                  <small>Segmento principal</small>
                  <strong>{fornecedor.areaAtuacao || fornecedor.categoria || 'Não informado'}</strong>
                </div>
                {ofertas.length ? (
                  <div className="lista-ofertas-fornecedor">
                    {ofertas.map((oferta, index) => <span className="oferta-fornecedor-chip" key={`${oferta}-${index}`}><Package size={14} /> {oferta}</span>)}
                  </div>
                ) : (
                  <div className="ofertas-vazias-fornecedor">O fornecedor ainda não cadastrou tags ou uma lista específica de produtos e serviços. Consulte a descrição do perfil acima.</div>
                )}
                <div className="descricao-completa-fornecedor">
                  <h3>Descrição da empresa</h3>
                  <p>{fornecedor.descricao || 'Nenhuma descrição foi informada.'}</p>
                </div>
              </section>
            </div>

            <div className="rodape-detalhe-fornecedor">
              <p><CheckCircle2 size={16} /> Os dados exibidos correspondem ao perfil cadastrado no sistema.</p>
              <Link to="/organizador/procurar">Voltar à busca</Link>
            </div>
          </>
        )}
      </main>
    </DashboardLayout>
  )
}

export default DetalheFornecedor
