import type { AuthChangeEvent, Session } from '@supabase/supabase-js'
import { QueryClientProvider } from '@tanstack/react-query'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { useAuth } from '@/features/auth/authContext.ts'
import type { AuthRepository } from '@/features/auth/authRepository.ts'
import { createTestQueryClient, TEST_USER } from '@/test/fakeAuth.tsx'
import { AuthProvider } from './AuthProvider.tsx'

type Listener = (event: AuthChangeEvent, session: Session | null) => void

function fakeSession(): Session {
  return {
    access_token: 'token-de-prueba',
    refresh_token: 'refresh-de-prueba',
    expires_in: 3600,
    token_type: 'bearer',
    user: {
      id: TEST_USER.id,
      email: TEST_USER.email,
      app_metadata: {},
      user_metadata: {},
      aud: 'authenticated',
      created_at: '2026-11-09T10:00:00Z',
    },
  }
}

function createFakeRepository() {
  let listener: Listener = () => {}
  const repository: AuthRepository = {
    onAuthStateChange: vi.fn((cb: Listener) => {
      listener = cb
      return () => {}
    }),
    signIn: vi.fn(async () => ({ error: null })),
    signUp: vi.fn(async () => ({ session: fakeSession(), error: null })),
    signOut: vi.fn(async () => {
      listener('SIGNED_OUT', null)
      return { error: null }
    }),
  }
  return { repository, emit: (event: AuthChangeEvent, session: Session | null) => listener(event, session) }
}

function Probe() {
  const auth = useAuth()
  return (
    <div>
      <p>estado:{auth.status}</p>
      <p>usuario:{auth.user?.email ?? 'ninguno'}</p>
      <p>caducada:{String(auth.sessionExpired)}</p>
      <p>recién:{String(auth.justSignedUp)}</p>
      <button type="button" onClick={() => void auth.signOut()}>
        salir
      </button>
      <button type="button" onClick={() => void auth.signUp('a@b.test', 'Florecer2026')}>
        registrar
      </button>
    </div>
  )
}

function setup() {
  const fake = createFakeRepository()
  const queryClient = createTestQueryClient()
  const clearSpy = vi.spyOn(queryClient, 'clear')
  render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider repository={fake.repository}>
        <Probe />
      </AuthProvider>
    </QueryClientProvider>,
  )
  return { ...fake, clearSpy }
}

describe('AuthProvider', () => {
  it('empieza cargando y recupera la sesión persistida (INITIAL_SESSION)', () => {
    const { emit } = setup()
    expect(screen.getByText('estado:loading')).toBeInTheDocument()
    act(() => emit('INITIAL_SESSION', fakeSession()))
    expect(screen.getByText('estado:authenticated')).toBeInTheDocument()
    expect(screen.getByText(`usuario:${TEST_USER.email}`)).toBeInTheDocument()
  })

  it('sin sesión persistida queda anónimo', () => {
    const { emit } = setup()
    act(() => emit('INITIAL_SESSION', null))
    expect(screen.getByText('estado:anonymous')).toBeInTheDocument()
  })

  it('cierre de sesión voluntario: limpia la caché y no lo marca como caducada', async () => {
    const user = userEvent.setup()
    const { emit, repository, clearSpy } = setup()
    act(() => emit('INITIAL_SESSION', fakeSession()))
    clearSpy.mockClear()

    await user.click(screen.getByRole('button', { name: 'salir' }))
    expect(repository.signOut).toHaveBeenCalledTimes(1)
    expect(clearSpy).toHaveBeenCalled()
    expect(screen.getByText('estado:anonymous')).toBeInTheDocument()
    expect(screen.getByText('caducada:false')).toBeInTheDocument()
  })

  it('si la sesión termina sola, se marca como caducada', () => {
    const { emit } = setup()
    act(() => emit('INITIAL_SESSION', fakeSession()))
    act(() => emit('SIGNED_OUT', null))
    expect(screen.getByText('caducada:true')).toBeInTheDocument()
  })

  it('registro con sesión activa activa la confirmación de bienvenida', async () => {
    const user = userEvent.setup()
    const { emit } = setup()
    act(() => emit('INITIAL_SESSION', null))
    await user.click(screen.getByRole('button', { name: 'registrar' }))
    expect(screen.getByText('recién:true')).toBeInTheDocument()
  })
})
