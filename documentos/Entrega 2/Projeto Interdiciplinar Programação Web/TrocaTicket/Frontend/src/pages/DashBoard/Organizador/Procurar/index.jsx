import './style.css'

import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Search,
  MapPin,
  ShieldCheck,
  SlidersHorizontal,
  ArrowUpRight,
  Sparkles,
  Phone,
  Mail,
  Building2
} from 'lucide-react'

import DashboardLayout from '../../../../layouts/DashboardLayout'
import menuOrganizador from '../menuOrganizador'
import { listarFornecedores, listarFornecedoresDoServidor } from '../../../../services/usuarios'

const obterIniciais = (nome = '') => {
  const partes = nome.trim().split(/\s+/).filter(Boolean)
  if (!partes.length) return 'F'
  return partes.length === 1 ? partes[0].slice(0, 2).toUpperCase() : `${partes[0][0]}${partes[partes.length - 1][0]}`.toUpperCase()
}

function Procurar() {
  const [fornecedores, setFornecedores] = useState(() => listarFornecedores())
  const [carregando, setCarregando] = useState(true)
  const [erroCarregamento, setErroCarregamento] = useState('')
  const [busca, setBusca] = useState('')

  useEffect(() => {
    let ativo = true
    listarFornecedoresDoServidor()
      .then((lista) => { if (ativo) { setFornecedores(lista); setErroCarregamento('') } })
      .catch((erro) => { if (ativo) setErroCarregamento(erro.message || 'Não foi possível carregar os fornecedores.') })
      .finally(() => { if (ativo) setCarregando(false) })
    return () => { ativo = false }
  }, [])
  const [categoriaSelecionada, setCategoriaSelecionada] = useState('Todos')
  const [apenasVerificados, setApenasVerificados] = useState(false)
  const categorias = useMemo(
    () => ['Todos', ...new Set(fornecedores.map((fornecedor) => fornecedor.categoria).filter(Boolean))],
    [fornecedores]
  )

  const fornecedoresFiltrados = useMemo(() => fornecedores.filter((fornecedor) => {
    const tags = Array.isArray(fornecedor.tags) ? fornecedor.tags : []
    const produtos = Array.isArray(fornecedor.produtos) ? fornecedor.produtos : []
    const servicos = Array.isArray(fornecedor.servicos) ? fornecedor.servicos : []
    const texto = `${fornecedor.nome || ''} ${fornecedor.categoria || ''} ${fornecedor.areaAtuacao || ''} ${fornecedor.descricao || ''} ${fornecedor.email || ''} ${fornecedor.telefone || ''} ${fornecedor.cidade || ''} ${fornecedor.estado || ''} ${tags.join(' ')} ${produtos.join(' ')} ${servicos.join(' ')}`.toLowerCase()
    return texto.includes(busca.toLowerCase()) &&
      (categoriaSelecionada === 'Todos' || fornecedor.categoria === categoriaSelecionada) &&
      (!apenasVerificados || fornecedor.verificado)
  }), [fornecedores, busca, categoriaSelecionada, apenasVerificados])

  return (
    <DashboardLayout
      tipoUsuario="ORGANIZADOR"
      statusVerificacao="Conta em verificação"
      itensMenu={menuOrganizador}
    >
      <div className="pagina-procurar-fornecedores">
        <header className="cabecalho-procurar">
          <div>
            <span className="badge-topo-procurar">
              <Sparkles size={12} /> FORNECEDORES CADASTRADOS
            </span>
            <h1>Procurar Fornecedores</h1>
            <p>Pesquise fornecedores cadastrados, consulte os serviços e os contatos informados. O status mostra se o cadastro já foi aprovado pela administração.</p>
          </div>
        </header>

        <div className="toolbar-busca-fornecedores">
          <div className="campo-pesquisa-fornecedor">
            <Search size={16} />
            <input
              type="text"
              value={busca}
              onChange={(evento) => setBusca(evento.target.value)}
              placeholder="Buscar por empresa, serviço ou descrição..."
            />
          </div>
          <div className="contador-fornecedores-aprovados">
            <ShieldCheck size={15} />
            <span>{fornecedores.length} {fornecedores.length === 1 ? 'fornecedor cadastrado' : 'fornecedores cadastrados'}</span>
          </div>
          <button
            type="button"
            className={`btn-filtro-verificados ${apenasVerificados ? 'filtro-ativo' : ''}`}
            onClick={() => setApenasVerificados((ativo) => !ativo)}
            title="Filtrar apenas fornecedores com cadastro aprovado"
          >
            <ShieldCheck size={15} />
            <span>{apenasVerificados ? 'Mostrando aprovados' : 'Apenas aprovados'}</span>
          </button>
        </div>

        {erroCarregamento && <div className="aviso-erro-fornecedores" role="alert">{erroCarregamento} <button type="button" onClick={() => { setCarregando(true); setErroCarregamento(''); listarFornecedoresDoServidor().then(setFornecedores).catch((erro) => setErroCarregamento(erro.message || 'Falha ao atualizar a lista.')).finally(() => setCarregando(false)) }}>Tentar novamente</button></div>}

        <div className="carrossel-categorias-filtro">
          {categorias.map((categoria) => (
            <button
              key={categoria}
              type="button"
              className={`pill-categoria ${categoriaSelecionada === categoria ? 'pill-ativa' : ''}`}
              onClick={() => setCategoriaSelecionada(categoria)}
            >
              {categoria}
            </button>
          ))}
        </div>

        <div className="grid-cards-fornecedores">
          {carregando ? (
            <div className="sem-fornecedores-box"><div className="icone-vazio-busca"><Search size={28} /></div><h3>Carregando fornecedores...</h3><p>Buscando os dados atualizados no servidor.</p></div>
          ) : fornecedoresFiltrados.length === 0 ? (
            <div className="sem-fornecedores-box">
              <div className="icone-vazio-busca"><SlidersHorizontal size={28} /></div>
              <h3>{fornecedores.length === 0 ? 'Nenhum fornecedor cadastrado disponível' : 'Nenhum fornecedor encontrado'}</h3>
              <p>{fornecedores.length === 0
                ? 'Fornecedores ativos aparecem aqui; perfis rejeitados não são exibidos. Use o filtro para consultar apenas os aprovados.'
                : 'Tente ajustar a pesquisa ou remover os filtros aplicados.'}</p>
              <button
                type="button"
                className="btn-limpar-filtros"
                onClick={() => { setBusca(''); setCategoriaSelecionada('Todos') }}
              >
                Limpar filtros
              </button>
            </div>
          ) : fornecedoresFiltrados.map((fornecedor) => (
            <article key={fornecedor.id} className="card-fornecedor-pro">
              <div className="topo-card-fornecedor">
                {fornecedor.fotoPerfil ? <img className="avatar-fornecedor-logo avatar-fornecedor-foto" src={fornecedor.fotoPerfil} alt={`Logo de ${fornecedor.nome}`} /> : <div className="avatar-fornecedor-logo">{obterIniciais(fornecedor.nome)}</div>}
                <div className="info-topo-fornecedor">
                  <span className="categoria-tag-fornecedor">{fornecedor.categoria || 'Outros'}</span>
                  <h2 className="nome-fornecedor-titulo">{fornecedor.nome}</h2>
                </div>
                {fornecedor.verificado && (
                  <div className="icone-verificado-badge" title="Cadastro aprovado pela administração">
                    <ShieldCheck size={18} />
                  </div>
                )}
              </div>

              <div className="meta-dados-fornecedor">
                <div className="local-fornecedor-box">
                  <MapPin size={12} />
                  <span>{[fornecedor.cidade, fornecedor.estado].filter(Boolean).join(' - ') || 'Local não informado'}</span>
                </div>
              </div>

              <p className="descricao-servicos-fornecedor">
                {fornecedor.descricao || 'Descrição dos serviços ainda não informada.'}
              </p>

              <div className="tags-chips-container">
                {[...new Set([...(Array.isArray(fornecedor.tags) ? fornecedor.tags : []), ...(Array.isArray(fornecedor.produtos) ? fornecedor.produtos : []), ...(Array.isArray(fornecedor.servicos) ? fornecedor.servicos : [])])].slice(0, 5).map((tag, index) => (
                  <span key={`${fornecedor.id}-${index}`} className="chip-tag-item">{tag}</span>
                ))}
              </div>

              <div className="contatos-fornecedor-card">
                <div className="contato-fornecedor-item"><Mail size={14} /><span>{fornecedor.email || 'E-mail não informado'}</span></div>
                <div className="contato-fornecedor-item"><Phone size={14} /><span>{fornecedor.telefone || 'Telefone não informado'}</span></div>
                {fornecedor.cnpj && <div className="contato-fornecedor-item"><Building2 size={14} /><span>CNPJ: {fornecedor.cnpj}</span></div>}
              </div>

              <div className="rodape-card-fornecedor">
                <span className={`fornecedor-status-aprovado ${fornecedor.verificado ? '' : 'fornecedor-status-pendente'}`}>
                  {fornecedor.verificado
                    ? <><ShieldCheck size={14} /> Cadastro aprovado</>
                    : fornecedor.status === 'INCOMPLETO'
                      ? <>Cadastro incompleto</>
                      : <>Cadastro em análise</>}
                </span>
                <Link to={`/organizador/fornecedores/${encodeURIComponent(fornecedor.id)}`} className="btn-solicitar-proposta">
                  <span>Ver informações</span>
                  <ArrowUpRight size={14} />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}

export default Procurar
