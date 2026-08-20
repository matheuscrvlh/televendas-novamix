import { Route, Routes } from 'react-router-dom'
import Catalogo from './pages/Catalogo'
import Dashboard from './pages/Dashboard'

export default function App() {
  return (
    <>
      <Routes>
        <Route path='/' element={<Catalogo />}/>
        <Route path='/dashboard' element={<Dashboard />}/>
      </Routes>
    </>
  )
}
