import { BrowserRouter, Routes, Route } from 'react-router-dom'

import Home from './pages/Home'
import Login from './pages/Login'
import Cadastro from './pages/Cadastro'
import Organizador from './pages/DashBoard/Organizador'
import Fornecedor from './pages/Dashboard/Fornecedor'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />
        <Route path="/organizador" element={<Organizador />} />
        <Route path="/fornecedor" element={<Fornecedor />}
/>
      </Routes>
    </BrowserRouter>
  )
}

export default App