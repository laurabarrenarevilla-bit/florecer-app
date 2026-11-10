import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ErrorBoundary } from './ErrorBoundary.tsx'

function Broken(): never {
  throw new Error('fallo de prueba')
}

describe('ErrorBoundary', () => {
  it('sustituye la pantalla en blanco por un mensaje con opciones para seguir', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    render(
      <ErrorBoundary>
        <Broken />
      </ErrorBoundary>,
    )
    expect(screen.getByRole('heading', { name: 'Algo no ha ido bien' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Recargar la página' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ir al inicio' })).toHaveAttribute('href', '/')
  })
})
