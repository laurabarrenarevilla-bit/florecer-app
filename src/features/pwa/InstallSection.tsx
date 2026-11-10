import { useEffect, useState, useSyncExternalStore } from 'react'
import { Button } from '@/shared/ui/Button.tsx'
import { InlineAlert } from '@/shared/ui/InlineAlert.tsx'

import { clearInstallPrompt, getInstallPrompt, installedThisSession, listenForInstall, subscribeInstallPrompt } from './installPrompt.ts'

function inStandalone(): boolean {
  return installedThisSession() || window.matchMedia?.('(display-mode: standalone)').matches === true ||
    ('standalone' in navigator && navigator.standalone === true)
}

export function InstallSection() {
  const prompt = useSyncExternalStore(subscribeInstallPrompt, getInstallPrompt)
  const [installed, setInstalled] = useState(inStandalone)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(false)
  const [accepted, setAccepted] = useState(false)

  useEffect(() => {
    listenForInstall()
    const update = () => setInstalled(inStandalone())
    const onInstalled = () => setInstalled(true)
    const mode = window.matchMedia?.('(display-mode: standalone)')
    mode?.addEventListener('change', update)
    window.addEventListener('appinstalled', onInstalled)
    update()
    return () => {
      mode?.removeEventListener('change', update)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  if (installed) return null

  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

  const install = async () => {
    if (!prompt || busy) return
    setBusy(true)
    setError(false)
    try {
      await prompt.prompt()
      const result = await prompt.userChoice
      setAccepted(result.outcome === 'accepted')
    } catch {
      setError(true)
    } finally {
      clearInstallPrompt()
      setBusy(false)
    }
  }

  return (
    <section className="card settings__section" aria-labelledby="settings-install">
      <h2 className="settings__heading" id="settings-install">Instalar Florecer</h2>
      <p>Abre tu diario desde la pantalla de inicio, en su propia ventana.</p>
      <p>Necesitas conexión para consultar y guardar tus registros. Lo que escribas sin guardar se pierde al cerrar o recargar la aplicación.</p>
      {prompt ? (
        <div><Button onClick={() => void install()} isLoading={busy} loadingText="Abriendo instalación…">Instalar Florecer</Button></div>
      ) : ios ? (
        <p>En Safari, abre el menú Compartir y elige "Añadir a la pantalla de inicio". Si aparece "Abrir como app web", actívalo.</p>
      ) : (
        <p>Busca "Instalar Florecer" o "Instalar aplicación" en el menú de tu navegador. Si no aparece, abre esta web en Chrome, Edge o Safari y consulta sus opciones de instalación.</p>
      )}
      {accepted && <InlineAlert tone="info">Has aceptado la instalación. Comprueba el icono en tu dispositivo.</InlineAlert>}
      {error && <InlineAlert tone="error">No se ha podido abrir la instalación. Inténtalo desde el menú del navegador.</InlineAlert>}
    </section>
  )
}
