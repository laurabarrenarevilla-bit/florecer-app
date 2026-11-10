import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router'
import { describe, expect, it } from 'vitest'
import { AuthContext } from './authContext.ts'
import { ProtectedRoute } from './ProtectedRoute.tsx'
import { createFakeAuth } from '@/test/fakeAuth.tsx'

function LoginProbe() {
  const location = useLocation()
  return <p>origen:{JSON.stringify(location.state ?? null)}</p>
}

function renderAt(path: string, signedOutManually: boolean) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <AuthContext.Provider value={createFakeAuth({ status: 'anonymous', signedOutManually })}>
        <Routes>
          <Route path="/login" element={<LoginProbe />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/ajustes" element={<p>privado</p>} />
          </Route>
        </Routes>
      </AuthContext.Provider>
    </MemoryRouter>,
  )
}

describe('ProtectedRoute', () => {
  it('en un enlace directo sin sesión recuerda la ruta para volver tras entrar', () => {
    renderAt('/ajustes', false)
    expect(screen.getByText('origen:{"from":"/ajustes"}')).toBeInTheDocument()
  })

  it('tras cerrar sesión a mano no recuerda la ruta: quien entre después empieza en Hoy', () => {
    renderAt('/ajustes', true)
    expect(screen.getByText('origen:null')).toBeInTheDocument()
    expect(screen.queryByText('privado')).not.toBeInTheDocument()
  })
})
