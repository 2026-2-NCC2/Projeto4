import { BrowserRouter, Routes, Route } from 'react-router-dom'

import Home from './pages/Home'
import Login from './pages/Login'
import Cadastro from './pages/Cadastro'

import Organizador from './pages/DashBoard/Organizador'
import Eventos from './pages/DashBoard/Organizador/Eventos'
import Procurar from './pages/DashBoard/Organizador/Procurar'
import DetalheFornecedor from './pages/DashBoard/Organizador/DetalheFornecedor'
import CriarEvento from './pages/DashBoard/Organizador/CriarEvento'
import Perfil from './pages/DashBoard/Organizador/Perfil'
import DetalheEvento from './pages/DashBoard/Organizador/DetalheEvento'
import EditarEvento from './pages/DashBoard/Organizador/EditarEvento'
import ItensCusto from './pages/DashBoard/Organizador/ItensCusto'
import PrecificacaoEvento from './pages/DashBoard/Organizador/Precificacao'
import RelatorioFinanceiroEvento from './pages/DashBoard/Organizador/RelatorioFinanceiro'
import CompletarCadastroOrganizador from './pages/DashBoard/Organizador/CompletarCadastro'
import PropostasOrganizador from './pages/DashBoard/Organizador/Propostas'

import Fornecedor from './pages/DashBoard/Fornecedor'
import ProcurarEvento from './pages/DashBoard/Fornecedor/ProcurarEvento'
import EventoDisponivel from './pages/DashBoard/Fornecedor/EventoDisponivel'
import CriarProposta from './pages/DashBoard/Fornecedor/CriarProposta'
import MinhasPropostas from './pages/DashBoard/Fornecedor/MinhasPropostas'
import RelatorioFornecedor from './pages/DashBoard/Fornecedor/RelatorioPropostas'
import DetalheOrganizador from './pages/DashBoard/Fornecedor/DetalheOrganizador'
import PerfilFornecedor from './pages/DashBoard/Fornecedor/Perfil'
import CompletarCadastroFornecedor from './pages/DashBoard/Fornecedor/CompletarCadastro'

import NaoEncontrada from './pages/NaoEncontrada'
import RotaProtegida from './componentes/RotaProtegida'
import RotaPublica from './componentes/RotaPublica'

import Administrador from './pages/DashBoard/Administrador'
import CadastrosAdministrador from './pages/DashBoard/Administrador/Cadastros'
import EventosAdministrador from './pages/DashBoard/Administrador/Eventos'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Páginas públicas de entrada e criação de conta. */}
        <Route path="/" element={<RotaPublica><Home /></RotaPublica>} />
        <Route path="/login" element={<RotaPublica><Login /></RotaPublica>} />
        <Route path="/cadastro" element={<RotaPublica><Cadastro /></RotaPublica>} />

        {/* Área do organizador: eventos, serviços requeridos e propostas recebidas. */}
        <Route path="/organizador" element={<RotaProtegida perfis={['ORGANIZADOR']}><Organizador /></RotaProtegida>} />
        <Route path="/organizador/eventos" element={<RotaProtegida perfis={['ORGANIZADOR']}><Eventos /></RotaProtegida>} />
        <Route path="/organizador/procurar" element={<RotaProtegida perfis={['ORGANIZADOR']}><Procurar /></RotaProtegida>} />
        {/* Detalhes de fornecedor: rota canônica e aliases para links de versões anteriores. */}
        <Route path="/organizador/fornecedores/:id" element={<RotaProtegida perfis={['ORGANIZADOR']}><DetalheFornecedor /></RotaProtegida>} />
        <Route path="/organizador/fornecedor/:id" element={<RotaProtegida perfis={['ORGANIZADOR']}><DetalheFornecedor /></RotaProtegida>} />
        <Route path="/organizador/procurar/fornecedor/:id" element={<RotaProtegida perfis={['ORGANIZADOR']}><DetalheFornecedor /></RotaProtegida>} />
        <Route path="/organizador/procurar/fornecedores/:id" element={<RotaProtegida perfis={['ORGANIZADOR']}><DetalheFornecedor /></RotaProtegida>} />
        <Route path="/organizador/procurar/:id" element={<RotaProtegida perfis={['ORGANIZADOR']}><DetalheFornecedor /></RotaProtegida>} />
        <Route path="/organizador/criar-evento" element={<RotaProtegida perfis={['ORGANIZADOR']} statusNecessario="APROVADO"><CriarEvento /></RotaProtegida>} />
        <Route path="/organizador/eventos/:id" element={<RotaProtegida perfis={['ORGANIZADOR']}><DetalheEvento /></RotaProtegida>} />
        <Route path="/organizador/eventos/:id/editar" element={<RotaProtegida perfis={['ORGANIZADOR']} statusNecessario="APROVADO"><EditarEvento /></RotaProtegida>} />
        <Route path="/organizador/eventos/:id/itens-custo" element={<RotaProtegida perfis={['ORGANIZADOR']} statusNecessario="APROVADO"><ItensCusto /></RotaProtegida>} />
        <Route path="/organizador/eventos/:id/precificacao" element={<RotaProtegida perfis={['ORGANIZADOR']}><PrecificacaoEvento /></RotaProtegida>} />
        <Route path="/organizador/eventos/:id/relatorio" element={<RotaProtegida perfis={['ORGANIZADOR']}><RelatorioFinanceiroEvento /></RotaProtegida>} />
        <Route path="/organizador/perfil" element={<RotaProtegida perfis={['ORGANIZADOR']}><Perfil /></RotaProtegida>} />
        <Route path="/organizador/completar-cadastro" element={<RotaProtegida perfis={['ORGANIZADOR']}><CompletarCadastroOrganizador /></RotaProtegida>} />
        <Route path="/organizador/propostas" element={<RotaProtegida perfis={['ORGANIZADOR']}><PropostasOrganizador /></RotaProtegida>} />

        {/* Área do fornecedor: busca de eventos e envio de propostas. */}
        <Route path="/fornecedor/completar-cadastro" element={<RotaProtegida perfis={['FORNECEDOR']}><CompletarCadastroFornecedor /></RotaProtegida>} />
        <Route path="/fornecedor" element={<RotaProtegida perfis={['FORNECEDOR']}><Fornecedor /></RotaProtegida>} />
        <Route path="/fornecedor/procurar-evento" element={<RotaProtegida perfis={['FORNECEDOR']} statusNecessario="APROVADO"><ProcurarEvento /></RotaProtegida>} />
        <Route path="/fornecedor/eventos/:id" element={<RotaProtegida perfis={['FORNECEDOR']} statusNecessario="APROVADO"><EventoDisponivel /></RotaProtegida>} />
        <Route path="/fornecedor/criar-proposta" element={<RotaProtegida perfis={['FORNECEDOR']} statusNecessario="APROVADO"><CriarProposta /></RotaProtegida>} />
        <Route path="/fornecedor/propostas" element={<RotaProtegida perfis={['FORNECEDOR']}><MinhasPropostas /></RotaProtegida>} />
        <Route path="/fornecedor/relatorio" element={<RotaProtegida perfis={['FORNECEDOR']}><RelatorioFornecedor /></RotaProtegida>} />
        <Route path="/fornecedor/organizadores/:id" element={<RotaProtegida perfis={['FORNECEDOR']} statusNecessario="APROVADO"><DetalheOrganizador /></RotaProtegida>} />
        <Route path="/fornecedor/perfil" element={<RotaProtegida perfis={['FORNECEDOR']}><PerfilFornecedor /></RotaProtegida>} />

        {/* Telas de administração da plataforma. */}
        <Route path="/administrador" element={<RotaProtegida perfis={['ADMINISTRADOR']}><Administrador /></RotaProtegida>} />
        <Route path="/administrador/cadastros" element={<RotaProtegida perfis={['ADMINISTRADOR']}><CadastrosAdministrador /></RotaProtegida>} />
        <Route path="/administrador/eventos" element={<RotaProtegida perfis={['ADMINISTRADOR']}><EventosAdministrador /></RotaProtegida>} />

        {/* Sempre por último: captura apenas endereços realmente desconhecidos. */}
        <Route path="*" element={<NaoEncontrada />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App