import { useQueryClient } from '@tanstack/react-query'
import type { Session } from '@supabase/supabase-js'
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { AuthContext, type AuthContextValue, type AuthStatus, type AuthUser } from '@/features/auth/authContext.ts'
import { mapAuthError } from '@/features/auth/authErrors.ts'
import { authRepository as defaultRepository, type AuthRepository } from '@/features/auth/authRepository.ts'
import { clearAllDrafts, clearDraftsExcept } from '@/features/journal/draftStore.ts'
import { subscribeToAuthRequired } from '../queryClient.ts'

interface AuthProviderProps {
  children: ReactNode
  repository?: AuthRepository
}

function displayName(session: Session): string | null {
  const value: unknown = session.user.user_metadata['display_name']
  return typeof value === 'string' && value.trim() ? value.trim().slice(0, 50) : null
}

function toUser(session: Session | null): AuthUser | null {
  if (!session) return null
  return { id: session.user.id, email: session.user.email ?? null, name: displayName(session) }
}

export function AuthProvider({ children, repository = defaultRepository }: AuthProviderProps) {
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [user, setUser] = useState<AuthUser | null>(null)
  const [sessionExpired, setSessionExpired] = useState(false)
  const [signedOutManually, setSignedOutManually] = useState(false)
  const [justSignedUp, setJustSignedUp] = useState(false)
  const manualSignOutRef = useRef(false)
  const currentUserIdRef = useRef<string | null>(null)

  useEffect(() => {
    // INITIAL_SESSION resuelve el estado al arrancar (sesión persistida).
    const unsubscribe = repository.onAuthStateChange((event, session) => {
      const nextUser = toUser(session)

      // Al cambiar de cuenta o cerrar sesión no debe quedar nada en caché.
      if (currentUserIdRef.current !== (nextUser?.id ?? null)) {
        queryClient.clear()
        // Los borradores en memoria nunca pasan de una cuenta a otra.
        if (nextUser) clearDraftsExcept(nextUser.id)
      }
      currentUserIdRef.current = nextUser?.id ?? null

      setUser(nextUser)
      setStatus(nextUser ? 'authenticated' : 'anonymous')

      if (event === 'SIGNED_OUT') {
        setSessionExpired(!manualSignOutRef.current)
        setSignedOutManually(manualSignOutRef.current)
        manualSignOutRef.current = false
        setJustSignedUp(false)
      } else if (nextUser) {
        setSessionExpired(false)
        setSignedOutManually(false)
      }
    })
    return unsubscribe
  }, [repository, queryClient])

  // El backend rechazó el token (caducado o revocado): se cierra la sesión
  // local, lo que emite SIGNED_OUT y marca la sesión como caducada. Los
  // borradores en memoria se conservan para recuperarlos al volver a entrar.
  useEffect(
    () =>
      subscribeToAuthRequired(() => {
        if (currentUserIdRef.current) void repository.expireSession()
      }),
    [repository],
  )

  const signIn = useCallback<AuthContextValue['signIn']>(
    async (email, password) => {
      const { error } = await repository.signIn(email, password)
      if (error) return { ok: false, error: mapAuthError(error) }
      return { ok: true }
    },
    [repository],
  )

  const signUp = useCallback<AuthContextValue['signUp']>(
    async (email, password, name) => {
      const { session, error } = await repository.signUp(email, password, name)
      if (error) return { ok: false, error: mapAuthError(error) }
      if (session) setJustSignedUp(true)
      return { ok: true, sessionStarted: session !== null }
    },
    [repository],
  )

  const signOut = useCallback<AuthContextValue['signOut']>(async () => {
    manualSignOutRef.current = true
    const { error } = await repository.signOut()
    if (error) {
      manualSignOutRef.current = false
      return { ok: false, error: mapAuthError(error) }
    }
    queryClient.clear()
    clearAllDrafts()
    return { ok: true }
  }, [repository, queryClient])

  const dismissWelcome = useCallback(() => setJustSignedUp(false), [])

  const value = useMemo<AuthContextValue>(
    () => ({ status, user, sessionExpired, signedOutManually, justSignedUp, dismissWelcome, signIn, signUp, signOut }),
    [status, user, sessionExpired, signedOutManually, justSignedUp, dismissWelcome, signIn, signUp, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
