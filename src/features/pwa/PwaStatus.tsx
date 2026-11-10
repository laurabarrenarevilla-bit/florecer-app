import { useIsMutating, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState, useSyncExternalStore } from 'react'
import { hasUnsavedDrafts, subscribeToDrafts } from '@/features/journal/draftStore.ts'
import { Button } from '@/shared/ui/Button.tsx'
import { InlineAlert } from '@/shared/ui/InlineAlert.tsx'
import { activatePwaUpdate, hasPwaUpdate, subscribeToPwaUpdate } from './registration.ts'

export function PwaStatus() {
  const available = useSyncExternalStore(subscribeToPwaUpdate, hasPwaUpdate)
  const drafts = useSyncExternalStore(subscribeToDrafts, hasUnsavedDrafts)
  const mutations = useIsMutating()
  const queryClient = useQueryClient()
  const [online, setOnline] = useState(() => navigator.onLine)
  const [dismissed, setDismissed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const update = () => setOnline(navigator.onLine)
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
    return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update) }
  }, [])

  const applyUpdate = async () => {
    // Revalidación en el clic: también incluye operaciones de auth fuera de React Query.
    const blocked = () => hasUnsavedDrafts() || queryClient.isMutating() > 0 ||
      Array.from(document.querySelectorAll('[aria-busy="true"]')).some((element) => !element.closest('.pwa-status'))
    if (blocked()) {
      setError('Guarda o descarta tus borradores y espera a que termine la operación antes de actualizar.')
      return
    }
    setBusy(true)
    setError(null)
    const result = await activatePwaUpdate(() => !blocked())
    setError(result === 'other-windows'
      ? 'Cierra las otras ventanas de Florecer y vuelve a pulsar Actualizar.'
      : result === 'busy'
        ? 'Guarda o descarta tus borradores y espera a que termine la operación antes de actualizar.'
        : 'No se ha podido actualizar. Puedes seguir usando el diario e intentarlo más tarde.')
    setBusy(false)
  }

  if (online && (!available || dismissed)) return null

  return (
    <aside className="pwa-status" aria-label="Estado de la aplicación">
      {!online && <InlineAlert tone="info">Parece que no hay conexión. Necesitas conexión para consultar y guardar tus registros. Mantén la aplicación abierta para conservar lo que estés escribiendo.</InlineAlert>}
      {available && !dismissed && (
        <div className="pwa-status__update">
          <p role="status">Hay una nueva versión de Florecer.</p>
          {drafts && <p>Guarda o descarta tus borradores antes de actualizar.</p>}
          <div className="btn-row">
            <Button onClick={() => void applyUpdate()} disabled={drafts || mutations > 0} isLoading={busy} loadingText="Actualizando…">Actualizar</Button>
            <Button variant="ghost" onClick={() => setDismissed(true)} disabled={busy}>Más tarde</Button>
          </div>
          {error && <InlineAlert tone="error">{error}</InlineAlert>}
        </div>
      )}
    </aside>
  )
}
