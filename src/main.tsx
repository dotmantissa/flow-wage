import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Web3Provider } from '@/providers/Web3Provider'
import { Toaster } from 'sonner'
import './index.css'
import App from './App'

document.documentElement.classList.add('dark')

const root = document.getElementById('root')
if (!root) throw new Error('Root element #root not found')

createRoot(root).render(
  <StrictMode>
    <Web3Provider>
      <App />
      <Toaster richColors position="top-right" expand />
    </Web3Provider>
  </StrictMode>,
)
