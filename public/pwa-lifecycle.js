// El worker generado importa este guard: nunca activa una actualización sobre otra ventana abierta.
self.addEventListener('message', (event) => {
  if (event.data?.type !== 'ACTIVATE_IF_SINGLE_CLIENT') return
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    const otherWindows = windows.filter((client) => client.id !== event.source?.id)
    if (otherWindows.length) {
      event.ports[0]?.postMessage('OTHER_WINDOWS')
      return
    }
    await self.skipWaiting()
    event.ports[0]?.postMessage('ACTIVATING')
  })())
})
