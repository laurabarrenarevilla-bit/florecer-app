import { Navigate, Route, Routes } from 'react-router'
import { AuthPage } from '@/features/auth/AuthPage.tsx'
import { ProtectedRoute } from '@/features/auth/ProtectedRoute.tsx'
import { PublicOnlyRoute } from '@/features/auth/PublicOnlyRoute.tsx'
import { WelcomeNotice } from '@/features/auth/WelcomeNotice.tsx'
import { SettingsPage } from '@/features/settings/SettingsPage.tsx'
import { NotFoundPage } from '@/pages/NotFoundPage.tsx'
import { PageHeading } from '@/shared/ui/PageHeading.tsx'
import { AuthenticatedLayout } from './AuthenticatedLayout.tsx'

// Páginas provisionales; se sustituyen en los bloques 4 y 5.
function Placeholder({ title }: { title: string }) {
  return (
    <section className="page">
      <PageHeading title={title} />
      <WelcomeNotice />
    </section>
  )
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/hoy" replace />} />

      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/registro" element={<AuthPage mode="signup" />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AuthenticatedLayout />}>
          <Route path="/hoy" element={<Placeholder title="Hoy" />} />
          <Route path="/calendario" element={<Placeholder title="Calendario emocional" />} />
          <Route path="/ajustes" element={<SettingsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
