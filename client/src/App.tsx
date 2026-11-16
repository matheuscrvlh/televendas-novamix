import { useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { CLIENTES_ADMIN_ATIVO, PEDIDOS_ADMIN_ATIVO } from './lib/funcionalidades'
import Dashboard from './pages/Dashboard'
import CategoriasAdmin from './pages/admin/Categorias'
import PedidosAdmin from './pages/admin/Pedidos'
import ClientesAdmin from './pages/admin/Clientes'
import PedidoDetalheAdmin from './pages/admin/PedidoDetalhe'
import ConfiguracoesAdmin from './pages/admin/Configuracoes'
import MarketingAdmin from './pages/admin/Marketing'
import ClienteLogin from './pages/cliente/Login'
import ClienteCadastro from './pages/cliente/Cadastro'
import Loja from './pages/cliente/Loja'
import Favoritos from './pages/cliente/Favoritos'
import MinhaConta from './pages/cliente/MinhaConta'
import PedidoDetalhe from './pages/cliente/PedidoDetalhe'

function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path='/' element={<Loja />}/>
        <Route path='/entrar' element={<ClienteLogin />}/>
        <Route path='/cadastro' element={<ClienteCadastro />}/>
        <Route path='/favoritos' element={<Favoritos />}/>
        <Route path='/conta' element={<MinhaConta />}/>
        <Route path='/pedidos/:pedidoId' element={<PedidoDetalhe />}/>

        <Route path='/dashboard' element={<Dashboard />}/>
        <Route path='/dashboard/categorias' element={<CategoriasAdmin />}/>
        {/* Abas "Pedidos" e "Clientes" desligadas por enquanto: o endereço volta pro Dashboard (ver lib/funcionalidades.ts). */}
        <Route
          path='/dashboard/pedidos'
          element={PEDIDOS_ADMIN_ATIVO ? <PedidosAdmin /> : <Navigate to='/dashboard' replace />}
        />
        <Route
          path='/dashboard/pedidos/:pedidoId'
          element={PEDIDOS_ADMIN_ATIVO ? <PedidoDetalheAdmin /> : <Navigate to='/dashboard' replace />}
        />
        <Route
          path='/dashboard/clientes'
          element={CLIENTES_ADMIN_ATIVO ? <ClientesAdmin /> : <Navigate to='/dashboard' replace />}
        />
        <Route path='/dashboard/configuracoes' element={<ConfiguracoesAdmin />}/>
        <Route path='/dashboard/marketing' element={<MarketingAdmin />}/>
      </Routes>
    </>
  )
}
