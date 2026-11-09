import { Navigate, Route, Routes } from 'react-router'
import { NotFoundPage } from '@/pages/NotFoundPage.tsx'
import { AppShell } from '@/shared/ui/layout/AppShell.tsx'
import { PageHeading } from '@/shared/ui/PageHeading.tsx'

// Páginas provisionales del bloque 2; se sustituyen en los bloques 3–5.
function Placeholder({ title }: { title: string }) {
  return (
    <section className="page">
      <PageHeading title={title} />
    </section>
  )
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/hoy" replace />} />
      <Route element={<AppShell />}>
        <Route path="/hoy" element={<Placeholder title="Hoy" />} />
        <Route path="/calendario" element={<Placeholder title="Calendario emocional" />} />
        <Route path="/ajustes" element={<Placeholder title="Ajustes" />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
