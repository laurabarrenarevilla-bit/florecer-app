import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/dm-sans'
import '@fontsource-variable/fraunces'
import './sass/main.scss'
import './lib/zodConfig.ts'
import { App } from './app/App.tsx'
import { listenForInstall } from './features/pwa/installPrompt.ts'
import { startPwa } from './features/pwa/registration.ts'

listenForInstall()
void startPwa()

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('No se ha encontrado el elemento raíz #root.')
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
