import { expect, test } from '@playwright/test'
import { login, logout } from '../support/app.ts'
import { deleteOwnEntries } from '../support/cleanup.ts'
import { REMOTE_ENABLED, REMOTE_SKIP_REASON, testAccounts } from '../support/env.ts'

/** F1-14 en la interfaz: B no ve el registro de A (fecha reservada para pruebas). */
test.skip(!REMOTE_ENABLED, REMOTE_SKIP_REASON)

const RESERVED_DATE = '2000-01-05'

test.afterAll(async () => {
  if (REMOTE_ENABLED) await deleteOwnEntries(testAccounts().a, [RESERVED_DATE])
})

test('F1-14: una cuenta no ve los registros de otra', async ({ page }) => {
  const { a, b } = testAccounts()
  await deleteOwnEntries(a, [RESERVED_DATE])
  await deleteOwnEntries(b, [RESERVED_DATE])

  await login(page, a)
  await page.goto(`/calendario?dia=${RESERVED_DATE}`)
  await page.getByRole('dialog').getByRole('button', { name: 'Añadir registro de este día' }).click()
  await page.getByRole('dialog').getByText('Feliz', { exact: true }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Guardar registro' }).click()
  await expect(page.getByText('Registro guardado.')).toBeVisible()
  await page.keyboard.press('Escape')
  await logout(page)

  await login(page, b)
  await page.goto(`/calendario?dia=${RESERVED_DATE}`)
  await expect(page.getByRole('dialog').getByText('No hay registro de este día.')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('button', { name: /^miércoles, 5 de enero,/ })).toHaveAccessibleName(/sin registro$/)
  await logout(page)
})
