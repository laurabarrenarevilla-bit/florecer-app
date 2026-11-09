import { useQueryClient } from '@tanstack/react-query'
import type { Session } from '@supabase/supabase-js'
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { AuthContext, type AuthContextValue, type AuthStatus, type AuthUser } from '@/features/auth/authContext.ts'
import { mapAuthError } from '@/features/auth/authErrors.ts'
import { authRepository as defaultRepository, type AuthRepository } from '@/features/auth/authRepository.ts'

interface AuthProviderProps {
  children: ReactNode
  repository?: AuthRepository
}

function toUser(session: Session | null): AuthUser | null {
  if (!session) return null
  return { id: session.user.id, email: session.user.email ?? null }
}

export function AuthProvider({ children, repository = defaultRepository }: AuthProviderProps) {
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [user, setUser] = useState<AuthUser | null>(null)
  const [sessionExpired, setSessionExpired] = useState(false)
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
      }
      currentUserIdRef.current = nextUser?.id ?? null

      setUser(nextUser)
      setStatus(nextUser ? 'authenticated' : 'anonymous')

      if (event === 'SIGNED_OUT') {
        setSessionExpired(!manualSignOutRef.current)
        manualSignOutRef.current = false
        setJustSignedUp(false)
      } else if (nextUser) {
        setSessionExpired(false)
      }
    })
    return unsubscribe
  }, [repository, queryClient])

  const signIn = useCallback<AuthContextValue['signIn']>(
    async (email, password) => {
      const { error } = await repository.signIn(email, password)
      if (error) return { ok: false, error: mapAuthError(error) }
      return { ok: true }
    },
    [repository],
  )

  const signUp = useCallback<AuthContextValue['signUp']>(
    async (email, password) => {
      const { session, error } = await repository.signUp(email, password)
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
    return { ok: true }
  }, [repository, queryClient])

  const dismissWelcome = useCallback(() => setJustSignedUp(false), [])

  const value = useMemo<AuthContextValue>(
    () => ({ status, user, sessionExpired, justSignedUp, dismissWelcome, signIn, signUp, signOut }),
    [status, user, sessionExpired, justSignedUp, dismissWelcome, signIn, signUp, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
