import { lazy, Suspense, type ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router'
import { ProtectedRoute } from '@/features/auth/ProtectedRoute.tsx'
import { PublicOnlyRoute } from '@/features/auth/PublicOnlyRoute.tsx'
import { NotFoundPage } from '@/pages/NotFoundPage.tsx'
import { LoadingState } from '@/shared/ui/LoadingState.tsx'
import { AuthenticatedLayout } from './AuthenticatedLayout.tsx'

// Cada pantalla se descarga al visitarla: quien entra a /login no baja el calendario.
const AuthPage = lazy(() => import('@/features/auth/AuthPage.tsx').then((m) => ({ default: m.AuthPage })))
const TodayPage = lazy(() => import('@/features/journal/TodayPage.tsx').then((m) => ({ default: m.TodayPage })))
const CalendarPage = lazy(() => import('@/features/calendar/CalendarPage.tsx').then((m) => ({ default: m.CalendarPage })))
const SettingsPage = lazy(() => import('@/features/settings/SettingsPage.tsx').then((m) => ({ default: m.SettingsPage })))

function Page({ children, fullscreen = false }: { children: ReactNode; fullscreen?: boolean }) {
  return <Suspense fallback={<LoadingState fullscreen={fullscreen} label="Cargando…" />}>{children}</Suspense>
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/hoy" replace />} />

      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<Page fullscreen><AuthPage mode="login" /></Page>} />
        <Route path="/registro" element={<Page fullscreen><AuthPage mode="signup" /></Page>} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AuthenticatedLayout />}>
          <Route path="/hoy" element={<Page><TodayPage /></Page>} />
          <Route path="/calendario" element={<Page><CalendarPage /></Page>} />
          <Route path="/ajustes" element={<Page><SettingsPage /></Page>} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
