import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/dm-sans'
import '@fontsource-variable/fraunces'
import './sass/main.scss'
import { App } from './app/App.tsx'

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('No se ha encontrado el elemento raíz #root.')
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
