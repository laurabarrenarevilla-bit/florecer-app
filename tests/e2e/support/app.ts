import { expect, type Page } from '@playwright/test'
import type { TestAccount } from './env.ts'

export async function login(page: Page, account: TestAccount): Promise<void> {
  await page.goto('/login')
  await page.getByLabel('Correo electrónico').fill(account.email)
  await page.getByLabel('Contraseña', { exact: true }).fill(account.password)
  await page.getByRole('button', { name: 'Iniciar sesión' }).click()
  await expect(page).toHaveURL(/\/hoy$/)
}

export async function logout(page: Page): Promise<void> {
  await page.goto('/ajustes')
  await page.getByRole('main').getByRole('button', { name: 'Cerrar sesión' }).click()
  await expect(page).toHaveURL(/\/login$/)
}

export async function hasHorizontalOverflow(page: Page): Promise<boolean> {
  return page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
}

/**
 * Bloquea toda petición fuera de localhost y la registra. Las pruebas locales
 * comprueban así que no contactan con Supabase ni con ningún otro servicio.
 */
export async function blockExternalRequests(page: Page): Promise<string[]> {
  const blocked: string[] = []
  await page.route(
    (url) => url.hostname !== 'localhost' && url.hostname !== '127.0.0.1',
    async (route) => {
      blocked.push(new URL(route.request().url()).host)
      await route.abort()
    },
  )
  return blocked
}
