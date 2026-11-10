import type { AuthChangeEvent, Session, SupabaseClient } from '@supabase/supabase-js'
import { getSupabase } from '@/lib/supabase/client.ts'

export interface AuthRepository {
  /** Se suscribe a cambios de sesión (incluye INITIAL_SESSION). Devuelve la baja. */
  onAuthStateChange(callback: (event: AuthChangeEvent, session: Session | null) => void): () => void
  signIn(email: string, password: string): Promise<{ error: unknown }>
  signUp(email: string, password: string, name: string): Promise<{ session: Session | null; error: unknown }>
  signOut(): Promise<{ error: unknown }>
  /** Descarta la sesión solo en este navegador (el servidor ya la rechazó). */
  expireSession(): Promise<void>
  /**
   * Elimina la cuenta con sesión y todos sus datos (función SQL
   * delete_my_account, limitada a auth.uid()) y cierra la sesión local.
   */
  deleteAccount(): Promise<{ error: unknown }>
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

    async signUp(email, password, name) {
      try {
        const { data, error } = await getClient().auth.signUp({ email, password, options: { data: { display_name: name } } })
        // Con la confirmación por correo activa, Supabase no da error si el correo
        // ya tiene cuenta (evita revelarlo) y no envía nada: devuelve un usuario sin
        // identidades. Se trata como cuenta existente para no decir "revisa tu correo".
        if (!error && data.user && data.user.identities?.length === 0) {
          return { session: null, error: { code: 'user_already_exists', message: 'User already registered' } }
        }
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

    async deleteAccount() {
      try {
        const { error } = await getClient().rpc('delete_my_account')
        if (error) return { error }
        // La cuenta ya no existe en el servidor: basta con limpiar este navegador.
        await getClient().auth.signOut({ scope: 'local' })
        return { error: null }
      } catch (error) {
        return { error }
      }
    },

    async expireSession() {
      try {
        // scope 'local': no llama al servidor; emite SIGNED_OUT en esta pestaña.
        await getClient().auth.signOut({ scope: 'local' })
      } catch {
        // Si falla, la siguiente petición volverá a avisar con AUTH_REQUIRED.
      }
    },
  }
}

export const authRepository: AuthRepository = createAuthRepository(getSupabase)
