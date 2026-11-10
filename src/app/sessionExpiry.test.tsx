import { QueryClientProvider } from '@tanstack/react-query'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { JournalRepositoryContext } from '@/features/journal/repositoryContext.ts'
import { todayLocal } from '@/shared/lib/dates.ts'
import { AppError } from '@/shared/lib/errors.ts'
import { ToastProvider } from '@/shared/ui/ToastProvider.tsx'
import { createFakeAuthRepository, fakeSession } from '@/test/fakeAuthRepository.ts'
import { createFakeJournalRepository } from '@/test/fakeJournalRepository.ts'
import { AuthProvider } from './providers/AuthProvider.tsx'
import { createQueryClient } from './queryClient.ts'
import { AppRoutes } from './router.tsx'

/**
 * F1-16 con la aplicación completa (rutas, AuthProvider y React Query reales;
 * Supabase sustituido por repositorios en memoria).
 */
describe('Sesión caducada mientras se escribe', () => {
  it('no anuncia un guardado falso, pide iniciar sesión y recupera el borrador al volver', async () => {
    const user = userEvent.setup()
    const auth = createFakeAuthRepository()
    const journal = createFakeJournalRepository()
    journal.repository.create.mockRejectedValueOnce(new AppError('AUTH_REQUIRED'))

    render(
      <QueryClientProvider client={createQueryClient()}>
        <MemoryRouter initialEntries={['/hoy']}>
          <AuthProvider repository={auth.repository}>
            <JournalRepositoryContext.Provider value={journal.repository}>
              <ToastProvider>
                <AppRoutes />
              </ToastProvider>
            </JournalRepositoryContext.Provider>
          </AuthProvider>
        </MemoryRouter>
      </QueryClientProvider>,
    )
    act(() => auth.emit('INITIAL_SESSION', fakeSession()))

    await user.click(await screen.findByRole('radio', { name: 'Triste' }))
    await user.type(screen.getByLabelText(/qué te gustaría recordar/i), 'borrador sin guardar')
    await user.click(screen.getByRole('button', { name: 'Guardar mi día' }))

    // El token fue rechazado: se cierra la sesión local y se pide entrar de nuevo.
    expect(await screen.findByText('Tu sesión ha terminado. Inicia sesión para continuar.')).toBeInTheDocument()
    expect(auth.repository.expireSession).toHaveBeenCalledTimes(1)
    expect(screen.queryByText('Tu día se ha guardado.')).not.toBeInTheDocument()
    expect(journal.rows.size).toBe(0)

    await user.type(screen.getByLabelText('Correo electrónico'), 'persona@ejemplo.test')
    await user.type(screen.getByLabelText('Contraseña'), 'Florecer2026')
    await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }))

    // Vuelve a Hoy con lo que había escrito.
    expect(await screen.findByText('Hemos recuperado lo que estabas escribiendo y aún no se había guardado.')).toBeInTheDocument()
    expect(screen.getByLabelText(/qué te gustaría recordar/i)).toHaveValue('borrador sin guardar')
    expect(screen.getByRole('radio', { name: 'Triste' })).toBeChecked()

    await user.click(screen.getByRole('button', { name: 'Guardar mi día' }))
    expect(await screen.findByText('Tu día se ha guardado.')).toBeInTheDocument()
    expect(journal.rows.get(todayLocal())?.reflection).toBe('borrador sin guardar')
  })
})
