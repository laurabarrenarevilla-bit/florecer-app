import { expect, test, type Page } from '@playwright/test'
import { login } from '../support/app.ts'
import { countOwnEntries, deleteOwnEntries } from '../support/cleanup.ts'
import { longDateEs, madridDate } from '../support/dates.ts'
import { REMOTE_ENABLED, REMOTE_SKIP_REASON, testAccounts } from '../support/env.ts'

/** F1-06..09 con la cuenta sintética A (solo su fecha de ayer). */
test.skip(!REMOTE_ENABLED, REMOTE_SKIP_REASON)
test.describe.configure({ mode: 'serial' })

const today = madridDate()
const yesterday = madridDate(-1)
const tomorrow = madridDate(1)
const dayCell = (page: Page, date: string) => page.getByRole('button', { name: new RegExp(`^${longDateEs(date)},`) })

test.beforeAll(async () => {
  if (REMOTE_ENABLED) await deleteOwnEntries(testAccounts().a, [yesterday])
})
test.afterAll(async () => {
  if (REMOTE_ENABLED) await deleteOwnEntries(testAccounts().a, [yesterday])
})

test('F1-06: crea el registro de ayer desde el calendario y persiste', async ({ page }) => {
  const { a } = testAccounts()
  await login(page, a)
  await page.goto(`/calendario?mes=${yesterday.slice(0, 7)}`)
  await dayCell(page, yesterday).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByRole('button', { name: 'Añadir registro de este día' }).click()
  await dialog.getByText('Normal', { exact: true }).click()
  await dialog.getByRole('button', { name: 'Guardar registro' }).click()
  await expect(page.getByText('Registro guardado.')).toBeVisible()
  await page.keyboard.press('Escape')

  await expect(dayCell(page, yesterday)).toHaveAccessibleName(/Normal$/)
  await page.reload()
  await expect(dayCell(page, yesterday)).toHaveAccessibleName(/Normal$/)
  expect(await countOwnEntries(a, yesterday)).toBe(1)
})

test('F1-07: mañana no ofrece ninguna acción', async ({ page }) => {
  await login(page, testAccounts().a)
  await page.goto(`/calendario?dia=${tomorrow}`)
  const dialog = page.getByRole('dialog')
  await expect(dialog.getByText(/todavía no ha llegado/)).toBeVisible()
  await expect(dialog.getByRole('button', { name: /añadir|guardar/i })).toHaveCount(0)
  if (tomorrow.slice(0, 7) === today.slice(0, 7)) {
    await page.keyboard.press('Escape')
    await expect(dayCell(page, tomorrow)).toBeDisabled()
  }
})

test('F1-08: cancelar conserva; confirmar borra de verdad', async ({ page }) => {
  const { a } = testAccounts()
  await login(page, a)
  await page.goto(`/calendario?dia=${yesterday}`)
  const dialog = page.getByRole('dialog')
  await dialog.getByRole('button', { name: 'Eliminar' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Cancelar' }).click()
  expect(await countOwnEntries(a, yesterday)).toBe(1)

  await dialog.getByRole('button', { name: 'Eliminar' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Eliminar' }).click()
  await expect(page.getByText('Registro eliminado.')).toBeVisible()
  await page.reload()
  await page.keyboard.press('Escape')
  await expect(dayCell(page, yesterday)).toHaveAccessibleName(/sin registro$/)
  expect(await countOwnEntries(a, yesterday)).toBe(0)
})

test('F1-09: cambia de mes y de año y vuelve al actual', async ({ page }) => {
  await login(page, testAccounts().a)
  await page.goto('/calendario?mes=2026-01')
  await expect(page.getByRole('heading', { level: 2 })).toHaveText(/enero de 2026/i)
  await page.getByRole('button', { name: 'Mes anterior' }).click()
  await expect(page.getByRole('heading', { level: 2 })).toHaveText(/diciembre de 2025/i)
  await page.getByRole('button', { name: 'Volver al mes actual' }).click()
  await expect(page.getByRole('button', { name: 'Mes siguiente' })).toBeDisabled()
  await expect(dayCell(page, today)).toHaveAttribute('aria-current', 'date')
})
