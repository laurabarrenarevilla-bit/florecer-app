import { AxeBuilder } from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { hasHorizontalOverflow, login } from '../support/app.ts'
import { deleteOwnEntries } from '../support/cleanup.ts'
import { madridDate } from '../support/dates.ts'
import { REMOTE_ENABLED, REMOTE_SKIP_REASON, testAccounts } from '../support/env.ts'

test.skip(!REMOTE_ENABLED, REMOTE_SKIP_REASON)
const today = madridDate()

test.afterAll(async () => {
  if (REMOTE_ENABLED) await deleteOwnEntries(testAccounts().a, [today])
})

test('F1-16: si el backend rechaza el token, no anuncia éxito, pide entrar y recupera el borrador', async ({ page }) => {
  const { a } = testAccounts()
  await deleteOwnEntries(a, [today])
  await login(page, a)

  // Login real; la caducidad del JWT se simula respondiendo 401 a la escritura.
  await page.route('**/rest/v1/journal_entries**', async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ code: 'PGRST301', message: 'JWT expired' }) })
    } else {
      await route.continue()
    }
  })
  await page.getByText('Triste', { exact: true }).click()
  await page.getByLabel(/qué te gustaría recordar/i).fill('Borrador sintético de sesión caducada.')
  await page.getByRole('button', { name: 'Guardar mi día' }).click()

  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByText('Tu sesión ha terminado. Inicia sesión para continuar.')).toBeVisible()
  await page.unroute('**/rest/v1/journal_entries**')

  await page.getByLabel('Correo electrónico').fill(a.email)
  await page.getByLabel('Contraseña', { exact: true }).fill(a.password)
  await page.getByRole('button', { name: 'Iniciar sesión' }).click()
  await expect(page.getByText(/hemos recuperado lo que estabas escribiendo/i)).toBeVisible()
  await expect(page.getByLabel(/qué te gustaría recordar/i)).toHaveValue('Borrador sintético de sesión caducada.')
  await page.getByRole('button', { name: 'Guardar mi día' }).click()
  await expect(page.getByText('Tu día se ha guardado.')).toBeVisible()
})

test('F1-17/18: pantallas privadas sin scroll horizontal ni infracciones axe', async ({ page }) => {
  await login(page, testAccounts().a)
  for (const path of ['/hoy', '/calendario', '/ajustes']) {
    await page.goto(path)
    await page.locator('h1').first().waitFor()
    await page.getByText(/Cargando/).waitFor({ state: 'detached' }).catch(() => undefined)
    expect(await hasHorizontalOverflow(page), path).toBe(false)
    const results = await new AxeBuilder({ page }).analyze()
    expect(results.violations.map((v) => v.id), path).toEqual([])
  }
})
