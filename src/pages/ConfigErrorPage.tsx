import { Brand } from '@/shared/ui/Brand.tsx'

/** Se muestra si falta la configuración pública de Supabase en el despliegue. */
export function ConfigErrorPage() {
  return (
    <main className="centered-page not-found">
      <Brand size="lg" />
      <h1 className="not-found__title">Florecer no está disponible ahora mismo</h1>
      <p className="not-found__text">
        La aplicación no tiene la configuración necesaria para conectarse. Tus registros no se han perdido; vuelve a
        intentarlo más tarde.
      </p>
    </main>
  )
}
