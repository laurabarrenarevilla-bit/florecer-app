import { Navigate, Outlet, useLocation } from 'react-router'
import { LoadingState } from '@/shared/ui/LoadingState.tsx'
import { useAuth } from './authContext.ts'

/** Nunca muestra contenido privado antes de resolver la sesión. */
export function ProtectedRoute() {
  const { status } = useAuth()
  const location = useLocation()

  if (status === 'loading') return <LoadingState fullscreen label="Cargando tu espacio…" />
  if (status === 'anonymous') {
    return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />
  }
  return <Outlet />
}
