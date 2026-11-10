import { expect, test } from '@playwright/test'
import { login, logout } from '../support/app.ts'
import { REMOTE_ENABLED, REMOTE_SKIP_REASON, testAccounts } from '../support/env.ts'

test.skip(!REMOTE_ENABLED, REMOTE_SKIP_REASON)

test.describe('Auth real contra Supabase', () => {
  test('inicia sesión, la sesión persiste al recargar y se cierra', async ({ page }) => {
    const { a } = testAccounts()
    await login(page, a)
    await page.reload()
    await expect(page).toHaveURL(/\/hoy$/)
    await expect(page.getByRole('radio', { name: 'Feliz' }).or(page.getByRole('article', { name: 'Tu registro de hoy' }))).toBeVisible()
    await logout(page)
    await page.goto('/hoy')
    await expect(page).toHaveURL(/\/login$/)
  })

  test('rechaza una contraseña incorrecta con un mensaje genérico', async ({ page }) => {
    const { a } = testAccounts()
    await page.goto('/login')
    await page.getByLabel('Correo electrónico').fill(a.email)
    await page.getByLabel('Contraseña', { exact: true }).fill(`${a.password}-incorrecta`)
    await page.getByRole('button', { name: 'Iniciar sesión' }).click()
    await expect(page.getByText('Correo o contraseña incorrectos.')).toBeVisible()
    await expect(page).toHaveURL(/\/login$/)
  })

  test('registrar un correo ya existente no crea otra cuenta y ofrece iniciar sesión', async ({ page }) => {
    const { a } = testAccounts()
    await page.goto('/registro')
    await page.getByLabel('Nombre').fill('Prueba A')
    await page.getByLabel('Correo electrónico').fill(a.email)
    await page.getByLabel('Contraseña', { exact: true }).fill(a.password)
    await page.getByLabel('Repite la contraseña', { exact: true }).fill(a.password)
    await page.getByRole('button', { name: 'Crear cuenta' }).click()
    await expect(page.getByText(/ya existe una cuenta con este correo/i)).toBeVisible()
  })
})
