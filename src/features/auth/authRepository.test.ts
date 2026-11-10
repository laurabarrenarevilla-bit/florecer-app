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
