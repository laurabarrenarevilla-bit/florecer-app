export interface InstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let pendingPrompt: InstallPromptEvent | null = null
const listeners = new Set<() => void>()
let listening = false
let installationConfirmed = false

export const installedThisSession = () => installationConfirmed

export const getInstallPrompt = () => pendingPrompt
export function subscribeInstallPrompt(listener: () => void): () => void {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}

export function clearInstallPrompt(): void {
  pendingPrompt = null
  for (const listener of listeners) listener()
}

/** Se inicia al arrancar, antes de visitar Ajustes, para no perder el evento. */
export function listenForInstall(): void {
  if (listening) return
  listening = true
  window.addEventListener('beforeinstallprompt', (event) => {
    if (!('prompt' in event) || typeof event.prompt !== 'function' || !('userChoice' in event)) return
    event.preventDefault()
    pendingPrompt = event as InstallPromptEvent
    for (const listener of listeners) listener()
  })
  window.addEventListener('appinstalled', () => {
    installationConfirmed = true
    clearInstallPrompt()
  })
}
