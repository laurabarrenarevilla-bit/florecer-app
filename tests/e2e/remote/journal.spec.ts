import { expect, test } from '@playwright/test'
import { login } from '../support/app.ts'
import { countOwnEntries, deleteOwnEntries } from '../support/cleanup.ts'
import { madridDate } from '../support/dates.ts'
import { REMOTE_ENABLED, REMOTE_SKIP_REASON, testAccounts } from '../support/env.ts'

/** F1-01..05, 12 y 13 con la cuenta sintética A (solo su fecha de hoy). */
test.skip(!REMOTE_ENABLED, REMOTE_SKIP_REASON)
test.describe.configure({ mode: 'serial' })

const today = madridDate()

test.beforeEach(async () => {
  await deleteOwnEntries(testAccounts().a, [today])
})
test.afterAll(async () => {
  if (REMOTE_ENABLED) await deleteOwnEntries(testAccounts().a, [today])
})

test('F1-01: sin emoción no se puede guardar', async ({ page }) => {
  await login(page, testAccounts().a)
  await expect(page.getByRole('button', { name: 'Guardar mi día' })).toBeDisabled()
})

test('F1-02/03/04: guarda solo con la emoción y se recupera tras recargar y en otra sesión', async ({ page, browser }) => {
  const { a } = testAccounts()
  await login(page, a)
  await page.getByText('Feliz', { exact: true }).click()
  await page.getByRole('button', { name: 'Guardar mi día' }).click()
  await expect(page.getByText('Tu día se ha guardado.')).toBeVisible()
  await expect(page.getByRole('article', { name: 'Tu registro de hoy' })).toContainText('Feliz')
  expect(await countOwnEntries(a, today)).toBe(1)

  await page.reload()
  await expect(page.getByRole('article', { name: 'Tu registro de hoy' })).toContainText('Feliz')

  // "Cerrar el navegador": contexto nuevo, sin estado previo.
  const fresh = await browser.newContext({ viewport: { width: 360, height: 740 }, locale: 'es-ES', timezoneId: 'Europe/Madrid' })
  const other = await fresh.newPage()
  await login(other, a)
  await expect(other.getByRole('article', { name: 'Tu registro de hoy' })).toContainText('Feliz')
  await fresh.close()
})

test('F1-05: editar no duplica y el cambio sobrevive a la recarga', async ({ page }) => {
  const { a } = testAccounts()
  await login(page, a)
  await page.getByText('Normal', { exact: true }).click()
  await page.getByLabel(/qué te gustaría recordar/i).fill('Texto sintético E2E.')
  await page.getByRole('button', { name: 'Guardar mi día' }).click()
  await expect(page.getByText('Tu día se ha guardado.')).toBeVisible()

  await page.getByRole('button', { name: 'Editar' }).click()
  await page.getByText('Triste', { exact: true }).click()
  await page.getByRole('button', { name: 'Guardar cambios' }).click()
  await expect(page.getByRole('article', { name: 'Tu registro de hoy' })).toContainText('Triste')

  await page.reload()
  await expect(page.getByRole('article', { name: 'Tu registro de hoy' })).toContainText('Triste')
  await expect(page.getByRole('article', { name: 'Tu registro de hoy' })).toContainText('Texto sintético E2E.')
  expect(await countOwnEntries(a, today)).toBe(1)
})

test('F1-12: doble clic en guardar crea una sola fila', async ({ page }) => {
  const { a } = testAccounts()
  await login(page, a)
  await page.getByText('Feliz', { exact: true }).click()
  await page.getByRole('button', { name: 'Guardar mi día' }).dblclick()
  await expect(page.getByText('Tu día se ha guardado.')).toBeVisible()
  expect(await countOwnEntries(a, today)).toBe(1)
})

test('F1-13: sin red avisa, conserva el borrador y guarda al reintentar', async ({ page, context }) => {
  const { a } = testAccounts()
  await login(page, a)
  await page.getByText('Triste', { exact: true }).click()
  await page.getByLabel(/qué te gustaría recordar/i).fill('Borrador sintético sin red.')

  await context.setOffline(true)
  await page.getByRole('button', { name: 'Guardar mi día' }).click()
  await expect(page.getByRole('alert')).toContainText('No hay conexión')
  await expect(page.getByLabel(/qué te gustaría recordar/i)).toHaveValue('Borrador sintético sin red.')
  await expect(page.getByText('Tu día se ha guardado.')).toHaveCount(0)

  await context.setOffline(false)
  await page.getByRole('button', { name: 'Guardar mi día' }).click()
  await expect(page.getByText('Tu día se ha guardado.')).toBeVisible()
  expect(await countOwnEntries(a, today)).toBe(1)
})
