import type { AuthChangeEvent, Session, SupabaseClient } from '@supabase/supabase-js'
import { getSupabase } from '@/lib/supabase/client.ts'

export interface AuthRepository {
  /** Se suscribe a cambios de sesión (incluye INITIAL_SESSION). Devuelve la baja. */
  onAuthStateChange(callback: (event: AuthChangeEvent, session: Session | null) => void): () => void
  signIn(email: string, password: string): Promise<{ error: unknown }>
  signUp(email: string, password: string): Promise<{ session: Session | null; error: unknown }>
  signOut(): Promise<{ error: unknown }>
}

/** Único punto con llamadas a supabase.auth. */
export function createAuthRepository(getClient: () => SupabaseClient): AuthRepository {
  return {
    onAuthStateChange(callback) {
      const { data } = getClient().auth.onAuthStateChange(callback)
      return () => data.subscription.unsubscribe()
    },

    async signIn(email, password) {
      try {
        const { error } = await getClient().auth.signInWithPassword({ email, password })
        return { error }
      } catch (error) {
        return { error }
      }
    },

    async signUp(email, password) {
      try {
        const { data, error } = await getClient().auth.signUp({ email, password })
        return { session: data.session, error }
      } catch (error) {
        return { session: null, error }
      }
    },

    async signOut() {
      try {
        const { error } = await getClient().auth.signOut()
        return { error }
      } catch (error) {
        return { error }
      }
    },
  }
}

export const authRepository: AuthRepository = createAuthRepository(getSupabase)
