import { expect, test as setup } from '@playwright/test'
import { logout } from '../support/app.ts'
import { REMOTE_ENABLED, REMOTE_SKIP_REASON, testAccounts } from '../support/env.ts'

/**
 * Asegura que existen las cuentas sintéticas A y B. Si una no existe, se crea
 * UNA vez mediante el registro público de la interfaz (prueba real del alta).
 * En ejecuciones siguientes solo se inicia sesión: no se crean cuentas nuevas.
 */
setup.skip(!REMOTE_ENABLED, REMOTE_SKIP_REASON)

setup('cuentas de prueba A y B disponibles (registro público solo la primera vez)', async ({ page }) => {
  // Dos inicios y cierres de sesión reales contra Supabase.
  setup.setTimeout(90_000)
  const { a, b } = testAccounts()
  for (const account of [a, b]) {
    await page.goto('/login')
    await page.getByLabel('Correo electrónico').fill(account.email)
    await page.getByLabel('Contraseña', { exact: true }).fill(account.password)
    await page.getByRole('button', { name: 'Iniciar sesión' }).click()

    const outcome = await Promise.race([
      page.waitForURL(/\/hoy$/).then(() => 'dentro' as const),
      page.getByText('Correo o contraseña incorrectos.').waitFor().then(() => 'no-existe' as const),
    ])

    if (outcome === 'no-existe') {
      await page.goto('/registro')
      await page.getByLabel('Nombre').fill(`Prueba ${account.label}`)
      await page.getByLabel('Correo electrónico').fill(account.email)
      await page.getByLabel('Contraseña', { exact: true }).fill(account.password)
      await page.getByLabel('Repite la contraseña', { exact: true }).fill(account.password)
      await page.getByRole('button', { name: 'Crear cuenta' }).click()
      // Si aparece "Ya existe una cuenta", la contraseña de .env.test.local no es la correcta.
      await expect(page).toHaveURL(/\/hoy$/)
      await expect(page.getByText('Tu cuenta está lista.')).toBeVisible()
    }
    await logout(page)
  }
})
