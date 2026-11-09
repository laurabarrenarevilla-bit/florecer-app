import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router'
import { vi } from 'vitest'
import { AuthContext, type AuthContextValue } from '@/features/auth/authContext.ts'
import { ToastProvider } from '@/shared/ui/ToastProvider.tsx'

/** Contexto de auth falso para pruebas de componentes (sin Supabase). */
export function createFakeAuth(overrides: Partial<AuthContextValue> = {}): AuthContextValue {
  return {
    status: 'anonymous',
    user: null,
    sessionExpired: false,
    justSignedUp: false,
    dismissWelcome: vi.fn(),
    signIn: vi.fn(async () => ({ ok: true as const })),
    signUp: vi.fn(async () => ({ ok: true as const, sessionStarted: true })),
    signOut: vi.fn(async () => ({ ok: true as const })),
    ...overrides,
  }
}

export const TEST_USER = { id: '550e8400-e29b-41d4-a716-446655440000', email: 'persona@ejemplo.test' }

export function createTestQueryClient(): QueryClient {
  return new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } } })
}

interface RenderOptions {
  auth?: AuthContextValue
  path?: string
  queryClient?: QueryClient
}

export function renderWithProviders(ui: ReactNode, { auth = createFakeAuth(), path = '/', queryClient }: RenderOptions = {}) {
  const client = queryClient ?? createTestQueryClient()
  const result = render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <AuthContext.Provider value={auth}>
          <ToastProvider>{ui}</ToastProvider>
        </AuthContext.Provider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
  return { ...result, auth, queryClient: client }
}
