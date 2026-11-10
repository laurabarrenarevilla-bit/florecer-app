import { QueryClientProvider } from '@tanstack/react-query'
import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { AuthProvider } from '@/app/providers/AuthProvider.tsx'
import { createQueryClient } from '@/app/queryClient.ts'
import { AppRoutes } from '@/app/router.tsx'
import { JournalRepositoryContext } from '@/features/journal/repositoryContext.ts'
import { ToastProvider } from '@/shared/ui/ToastProvider.tsx'
import { createFakeAuthRepository, fakeSession } from '@/test/fakeAuthRepository.ts'
import { createFakeJournalRepository } from '@/test/fakeJournalRepository.ts'

function setup() {
  const auth = createFakeAuthRepository()
  render(
    <QueryClientProvider client={createQueryClient()}>
      <MemoryRouter initialEntries={['/ajustes']}>
        <AuthProvider repository={auth.repository}>
          <JournalRepositoryContext.Provider value={createFakeJournalRepository().repository}>
            <ToastProvider>
              <AppRoutes />
            </ToastProvider>
          </JournalRepositoryContext.Provider>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
  act(() => auth.emit('INITIAL_SESSION', fakeSession()))
  return { auth, user: userEvent.setup() }
}

async function openDialog(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole('button', { name: 'Eliminar mi cuenta' }))
  return screen.findByRole('alertdialog')
}

describe('Eliminar cuenta (Ajustes)', () => {
  it('cancelar no borra nada', async () => {
    const { auth, user } = setup()
    const dialog = await openDialog(user)
    expect(dialog).toHaveTextContent('Esta acción es definitiva')
    await user.click(within(dialog).getByRole('button', { name: 'Cancelar' }))
    expect(auth.repository.deleteAccount).not.toHaveBeenCalled()
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  })

  it('sin contraseña no envía nada', async () => {
    const { auth, user } = setup()
    const dialog = await openDialog(user)
    await user.click(within(dialog).getByRole('button', { name: 'Eliminar definitivamente' }))
    expect(within(dialog).getByText('Escribe tu contraseña para confirmar.')).toBeInTheDocument()
    expect(auth.repository.signIn).not.toHaveBeenCalled()
    expect(auth.repository.deleteAccount).not.toHaveBeenCalled()
  })

  it('con contraseña incorrecta avisa y no borra', async () => {
    const { auth, user } = setup()
    auth.repository.signIn.mockResolvedValueOnce({ error: { code: 'invalid_credentials', message: 'Invalid login credentials' } })
    const dialog = await openDialog(user)
    await user.type(within(dialog).getByLabelText('Tu contraseña'), 'incorrecta')
    await user.click(within(dialog).getByRole('button', { name: 'Eliminar definitivamente' }))
    expect(await within(dialog).findByText('La contraseña no es correcta. No se ha borrado nada.')).toBeInTheDocument()
    expect(auth.repository.deleteAccount).not.toHaveBeenCalled()
  })

  it('si la función aún no existe en el servidor, lo dice y no cierra sesión', async () => {
    const { auth, user } = setup()
    auth.repository.deleteAccount.mockResolvedValueOnce({ error: { code: 'PGRST202', message: 'not found' } })
    const dialog = await openDialog(user)
    await user.type(within(dialog).getByLabelText('Tu contraseña'), 'Florecer2026')
    await user.click(within(dialog).getByRole('button', { name: 'Eliminar definitivamente' }))
    expect(await within(dialog).findByText(/no está disponible todavía/)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Ajustes' })).toBeInTheDocument()
  })

  it('con la contraseña correcta elimina la cuenta y lo confirma en /login', async () => {
    const { auth, user } = setup()
    const dialog = await openDialog(user)
    await user.type(within(dialog).getByLabelText('Tu contraseña'), 'Florecer2026')
    await user.click(within(dialog).getByRole('button', { name: 'Eliminar definitivamente' }))

    expect(await screen.findByText('Tu cuenta y todos tus registros se han eliminado.')).toBeInTheDocument()
    expect(screen.getByRole('form', { name: 'Iniciar sesión' })).toBeInTheDocument()
    expect(auth.repository.deleteAccount).toHaveBeenCalledTimes(1)
    expect(screen.queryByText('Tu sesión ha terminado. Inicia sesión para continuar.')).not.toBeInTheDocument()
  })
})
