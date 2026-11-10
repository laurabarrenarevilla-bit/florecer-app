import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { InstallSection } from './InstallSection.tsx'
import { clearInstallPrompt, listenForInstall } from './installPrompt.ts'

afterEach(() => { clearInstallPrompt(); vi.unstubAllGlobals() })

function offerInstall(outcome: 'accepted' | 'dismissed' = 'accepted') {
  listenForInstall()
  const event = new Event('beforeinstallprompt', { cancelable: true })
  const prompt = vi.fn().mockResolvedValue(undefined)
  Object.assign(event, { prompt, userChoice: Promise.resolve({ outcome }) })
  act(() => { window.dispatchEvent(event) })
  return { prompt, event }
}

describe('Instalación PWA', () => {
  it('recuerda la oferta antes de entrar en Ajustes y solo abre el diálogo al pulsar', async () => {
    const { prompt, event } = offerInstall()
    render(<InstallSection />)
    expect(event.defaultPrevented).toBe(true)
    expect(prompt).not.toHaveBeenCalled()
    await userEvent.click(screen.getByRole('button', { name: 'Instalar Florecer' }))
    expect(prompt).toHaveBeenCalledTimes(1)
    expect(await screen.findByText(/Has aceptado la instalación/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Instalar Florecer' })).not.toBeInTheDocument()
  })

  it('cancelar consume la oferta sin anunciar instalación ni volver a abrirla', async () => {
    const { prompt } = offerInstall('dismissed')
    render(<InstallSection />)
    await userEvent.click(screen.getByRole('button', { name: 'Instalar Florecer' }))
    expect(prompt).toHaveBeenCalledTimes(1)
    expect(screen.queryByText(/Has aceptado/)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Instalar Florecer' })).not.toBeInTheDocument()
  })

  it('ofrece alternativa si falla el diálogo nativo', async () => {
    const { prompt } = offerInstall()
    prompt.mockRejectedValueOnce(new Error('unavailable'))
    render(<InstallSection />)
    await userEvent.click(screen.getByRole('button', { name: 'Instalar Florecer' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Inténtalo desde el menú del navegador')
  })

  it('muestra instrucciones para iPhone sin inventar un botón de instalación', () => {
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue('iPhone')
    render(<InstallSection />)
    expect(screen.getByText(/En Safari/)).toHaveTextContent('Añadir a la pantalla de inicio')
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('oculta la invitación al recibir appinstalled', () => {
    render(<InstallSection />)
    act(() => { window.dispatchEvent(new Event('appinstalled')) })
    expect(screen.queryByRole('heading', { name: 'Instalar Florecer' })).not.toBeInTheDocument()
  })
})
