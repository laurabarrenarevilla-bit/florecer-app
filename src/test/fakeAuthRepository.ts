import type { AuthChangeEvent, Session } from '@supabase/supabase-js'
import { vi } from 'vitest'
import type { AuthRepository } from '@/features/auth/authRepository.ts'
import { TEST_USER } from './fakeAuth.tsx'

type Listener = (event: AuthChangeEvent, session: Session | null) => void

/** Sesión sintética: los tokens son cadenas de relleno, no JWT reales. */
export function fakeSession(): Session {
  return {
    access_token: 'token-de-prueba',
    refresh_token: 'refresh-de-prueba',
    expires_in: 3600,
    token_type: 'bearer',
    user: {
      id: TEST_USER.id,
      email: TEST_USER.email,
      app_metadata: {},
      user_metadata: { display_name: TEST_USER.name },
      aud: 'authenticated',
      created_at: '2026-11-09T10:00:00Z',
    },
  }
}

/** Repositorio de auth en memoria que emite los mismos eventos que supabase-js. */
export function createFakeAuthRepository() {
  let listener: Listener = () => {}
  const repository = {
    onAuthStateChange: vi.fn<AuthRepository['onAuthStateChange']>((cb) => {
      listener = cb
      return () => {}
    }),
    signIn: vi.fn<AuthRepository['signIn']>(async () => {
      listener('SIGNED_IN', fakeSession())
      return { error: null }
    }),
    signUp: vi.fn<AuthRepository['signUp']>(async () => ({ session: fakeSession(), error: null })),
    signOut: vi.fn<AuthRepository['signOut']>(async () => {
      listener('SIGNED_OUT', null)
      // Como supabase-js: la interfaz reacciona al evento antes de que la promesa termine.
      await new Promise((resolve) => setTimeout(resolve, 0))
      return { error: null }
    }),
    deleteAccount: vi.fn<AuthRepository['deleteAccount']>(async () => {
      listener('SIGNED_OUT', null)
      return { error: null }
    }),
    expireSession: vi.fn<AuthRepository['expireSession']>(async () => {
      listener('SIGNED_OUT', null)
    }),
  } satisfies AuthRepository
  return { repository, emit: (event: AuthChangeEvent, session: Session | null) => listener(event, session) }
}
