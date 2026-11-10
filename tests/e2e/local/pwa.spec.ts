import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'
import { expect, test, type Page } from '@playwright/test'
import { AxeBuilder } from '@axe-core/playwright'
import { hasHorizontalOverflow } from '../support/app.ts'

async function controlled(page: Page) {
  await page.goto('/login')
  await page.evaluate(async () => { await navigator.serviceWorker.ready })
  await page.reload()
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true)
  await expect(page.getByRole('form', { name: 'Iniciar sesión' })).toBeVisible()
}

test('PWA: manifest raíz, iconos, arranque offline y caché limitada a archivos públicos', async ({ page, context }) => {
  await controlled(page)
  const response = await page.request.get('/favicon/site.webmanifest')
  const manifest = await response.json()
  expect(manifest).toMatchObject({ id: '/', start_url: '/', scope: '/', display: 'standalone', lang: 'es-ES' })
  for (const icon of manifest.icons) {
    expect((await page.request.get(icon.src)).ok()).toBe(true)
  }

  await page.route('**/api/pwa-cache-probe', (route) => route.fulfill({ json: { probe: true } }))
  expect(await page.evaluate(async () => (await fetch('/api/pwa-cache-probe')).json())).toEqual({ probe: true })
  await context.setOffline(true)
  await page.goto('/registro')
  await expect(page.getByRole('button', { name: 'Crear cuenta' })).toBeVisible()
  await expect(page.getByText(/Parece que no hay conexión/)).toBeVisible()
  const urls = await page.evaluate(async () => {
    const names = await caches.keys()
    const requests = await Promise.all(names.map(async (name) => (await caches.open(name)).keys()))
    return requests.flat().map((request) => request.url)
  })
  expect(urls.length).toBeGreaterThan(10)
  for (const url of urls) {
    const cached = new URL(url)
    expect(cached.origin).toBe(new URL(page.url()).origin)
    expect(cached.pathname).toMatch(/^\/(index\.html$|assets\/|favicon\/)/)
  }
  await context.setOffline(false)
  await expect(page.getByText(/Parece que no hay conexión/)).toHaveCount(0)
})

test('PWA: una nueva versión espera, protege otras ventanas y solo recarga tras pulsar Actualizar', async ({ page, context }) => {
  // Cambia únicamente los bytes del worker compilado para simular la siguiente publicación.
  // Se restaura siempre; no toca fuentes ni servicios remotos. Los proyectos se ejecutan en serie.
  const workerPath = fileURLToPath(new URL('../../../dist/sw.js', import.meta.url))
  const original = readFileSync(workerPath, 'utf8')
  await controlled(page)
  const other = await context.newPage()
  await controlled(other)
  await other.getByLabel('Correo electrónico').fill('pwa-test@example.invalid')
  try {
    writeFileSync(workerPath, `${original}\n// pwa-update-test-${Date.now()}\n`)
    await page.evaluate(async () => { await (await navigator.serviceWorker.getRegistration())?.update() })
    await expect(page.getByText('Hay una nueva versión de Florecer.')).toBeVisible()
    await page.getByRole('button', { name: 'Actualizar', exact: true }).click()
    await expect(page.getByRole('alert')).toHaveText(/Cierra las otras ventanas/)
    await expect(other.getByLabel('Correo electrónico')).toHaveValue('pwa-test@example.invalid')
    await other.close()
    await page.getByRole('button', { name: 'Actualizar', exact: true }).click()
    await expect(page.getByText('Hay una nueva versión de Florecer.')).toHaveCount(0)
    await expect(page.getByRole('form', { name: 'Iniciar sesión' })).toBeVisible()
    await expect.poll(() => page.evaluate(async () => Boolean((await navigator.serviceWorker.getRegistration())?.waiting))).toBe(false)
  } finally {
    writeFileSync(workerPath, original)
    await other.close()
  }
})

test('PWA: conserva el borrador al aplazar, también desde Ajustes, con API simulada aislada', async ({ page, context }, testInfo) => {
  // Ninguna cuenta real ni petición externa: sesión sintética exclusiva de este contexto.
  await context.route((url) => url.hostname.endsWith('.supabase.co'), async (route) => {
    const path = new URL(route.request().url()).pathname
    if (path === '/auth/v1/token') {
      await route.fulfill({ json: {
        access_token: 'pwa-synthetic-token', refresh_token: 'pwa-synthetic-refresh',
        token_type: 'bearer', expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600,
        user: { id: '00000000-0000-4000-8000-000000000001', email: 'pwa-test@example.invalid',
          aud: 'authenticated', app_metadata: {}, user_metadata: {}, created_at: '2026-01-01T00:00:00Z' },
      } })
    } else if (path === '/rest/v1/journal_entries' && route.request().method() === 'GET') {
      await route.fulfill({ contentType: 'application/json', body: 'null' })
    } else {
      await route.abort()
    }
  })
  const workerPath = fileURLToPath(new URL('../../../dist/sw.js', import.meta.url))
  const original = readFileSync(workerPath, 'utf8')
  await controlled(page)
  await page.getByLabel('Correo electrónico').fill('pwa-test@example.invalid')
  await page.getByLabel('Contraseña', { exact: true }).fill('PwaSynthetic2026')
  await page.getByRole('button', { name: 'Iniciar sesión' }).click()
  await expect(page).toHaveURL(/\/hoy$/)
  await page.getByText('Feliz', { exact: true }).click()
  try {
    writeFileSync(workerPath, `${original}\n// pwa-draft-test-${Date.now()}\n`)
    await page.evaluate(async () => { await (await navigator.serviceWorker.getRegistration())?.update() })
    await expect(page.getByRole('button', { name: 'Actualizar', exact: true })).toBeDisabled()
    await page.getByRole('link', { name: 'Ajustes', exact: true }).filter({ visible: true }).click()
    await expect(page.getByRole('heading', { name: 'Instalar Florecer' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Actualizar', exact: true })).toBeDisabled()
    expect(await hasHorizontalOverflow(page)).toBe(false)
    const accessibility = await new AxeBuilder({ page }).analyze()
    expect(accessibility.violations).toEqual([])
    await page.screenshot({ path: testInfo.outputPath('pwa-settings.png'), fullPage: true })
    await page.getByRole('button', { name: 'Más tarde' }).click()
    await page.getByRole('link', { name: 'Hoy', exact: true }).filter({ visible: true }).click()
    await expect(page.getByRole('radio', { name: 'Feliz', exact: true })).toBeChecked()
    const urls = await page.evaluate(async () => {
      const requests = await Promise.all((await caches.keys()).map(async (name) => (await caches.open(name)).keys()))
      return requests.flat().map((request) => request.url)
    })
    for (const url of urls) {
      const cached = new URL(url)
      expect(cached.origin).toBe(new URL(page.url()).origin)
      expect(cached.pathname).toMatch(/^\/(index\.html$|assets\/|favicon\/)/)
    }
  } finally { writeFileSync(workerPath, original) }
})
