import { Route, Routes } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import CategoriasAdmin from './pages/admin/Categorias'
import PedidosAdmin from './pages/admin/Pedidos'
import PedidoDetalheAdmin from './pages/admin/PedidoDetalhe'
import ConfiguracoesAdmin from './pages/admin/Configuracoes'
import MarketingAdmin from './pages/admin/Marketing'
import ClienteLogin from './pages/cliente/Login'
import ClienteCadastro from './pages/cliente/Cadastro'
import Loja from './pages/cliente/Loja'
import Carrinho from './pages/cliente/Carrinho'
import MinhaConta from './pages/cliente/MinhaConta'
import PedidoDetalhe from './pages/cliente/PedidoDetalhe'

export default function App() {
  return (
    <>
      <Routes>
        <Route path='/' element={<Loja />}/>
        <Route path='/entrar' element={<ClienteLogin />}/>
        <Route path='/cadastro' element={<ClienteCadastro />}/>
        <Route path='/carrinho' element={<Carrinho />}/>
        <Route path='/conta' element={<MinhaConta />}/>
        <Route path='/pedidos/:pedidoId' element={<PedidoDetalhe />}/>

        <Route path='/dashboard' element={<Dashboard />}/>
        <Route path='/dashboard/categorias' element={<CategoriasAdmin />}/>
        <Route path='/dashboard/pedidos' element={<PedidosAdmin />}/>
        <Route path='/dashboard/pedidos/:pedidoId' element={<PedidoDetalheAdmin />}/>
        <Route path='/dashboard/configuracoes' element={<ConfiguracoesAdmin />}/>
        <Route path='/dashboard/marketing' element={<MarketingAdmin />}/>
      </Routes>
    </>
  )
}
