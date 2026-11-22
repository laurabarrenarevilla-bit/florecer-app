import { AxeBuilder } from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { hasHorizontalOverflow, login } from '../support/app.ts'
import { deleteOwnEntries } from '../support/cleanup.ts'
import { madridDate } from '../support/dates.ts'
import { REMOTE_ENABLED, REMOTE_SKIP_REASON, testAccounts } from '../support/env.ts'

/**
 * Resumen semanal con NVIDIA de verdad. Solo contra un despliegue (E2E_BASE_URL,
 * `pnpm e2e:prod`): en local no existe /api. Envía UNA entrada sintética de la
 * cuenta A y consume 1 de sus 10 resúmenes diarios. Se ejecuta bajo autorización.
 */
test.skip(!REMOTE_ENABLED, REMOTE_SKIP_REASON)
test.skip(!process.env.E2E_BASE_URL, 'Necesita la función /api desplegada (pnpm e2e:prod).')

const today = madridDate()

test.beforeEach(async () => {
  await deleteOwnEntries(testAccounts().a, [today])
})
test.afterAll(async () => {
  if (REMOTE_ENABLED) await deleteOwnEntries(testAccounts().a, [today])
})

test('resumen semanal: vista previa, cancelar no envía, confirmar devuelve un resumen validado', async ({ page }) => {
  test.setTimeout(90_000)
  const { a } = testAccounts()
  await login(page, a)
  await page.getByText('Normal', { exact: true }).click()
  await page
    .getByLabel(/qué te gustaría recordar/i)
    .fill('Texto sintético de prueba automática: día tranquilo, ordené el escritorio y salí a caminar un rato.')
  await page.getByLabel(/pequeño logro/i).fill('Salir a caminar (prueba sintética)')
  await page.getByRole('button', { name: 'Guardar mi día' }).click()
  await expect(page.getByText('Tu día se ha guardado.')).toBeVisible()

  await page.goto('/evolucion')
  await page.getByRole('link', { name: /resumen de la semana/i }).click()
  await expect(page.getByRole('heading', { name: 'Qué entradas incluir' })).toBeVisible()
  await expect(page.getByText(/día tranquilo, ordené el escritorio/)).toBeVisible()
  expect((await new AxeBuilder({ page }).analyze()).violations.map((v) => v.id)).toEqual([])
  expect(await hasHorizontalOverflow(page)).toBe(false)

  // Solo la entrada de hoy: el resto de la semana de la cuenta A se desmarca.
  for (const box of await page.getByRole('checkbox', { checked: true }).all()) {
    const item = box.locator('xpath=ancestor::li[1]')
    if (!(await item.textContent())?.includes('ordené el escritorio')) await box.uncheck()
  }

  const requests: string[] = []
  page.on('request', (r) => {
    if (r.url().includes('/api/ai/analyze')) requests.push(r.method())
  })

  await page.getByRole('button', { name: 'Enviar a NVIDIA…' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Cancelar' }).click()
  expect(requests).toEqual([])

  await page.getByRole('button', { name: 'Enviar a NVIDIA…' }).click()
  await expect(page.getByRole('alertdialog')).toContainText('Se enviarán 1 entrada')
  await page.getByRole('alertdialog').getByRole('button', { name: 'Enviar' }).click()

  const result = page.getByRole('region', { name: 'Tu resumen' })
  const failure = page.locator('.weekly-summary__option .alert')
  await expect(result.or(failure)).toBeVisible({ timeout: 60_000 })
  if (await failure.isVisible()) throw new Error(`El resumen falló: ${await failure.textContent()}`)
  await expect(result.locator('.weekly-summary__summary')).not.toBeEmpty()
  await expect(result.locator('.weekly-summary__disclaimer')).not.toBeEmpty()
  expect(requests).toEqual(['POST'])
})
