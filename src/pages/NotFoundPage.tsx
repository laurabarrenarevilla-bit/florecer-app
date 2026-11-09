import { Link } from 'react-router'
import { Brand } from '@/shared/ui/Brand.tsx'
import { useDocumentTitle } from '@/shared/lib/useDocumentTitle.ts'

export function NotFoundPage() {
  useDocumentTitle('Página no encontrada')

  return (
    <main className="centered-page not-found">
      <Brand size="lg" />
      <h1 className="not-found__title">No hemos encontrado esta página</h1>
      <p className="not-found__text">Puede que el enlace haya cambiado o ya no exista.</p>
      <Link className="btn btn--primary" to="/">
        Volver al inicio
      </Link>
    </main>
  )
}
