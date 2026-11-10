import { expect, test } from '@playwright/test'
import { login } from '../support/app.ts'
import { deletionTestAccount, REMOTE_ENABLED, REMOTE_SKIP_REASON } from '../support/env.ts'

/**
 * Eliminación real de cuenta con la cuenta sintética C: se registra por la UI,
 * guarda un registro y se elimina. Al terminar no queda ni la cuenta ni sus datos.
 */
test.skip(!REMOTE_ENABLED, REMOTE_SKIP_REASON)

test('eliminar la cuenta borra la cuenta y sus registros, y ya no se puede entrar', async ({ page }) => {
  test.setTimeout(90_000)
  const c = deletionTestAccount()

  // Alta por el registro público; si quedó de una ejecución fallida, se entra con ella.
  await page.goto('/registro')
  await page.getByLabel('Nombre').fill('Prueba C')
  await page.getByLabel('Correo electrónico').fill(c.email)
  await page.getByLabel('Contraseña', { exact: true }).fill(c.password)
  await page.getByLabel('Repite la contraseña', { exact: true }).fill(c.password)
  await page.getByRole('button', { name: 'Crear cuenta' }).click()
  const outcome = await Promise.race([
    page.waitForURL(/\/hoy$/).then(() => 'creada' as const),
    page.getByText(/ya existe una cuenta con este correo/i).waitFor().then(() => 'existia' as const),
  ])
  if (outcome === 'existia') await login(page, c)

  // Un registro real asociado a la cuenta.
  await page.getByText('Feliz', { exact: true }).click()
  await page.getByLabel(/qué te gustaría recordar/i).fill('Texto sintético de la cuenta C.')
  await page.getByRole('button', { name: 'Guardar mi día' }).click()
  await expect(page.getByText('Tu día se ha guardado.')).toBeVisible()

  // Contraseña incorrecta: no se borra nada.
  await page.goto('/ajustes')
  await page.getByRole('button', { name: 'Eliminar mi cuenta' }).click()
  const dialog = page.getByRole('alertdialog')
  await dialog.getByLabel('Tu contraseña', { exact: true }).fill(`${c.password}-mal`)
  await dialog.getByRole('button', { name: 'Eliminar definitivamente' }).click()
  await expect(dialog.getByText('La contraseña no es correcta. No se ha borrado nada.')).toBeVisible()

  // Contraseña correcta: se elimina y se confirma en /login.
  await dialog.getByLabel('Tu contraseña', { exact: true }).fill(c.password)
  await dialog.getByRole('button', { name: 'Eliminar definitivamente' }).click()
  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByText('Tu cuenta y todos tus registros se han eliminado.')).toBeVisible()

  // La cuenta ya no existe.
  await page.getByLabel('Correo electrónico').fill(c.email)
  await page.getByLabel('Contraseña', { exact: true }).fill(c.password)
  await page.getByRole('button', { name: 'Iniciar sesión' }).click()
  await expect(page.getByText('Correo o contraseña incorrectos.')).toBeVisible()
})
