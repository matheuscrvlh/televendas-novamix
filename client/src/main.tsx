import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import { CarrinhoProvider } from './contexts/CarrinhoContext'
import { FavoritosProvider } from './contexts/FavoritosContext'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <CarrinhoProvider>
        <FavoritosProvider>
          <App />
        </FavoritosProvider>
      </CarrinhoProvider>
    </BrowserRouter>
  </StrictMode>,
)
