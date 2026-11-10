let registration: ServiceWorkerRegistration | undefined
let waiting: ServiceWorker | null = null
let reloadPending = false
let started = false
const listeners = new Set<() => void>()

export const hasPwaUpdate = () => waiting !== null || reloadPending
export function subscribeToPwaUpdate(listener: () => void): () => void {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}

function detectUpdate() {
  waiting = registration?.waiting ?? null
  for (const listener of listeners) listener()
}

export async function startPwa(): Promise<void> {
  if (started || !import.meta.env.PROD || !('serviceWorker' in navigator)) return
  started = true
  try {
    registration = await navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' })
    detectUpdate()
    registration.addEventListener('updatefound', () => {
      registration?.installing?.addEventListener('statechange', detectUpdate)
    })
    // Volver del segundo plano comprueba actualizaciones sin recargar formularios.
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && navigator.onLine) {
        void registration?.update().catch(() => { /* Se reintentará al volver a abrir. */ })
      }
    })
  } catch {
    // La instalación es secundaria: un fallo del worker no bloquea el diario.
    started = false
  }
}

/** Solo recarga esta ventana tras activación confirmada; nunca recarga otras pestañas. */
export async function activatePwaUpdate(canReload: () => boolean): Promise<'other-windows' | 'unavailable' | 'busy'> {
  if (reloadPending) {
    if (canReload()) window.location.reload()
    return 'busy'
  }
  const worker = registration?.waiting
  if (!worker) return 'unavailable'
  return new Promise((resolve) => {
    const channel = new MessageChannel()
    const cleanup = () => {
      window.clearTimeout(timeout)
      worker.removeEventListener('statechange', activated)
      channel.port1.close()
    }
    const activated = () => {
      if (worker.state === 'activated') {
        cleanup()
        reloadPending = true
        // Una persona puede haber vuelto a escribir durante la activación.
        if (canReload()) window.location.reload()
        else resolve('busy')
      }
    }
    const timeout = window.setTimeout(() => { cleanup(); resolve('unavailable') }, 15_000)
    worker.addEventListener('statechange', activated)
    channel.port1.onmessage = (event: MessageEvent<unknown>) => {
      if (event.data === 'OTHER_WINDOWS') {
        cleanup()
        resolve('other-windows')
      }
    }
    try {
      worker.postMessage({ type: 'ACTIVATE_IF_SINGLE_CLIENT' }, [channel.port2])
    } catch {
      cleanup()
      resolve('unavailable')
    }
  })
}
