import { Navigate, Route, Routes } from 'react-router'
import { AuthPage } from '@/features/auth/AuthPage.tsx'
import { ProtectedRoute } from '@/features/auth/ProtectedRoute.tsx'
import { PublicOnlyRoute } from '@/features/auth/PublicOnlyRoute.tsx'
import { CalendarPage } from '@/features/calendar/CalendarPage.tsx'
import { TodayPage } from '@/features/journal/TodayPage.tsx'
import { SettingsPage } from '@/features/settings/SettingsPage.tsx'
import { NotFoundPage } from '@/pages/NotFoundPage.tsx'
import { AuthenticatedLayout } from './AuthenticatedLayout.tsx'

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
          <Route path="/hoy" element={<TodayPage />} />
          <Route path="/calendario" element={<CalendarPage />} />
          <Route path="/ajustes" element={<SettingsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
