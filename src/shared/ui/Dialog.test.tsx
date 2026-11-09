import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { Dialog } from './Dialog.tsx'

function Harness() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Abrir
      </button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Detalle">
        <p>Contenido</p>
      </Dialog>
    </>
  )
}

describe('Dialog', () => {
  it('se abre con título accesible y se cierra devolviendo el foco', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    const opener = screen.getByRole('button', { name: 'Abrir' })

    await user.click(opener)
    expect(screen.getByRole('dialog', { name: 'Detalle' })).toBeInTheDocument()
    expect(screen.getByText('Contenido')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Cerrar' }))
    expect(screen.queryByText('Contenido')).not.toBeInTheDocument()
    expect(opener).toHaveFocus()
  })
})
