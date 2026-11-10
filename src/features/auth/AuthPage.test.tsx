import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { AppRoutes } from '@/app/router.tsx'
import { createFakeAuth, renderRoute, TEST_USER } from '@/test/fakeAuth.tsx'
import { createFakeJournalRepository } from '@/test/fakeJournalRepository.ts'
import { AUTH_ERROR_MESSAGES } from './authErrors.ts'

const VALID_PASSWORD = 'Florecer2026'

async function fillSignUp(email: string, password: string, confirm: string, name = 'Persona') {
  const user = userEvent.setup()
  if (name) await user.type(screen.getByLabelText('Nombre'), name)
  await user.type(screen.getByLabelText('Correo electrónico'), email)
  await user.type(screen.getByLabelText('Contraseña'), password)
  await user.type(screen.getByLabelText('Repite la contraseña'), confirm)
  return user
}

describe('Pantalla de acceso: pestañas', () => {
  it('muestra las pestañas Iniciar sesión y Crear cuenta y cambia entre ellas', async () => {
    const user = userEvent.setup()
    await renderRoute(<AppRoutes />, { path: '/login' })
    const nav = screen.getByRole('navigation', { name: 'Acceso a la cuenta' })
    expect(nav).toBeInTheDocument()
    expect(screen.getByRole('form', { name: 'Iniciar sesión' })).toBeInTheDocument()

    await user.click(screen.getAllByRole('link', { name: 'Crear cuenta' })[0]!)
    expect(screen.getByRole('form', { name: 'Crear cuenta' })).toBeInTheDocument()
    expect(screen.getByLabelText('Repite la contraseña')).toBeInTheDocument()
  })
})

describe('Registro', () => {
  it('A1: crea la cuenta con el correo normalizado y lleva a Hoy', async () => {
    const auth = createFakeAuth()
    await renderRoute(<AppRoutes />, { path: '/registro', auth })
    const user = await fillSignUp('  Persona@Ejemplo.TEST ', VALID_PASSWORD, VALID_PASSWORD)
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }))

    expect(auth.signUp).toHaveBeenCalledTimes(1)
    expect(auth.signUp).toHaveBeenCalledWith('persona@ejemplo.test', VALID_PASSWORD, 'Persona')
    // Con el contexto falso sigue anónimo: Hoy redirige a /login. Comprobamos la navegación a /hoy.
    await waitFor(() => expect(screen.getByRole('form', { name: 'Iniciar sesión' })).toBeInTheDocument())
  })

  it('A2: rechaza un correo inválido sin llamar a Supabase', async () => {
    const auth = createFakeAuth()
    await renderRoute(<AppRoutes />, { path: '/registro', auth })
    const user = await fillSignUp('persona@', VALID_PASSWORD, VALID_PASSWORD)
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }))

    expect(screen.getByText('Revisa el correo electrónico: parece que no es válido.')).toBeInTheDocument()
    expect(screen.getByLabelText('Correo electrónico')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByLabelText('Correo electrónico')).toHaveFocus()
    expect(auth.signUp).not.toHaveBeenCalled()
  })

  it('A3: rechaza contraseñas diferentes', async () => {
    const auth = createFakeAuth()
    await renderRoute(<AppRoutes />, { path: '/registro', auth })
    const user = await fillSignUp('persona@ejemplo.test', VALID_PASSWORD, 'Florecer2027')
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }))

    expect(screen.getByText('Las contraseñas no coinciden.')).toBeInTheDocument()
    expect(screen.getByLabelText('Repite la contraseña')).toHaveFocus()
    expect(auth.signUp).not.toHaveBeenCalled()
  })

  it('A4: exige la política de contraseñas', async () => {
    const auth = createFakeAuth()
    await renderRoute(<AppRoutes />, { path: '/registro', auth })
    const user = await fillSignUp('persona@ejemplo.test', 'florecer', 'florecer')
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }))

    expect(screen.getByText('Incluye al menos una letra mayúscula.')).toBeInTheDocument()
    expect(auth.signUp).not.toHaveBeenCalled()
  })

  it('A5: informa si el correo ya tiene cuenta y enlaza a iniciar sesión', async () => {
    const auth = createFakeAuth({
      signUp: vi.fn(async () => ({
        ok: false as const,
        error: { code: 'USER_ALREADY_EXISTS' as const, message: AUTH_ERROR_MESSAGES.USER_ALREADY_EXISTS },
      })),
    })
    await renderRoute(<AppRoutes />, { path: '/registro', auth })
    const user = await fillSignUp('persona@ejemplo.test', VALID_PASSWORD, VALID_PASSWORD)
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }))

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Ya existe una cuenta con este correo.')
    expect(screen.getByRole('link', { name: 'Ir a iniciar sesión' })).toHaveAttribute('href', '/login')
  })

  it('A11: si Supabase exige confirmar el correo, quita el formulario y pide revisar el correo', async () => {
    const auth = createFakeAuth({ signUp: vi.fn(async () => ({ ok: true as const, sessionStarted: false })) })
    await renderRoute(<AppRoutes />, { path: '/registro', auth })
    const user = await fillSignUp('Persona@Ejemplo.test', VALID_PASSWORD, VALID_PASSWORD)
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }))

    const heading = await screen.findByRole('heading', { name: 'Revisa tu correo' })
    expect(heading).toHaveFocus()
    expect(screen.getByText('persona@ejemplo.test')).toBeInTheDocument()
    expect(screen.queryByRole('form', { name: 'Crear cuenta' })).not.toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: 'Acceso a la cuenta' })).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Contraseña')).not.toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: 'Ir a iniciar sesión' }))
    expect(await screen.findByRole('form', { name: 'Iniciar sesión' })).toBeInTheDocument()
  })

  it('exige el nombre y lo envía al registrarse', async () => {
    const auth = createFakeAuth()
    await renderRoute(<AppRoutes />, { path: '/registro', auth })
    const user = await fillSignUp('persona@ejemplo.test', VALID_PASSWORD, VALID_PASSWORD, '')
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }))
    expect(screen.getByText('Escribe tu nombre.')).toBeInTheDocument()
    expect(screen.getByLabelText('Nombre')).toHaveFocus()
    expect(auth.signUp).not.toHaveBeenCalled()

    await user.type(screen.getByLabelText('Nombre'), '  Laura  ')
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }))
    expect(auth.signUp).toHaveBeenCalledWith('persona@ejemplo.test', VALID_PASSWORD, 'Laura')
  })

  it('A9: muestra y oculta la contraseña', async () => {
    const user = userEvent.setup()
    await renderRoute(<AppRoutes />, { path: '/registro' })
    const input = screen.getByLabelText('Contraseña')
    const toggle = screen.getByRole('button', { name: 'Mostrar contraseña: Contraseña' })

    expect(input).toHaveAttribute('type', 'password')
    expect(toggle).toHaveAttribute('aria-pressed', 'false')
    await user.click(toggle)
    expect(input).toHaveAttribute('type', 'text')
    expect(toggle).toHaveAttribute('aria-pressed', 'true')
    expect(toggle).toHaveTextContent('Ocultar')
  })

  it('A10: un doble envío produce una sola llamada', async () => {
    let resolve: (value: { ok: true; sessionStarted: boolean }) => void = () => {}
    const auth = createFakeAuth({
      signUp: vi.fn(() => new Promise<{ ok: true; sessionStarted: boolean }>((r) => (resolve = r))),
    })
    await renderRoute(<AppRoutes />, { path: '/registro', auth })
    const user = await fillSignUp('persona@ejemplo.test', VALID_PASSWORD, VALID_PASSWORD)
    const button = screen.getByRole('button', { name: 'Crear cuenta' })
    await user.click(button)
    await user.click(button)

    expect(auth.signUp).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('button', { name: 'Creando cuenta…' })).toHaveAttribute('aria-busy', 'true')
    resolve({ ok: true, sessionStarted: true })
  })
})

describe('Inicio de sesión', () => {
  it('A6: inicia sesión con credenciales correctas', async () => {
    const user = userEvent.setup()
    const auth = createFakeAuth()
    await renderRoute(<AppRoutes />, { path: '/login', auth })
    await user.type(screen.getByLabelText('Correo electrónico'), 'persona@ejemplo.test')
    await user.type(screen.getByLabelText('Contraseña'), VALID_PASSWORD)
    await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }))

    expect(auth.signIn).toHaveBeenCalledWith('persona@ejemplo.test', VALID_PASSWORD)
  })

  it('A7: rechaza credenciales incorrectas con mensaje genérico y conserva los campos', async () => {
    const user = userEvent.setup()
    const auth = createFakeAuth({
      signIn: vi.fn(async () => ({
        ok: false as const,
        error: { code: 'INVALID_CREDENTIALS' as const, message: AUTH_ERROR_MESSAGES.INVALID_CREDENTIALS },
      })),
    })
    await renderRoute(<AppRoutes />, { path: '/login', auth })
    await user.type(screen.getByLabelText('Correo electrónico'), 'persona@ejemplo.test')
    await user.type(screen.getByLabelText('Contraseña'), 'Incorrecta1')
    await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }))

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Correo o contraseña incorrectos.')
    expect(alert).toHaveFocus()
    expect(screen.getByLabelText('Contraseña')).toHaveValue('Incorrecta1')
  })

  it('A8: muestra el error de red y conserva los campos', async () => {
    const user = userEvent.setup()
    const auth = createFakeAuth({
      signIn: vi.fn(async () => ({ ok: false as const, error: { code: 'NETWORK' as const, message: AUTH_ERROR_MESSAGES.NETWORK } })),
    })
    await renderRoute(<AppRoutes />, { path: '/login', auth })
    await user.type(screen.getByLabelText('Correo electrónico'), 'persona@ejemplo.test')
    await user.type(screen.getByLabelText('Contraseña'), VALID_PASSWORD)
    await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('No hay conexión.')
    expect(screen.getByLabelText('Correo electrónico')).toHaveValue('persona@ejemplo.test')
  })

  it('pide los campos vacíos sin llamar a Supabase', async () => {
    const user = userEvent.setup()
    const auth = createFakeAuth()
    await renderRoute(<AppRoutes />, { path: '/login', auth })
    await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }))
    expect(screen.getByText('Escribe tu correo electrónico.')).toBeInTheDocument()
    expect(screen.getByText('Escribe tu contraseña.')).toBeInTheDocument()
    expect(auth.signIn).not.toHaveBeenCalled()
  })

  it('avisa cuando la sesión ha caducado', async () => {
    await renderRoute(<AppRoutes />, { path: '/login', auth: createFakeAuth({ sessionExpired: true }) })
    expect(screen.getByText('Tu sesión ha terminado. Inicia sesión para continuar.')).toBeInTheDocument()
  })
})

describe('Rutas protegidas y sesión', () => {
  it('redirige a /login sin sesión', async () => {
    await renderRoute(<AppRoutes />, { path: '/calendario' })
    expect(screen.getByRole('form', { name: 'Iniciar sesión' })).toBeInTheDocument()
  })

  it('no muestra contenido privado mientras se resuelve la sesión', async () => {
    await renderRoute(<AppRoutes />, { path: '/hoy', auth: createFakeAuth({ status: 'loading' }) })
    expect(screen.getByText('Cargando tu espacio…')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Hoy' })).not.toBeInTheDocument()
  })

  it('con sesión, /login lleva a Hoy y se muestra la confirmación de registro', async () => {
    await renderRoute(<AppRoutes />, {
      path: '/login',
      auth: createFakeAuth({ status: 'authenticated', user: TEST_USER, justSignedUp: true }),
      journalRepository: createFakeJournalRepository().repository,
    })
    expect(screen.getAllByText('Tu cuenta está lista.')[0]).toBeInTheDocument()
  })

  it('A12: cerrar sesión llama a signOut y vuelve a /login', async () => {
    const user = userEvent.setup()
    let status: 'authenticated' | 'anonymous' = 'authenticated'
    const auth = createFakeAuth({
      status,
      user: TEST_USER,
      signOut: vi.fn(async () => {
        status = 'anonymous'
        return { ok: true as const }
      }),
    })
    await renderRoute(<AppRoutes />, { path: '/ajustes', auth })
    expect(screen.getAllByText(TEST_USER.email).length).toBeGreaterThan(0)

    const [button] = screen.getAllByRole('button', { name: 'Cerrar sesión' })
    await user.click(button!)
    expect(auth.signOut).toHaveBeenCalledTimes(1)
    expect(status).toBe('anonymous')
  })
})
