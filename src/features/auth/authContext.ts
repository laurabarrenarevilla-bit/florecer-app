import { createContext, useContext } from 'react'
import type { AuthFailure } from './authErrors.ts'

export type AuthStatus = 'loading' | 'anonymous' | 'authenticated'

export interface AuthUser {
  id: string
  email: string | null
  /** Nombre indicado al registrarse (metadatos de la cuenta); null en cuentas antiguas. */
  name: string | null
}

export type AuthActionResult = { ok: true } | { ok: false; error: AuthFailure }
export type SignUpResult = { ok: true; sessionStarted: boolean } | { ok: false; error: AuthFailure }

export interface AuthContextValue {
  status: AuthStatus
  user: AuthUser | null
  /** La sesión terminó sin que la persona cerrara sesión (caducidad, otra pestaña). */
  sessionExpired: boolean
  /** Cuenta recién creada en esta pestaña: se muestra una confirmación en Hoy. */
  justSignedUp: boolean
  dismissWelcome: () => void
  signIn: (email: string, password: string) => Promise<AuthActionResult>
  signUp: (email: string, password: string, name: string) => Promise<SignUpResult>
  signOut: () => Promise<AuthActionResult>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>.')
  return ctx
}

/** Usuario autenticado; solo dentro de rutas protegidas. */
export function useCurrentUser(): AuthUser {
  const { user } = useAuth()
  if (!user) throw new Error('useCurrentUser requiere una sesión activa.')
  return user
}
