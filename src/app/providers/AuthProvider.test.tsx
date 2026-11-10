import { QueryClientProvider } from '@tanstack/react-query'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { useAuth } from '@/features/auth/authContext.ts'
import { createQueryClient } from '@/app/queryClient.ts'
import { draftKey, hasDraft, saveDraft } from '@/features/journal/draftStore.ts'
import { AppError } from '@/shared/lib/errors.ts'
import { createTestQueryClient, TEST_USER } from '@/test/fakeAuth.tsx'
import { createFakeAuthRepository, fakeSession } from '@/test/fakeAuthRepository.ts'
import { AuthProvider } from './AuthProvider.tsx'

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
      <p>eliminada:{String(auth.accountDeleted)}</p>
      <button type="button" onClick={() => void auth.deleteAccount('Florecer2026')}>
        eliminar
      </button>
      <button type="button" onClick={() => void auth.signUp('a@b.test', 'Florecer2026', 'Persona')}>
        registrar
      </button>
    </div>
  )
}

function setup(queryClient = createTestQueryClient()) {
  const fake = createFakeAuthRepository()
  const clearSpy = vi.spyOn(queryClient, 'clear')
  render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider repository={fake.repository}>
        <Probe />
      </AuthProvider>
    </QueryClientProvider>,
  )
  return { ...fake, clearSpy, queryClient }
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

  it('cerrar sesión borra los borradores en memoria', async () => {
    const user = userEvent.setup()
    const { emit } = setup()
    act(() => emit('INITIAL_SESSION', fakeSession()))
    const key = draftKey(TEST_USER.id, '2026-11-10')
    saveDraft(key, { mood: 'happy', reflection: 'borrador', achievement: '' })

    await user.click(screen.getByRole('button', { name: 'salir' }))
    expect(hasDraft(key)).toBe(false)
  })

  it('F1-16: si el backend rechaza el token, cierra la sesión local, la marca como caducada y conserva el borrador', async () => {
    const { emit, repository, queryClient } = setup(createQueryClient())
    act(() => emit('INITIAL_SESSION', fakeSession()))
    const key = draftKey(TEST_USER.id, '2026-11-10')
    saveDraft(key, { mood: 'sad', reflection: 'borrador', achievement: '' })

    await act(() =>
      queryClient
        .fetchQuery({ queryKey: ['entries', TEST_USER.id], queryFn: () => Promise.reject(new AppError('AUTH_REQUIRED')) })
        .catch(() => undefined),
    )

    expect(repository.expireSession).toHaveBeenCalledTimes(1)
    expect(screen.getByText('estado:anonymous')).toBeInTheDocument()
    expect(screen.getByText('caducada:true')).toBeInTheDocument()
    expect(hasDraft(key)).toBe(true)
  })

  it('al entrar otra cuenta se descartan los borradores de la anterior', () => {
    const { emit } = setup()
    const otherKey = draftKey('00000000-0000-4000-8000-00000000ffff', '2026-11-10')
    saveDraft(otherKey, { mood: 'happy', reflection: 'ajeno', achievement: '' })
    act(() => emit('INITIAL_SESSION', fakeSession()))
    expect(hasDraft(otherKey)).toBe(false)
  })

  it('eliminar la cuenta exige la contraseña correcta: si falla, no borra nada', async () => {
    const user = userEvent.setup()
    const { emit, repository } = setup()
    act(() => emit('INITIAL_SESSION', fakeSession()))
    repository.signIn.mockResolvedValueOnce({ error: { code: 'invalid_credentials', message: 'Invalid login credentials' } })

    await user.click(screen.getByRole('button', { name: 'eliminar' }))
    expect(repository.signIn).toHaveBeenCalledWith(TEST_USER.email, 'Florecer2026')
    expect(repository.deleteAccount).not.toHaveBeenCalled()
    expect(screen.getByText('estado:authenticated')).toBeInTheDocument()
  })

  it('eliminar la cuenta: borra, cierra sesión sin marcarla como caducada y limpia caché y borradores', async () => {
    const user = userEvent.setup()
    const { emit, repository, clearSpy } = setup()
    act(() => emit('INITIAL_SESSION', fakeSession()))
    const key = draftKey(TEST_USER.id, '2026-11-10')
    saveDraft(key, { mood: 'happy', reflection: 'borrador', achievement: '' })
    clearSpy.mockClear()

    await user.click(screen.getByRole('button', { name: 'eliminar' }))
    expect(repository.deleteAccount).toHaveBeenCalledTimes(1)
    expect(screen.getByText('estado:anonymous')).toBeInTheDocument()
    expect(screen.getByText('eliminada:true')).toBeInTheDocument()
    expect(screen.getByText('caducada:false')).toBeInTheDocument()
    expect(clearSpy).toHaveBeenCalled()
    expect(hasDraft(key)).toBe(false)
  })
})

