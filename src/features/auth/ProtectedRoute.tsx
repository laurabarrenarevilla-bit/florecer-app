import { Navigate, Outlet, useLocation } from 'react-router'
import { LoadingState } from '@/shared/ui/LoadingState.tsx'
import { useAuth } from './authContext.ts'

/** Nunca muestra contenido privado antes de resolver la sesión. */
export function ProtectedRoute() {
  const { status, signedOutManually } = useAuth()
  const location = useLocation()

  if (status === 'loading') return <LoadingState fullscreen label="Cargando tu espacio…" />
  if (status === 'anonymous') {
    // Solo se recuerda la ruta en enlaces directos o sesiones caducadas: tras
    // cerrar sesión a mano, quien entre después debe empezar en Hoy.
    if (signedOutManually) return <Navigate to="/login" replace />
    return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />
  }
  return <Outlet />
}
