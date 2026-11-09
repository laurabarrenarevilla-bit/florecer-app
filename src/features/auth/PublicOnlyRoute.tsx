import { Navigate, Outlet, useLocation } from 'react-router'
import { LoadingState } from '@/shared/ui/LoadingState.tsx'
import { useAuth } from './authContext.ts'
import { safeRedirectPath } from './redirect.ts'

/** Acceso y registro: con sesión activa se va directamente a la app. */
export function PublicOnlyRoute() {
  const { status } = useAuth()
  const location = useLocation()

  if (status === 'loading') return <LoadingState fullscreen />
  if (status === 'authenticated') return <Navigate to={safeRedirectPath(location.state)} replace />
  return <Outlet />
}
