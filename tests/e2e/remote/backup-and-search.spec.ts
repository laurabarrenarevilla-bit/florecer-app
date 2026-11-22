import { readFile } from 'node:fs/promises'
import { AxeBuilder } from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { hasHorizontalOverflow, login } from '../support/app.ts'
import { countOwnEntries, deleteOwnEntries } from '../support/cleanup.ts'
import { REMOTE_ENABLED, REMOTE_SKIP_REASON, testAccounts } from '../support/env.ts'

/**
 * Copia de seguridad (docs/12) y búsqueda con la cuenta sintética A, en
 * fechas reservadas del año 2000 que se borran antes y después.
 */
test.skip(!REMOTE_ENABLED, REMOTE_SKIP_REASON)
test.describe.configure({ mode: 'serial' })

const DATES = ['2000-01-05', '2000-01-06']
const MARK = 'marcasintetica'

test.beforeAll(async () => {
  if (REMOTE_ENABLED) await deleteOwnEntries(testAccounts().a, DATES)
})
test.afterAll(async () => {
  if (REMOTE_ENABLED) await deleteOwnEntries(testAccounts().a, DATES)
})

const file = (entries: unknown[]) => ({
  name: 'florecer-backup-prueba.json',
  mimeType: 'application/json',
  buffer: Buffer.from(JSON.stringify({ format: 'florecer-journal', schemaVersion: 1, entries })),
})

test('importar, buscar, exportar y reimportar sin duplicar', async ({ page }) => {
  const { a } = testAccounts()
  await login(page, a)
  const backup = file([
    { date: DATES[0], mood: 'happy', emotions: ['love'], reflection: `Texto ${MARK} uno.`, achievement: '' },
    { date: DATES[1], mood: 'sad', reflection: `Texto ${MARK} dos.`, achievement: 'Logro sintético' },
  ])

  await page.goto('/ajustes')
  await page.getByLabel('Archivo de copia de Florecer').setInputFiles(backup)
  const preview = page.getByRole('region', { name: 'Vista previa de la importación' })
  await expect(preview).toContainText('2 entradas nuevas se añadirán')
  expect((await new AxeBuilder({ page }).analyze()).violations.map((v) => v.id)).toEqual([])
  await preview.getByRole('button', { name: 'Importar 2 entradas' }).click()
  await expect(page.getByText(/Importación completada: 2 entradas añadidas/)).toBeVisible()
  expect(await countOwnEntries(a, DATES[0]!)).toBe(1)
  expect(await countOwnEntries(a, DATES[1]!)).toBe(1)

  // Búsqueda sin tildes ni mayúsculas.
  await page.goto(`/buscar?q=${MARK.toUpperCase()}`)
  await expect(page.getByText('2 días coinciden')).toBeVisible()
  expect(await hasHorizontalOverflow(page)).toBe(false)
  expect((await new AxeBuilder({ page }).analyze()).violations.map((v) => v.id)).toEqual([])

  // Exportar: el archivo descargado contiene lo importado, sin datos de la cuenta.
  await page.goto('/ajustes')
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Descargar copia' }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toMatch(/^florecer-backup-\d{4}-\d{2}-\d{2}\.json$/)
  const text = await readFile((await download.path())!, 'utf8')
  const exported = JSON.parse(text) as { entries: { date: string; reflection: string }[] }
  expect(exported.entries.filter((e) => DATES.includes(e.date)).map((e) => e.reflection)).toEqual([
    `Texto ${MARK} uno.`,
    `Texto ${MARK} dos.`,
  ])
  expect(text).not.toContain(a.email)
  expect(text).not.toMatch(/user_?id|access_token/i)

  // Reimportar el mismo archivo: todo se omite y no hay duplicados.
  await page.getByLabel('Archivo de copia de Florecer').setInputFiles(backup)
  await expect(page.getByRole('region', { name: 'Vista previa de la importación' })).toContainText('2 se omitirán')
  await expect(page.getByRole('button', { name: 'Nada que importar' })).toBeDisabled()
  expect(await countOwnEntries(a, DATES[0]!)).toBe(1)
})
