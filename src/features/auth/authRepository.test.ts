import type { SupabaseClient } from '@supabase/supabase-js'
import { describe, expect, it, vi } from 'vitest'
import { mapAuthError } from './authErrors.ts'
import { createAuthRepository } from './authRepository.ts'

function clientWithSignUp(result: unknown): SupabaseClient {
  const client = { auth: { signUp: vi.fn(async () => result) } }
  return client as unknown as SupabaseClient
}

describe('authRepository.signUp', () => {
  it('con confirmación activa, un correo ya registrado (sin identidades) se trata como cuenta existente', async () => {
    const repository = createAuthRepository(() =>
      clientWithSignUp({ data: { user: { id: 'x', identities: [] }, session: null }, error: null }),
    )
    const { session, error } = await repository.signUp('persona@ejemplo.test', 'Florecer2026', 'Persona')
    expect(session).toBeNull()
    expect(mapAuthError(error).code).toBe('USER_ALREADY_EXISTS')
  })

  it('una cuenta nueva pendiente de confirmar no es un error', async () => {
    const repository = createAuthRepository(() =>
      clientWithSignUp({ data: { user: { id: 'x', identities: [{ id: 'i' }] }, session: null }, error: null }),
    )
    const { session, error } = await repository.signUp('persona@ejemplo.test', 'Florecer2026', 'Persona')
    expect(session).toBeNull()
    expect(error).toBeNull()
  })
})

describe('authRepository.deleteAccount', () => {
  function clientWith(rpcResult: unknown) {
    const signOut = vi.fn(async () => ({ error: null }))
    const rpc = vi.fn(async () => rpcResult)
    const client = { rpc, auth: { signOut } } as unknown as SupabaseClient
    return { client, rpc, signOut }
  }

  it('llama a delete_my_account y después cierra solo la sesión local', async () => {
    const { client, rpc, signOut } = clientWith({ data: null, error: null })
    const { error } = await createAuthRepository(() => client).deleteAccount()
    expect(error).toBeNull()
    expect(rpc).toHaveBeenCalledWith('delete_my_account')
    expect(signOut).toHaveBeenCalledWith({ scope: 'local' })
  })

  it('si la función no existe (migración sin aplicar) no cierra sesión y lo explica', async () => {
    const { client, signOut } = clientWith({ data: null, error: { code: 'PGRST202', message: 'Could not find the function' } })
    const { error } = await createAuthRepository(() => client).deleteAccount()
    expect(mapAuthError(error).code).toBe('ACCOUNT_DELETION_UNAVAILABLE')
    expect(signOut).not.toHaveBeenCalled()
  })
})

