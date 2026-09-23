import { BrowserRouter, Routes, Route } from 'react-router-dom'

import Home from './pages/Home'
import Login from './pages/Login'
import Cadastro from './pages/Cadastro'

import Organizador from './pages/DashBoard/Organizador'
import Eventos from './pages/DashBoard/Organizador/Eventos'
import Procurar from './pages/DashBoard/Organizador/Procurar'
import CriarEvento from './pages/DashBoard/Organizador/CriarEvento'
import Perfil from './pages/DashBoard/Organizador/Perfil'
import DetalheEvento from './pages/DashBoard/Organizador/DetalheEvento'
import EditarEvento from './pages/DashBoard/Organizador/EditarEvento'
import ItensCusto from './pages/DashBoard/Organizador/ItensCusto'
import CompletarCadastroOrganizador from './pages/DashBoard/Organizador/CompletarCadastro'

import Fornecedor from './pages/DashBoard/Fornecedor'
import ProcurarEvento from './pages/DashBoard/Fornecedor/ProcurarEvento'
import EventoDisponivel from './pages/DashBoard/Fornecedor/EventoDisponivel'
import CriarProposta from './pages/DashBoard/Fornecedor/CriarProposta'
import MinhasPropostas from './pages/DashBoard/Fornecedor/MinhasPropostas'
import PerfilFornecedor from './pages/DashBoard/Fornecedor/Perfil'
import CompletarCadastroFornecedor from './pages/DashBoard/Fornecedor/CompletarCadastro'

import Administrador from './pages/DashBoard/Administrador'
import CadastrosAdministrador from './pages/DashBoard/Administrador/Cadastros'
import EventosAdministrador from './pages/DashBoard/Administrador/Eventos'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />

        <Route path="/organizador" element={<Organizador />} />
        <Route path="/organizador/eventos" element={<Eventos />} />
        <Route path="/organizador/procurar" element={<Procurar />} />
        <Route path="/organizador/criar-evento" element={<CriarEvento />} />
        <Route path="/organizador/eventos/:id" element={<DetalheEvento />} />
        <Route path="/organizador/eventos/:id/editar" element={<EditarEvento />} />
        <Route path="/organizador/eventos/:id/itens-custo" element={<ItensCusto />} />
        <Route path="/organizador/perfil" element={<Perfil />} />
        <Route path="/organizador/completar-cadastro" element={<CompletarCadastroOrganizador />} />

        <Route path="/fornecedor/completar-cadastro" element={<CompletarCadastroFornecedor />} />
        <Route path="/fornecedor" element={<Fornecedor />} />
        <Route path="/fornecedor/procurar-evento" element={<ProcurarEvento />} />
        <Route path="/fornecedor/eventos/:id" element={<EventoDisponivel />} />
        <Route path="/fornecedor/criar-proposta" element={<CriarProposta />} />
        <Route path="/fornecedor/propostas" element={<MinhasPropostas />} />
        <Route path="/fornecedor/perfil" element={<PerfilFornecedor />} />

        <Route path="/administrador" element={<Administrador />} />
        <Route path="/administrador/cadastros" element={<CadastrosAdministrador />} />
        <Route path="/administrador/eventos" element={<EventosAdministrador />} />      
      
      </Routes>
    </BrowserRouter>
  )
}

export default App