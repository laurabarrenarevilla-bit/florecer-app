import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'
import { AxeBuilder } from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { blockExternalRequests, hasHorizontalOverflow } from '../support/app.ts'

/**
 * Pruebas en navegador real SIN Supabase: rutas públicas, validación,
 * accesibilidad con contraste, CSP de vercel.json y contenido del build.
 * Cualquier petición fuera de localhost se bloquea y hace fallar la prueba.
 */
const projectRoot = fileURLToPath(new URL('../../../', import.meta.url))

let blocked: string[] = []
test.beforeEach(async ({ page }) => {
  blocked = await blockExternalRequests(page)
})
test.afterEach(() => {
  expect(blocked, 'La prueba local no debe contactar con servicios externos').toEqual([])
})

test.describe('Rutas públicas y protección', () => {
  test('F1-15: sin sesión, las rutas privadas llevan a /login sin mostrar contenido privado', async ({ page }) => {
    for (const path of ['/hoy', '/calendario?mes=2026-01&dia=2026-01-05', '/ajustes']) {
      await page.goto(path)
      await expect(page).toHaveURL(/\/login$/)
      await expect(page.getByRole('form', { name: 'Iniciar sesión' })).toBeVisible()
      await expect(page.getByText('¿Cómo te has sentido hoy?')).toHaveCount(0)
    }
  })

  test('/ redirige a /login sin sesión', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/\/login$/)
  })

  test('404 con enlace de vuelta (deep link servido por el rewrite SPA)', async ({ page }) => {
    await page.goto('/no-existe/de-verdad')
    await expect(page.getByRole('heading', { name: 'No hemos encontrado esta página' })).toBeVisible()
    await page.getByRole('link', { name: 'Volver al inicio' }).click()
    await expect(page).toHaveURL(/\/login$/)
  })

  test('las pestañas cambian entre iniciar sesión y crear cuenta', async ({ page }) => {
    await page.goto('/login')
    const tabs = page.getByRole('navigation', { name: 'Acceso a la cuenta' })
    await tabs.getByRole('link', { name: 'Crear cuenta' }).click()
    await expect(page).toHaveURL(/\/registro$/)
    await expect(page.getByLabel('Repite la contraseña', { exact: true })).toBeVisible()
    await tabs.getByRole('link', { name: 'Iniciar sesión' }).click()
    await expect(page).toHaveURL(/\/login$/)
  })
})

test.describe('Validación en el navegador (no llega a Supabase)', () => {
  test('registro: correo inválido y contraseñas distintas', async ({ page }) => {
    await page.goto('/registro')
    await page.getByLabel('Nombre').fill('Persona')
    await page.getByLabel('Correo electrónico').fill('no-es-un-correo')
    await page.getByLabel('Contraseña', { exact: true }).fill('Florecer2026')
    await page.getByLabel('Repite la contraseña', { exact: true }).fill('Florecer2027')
    await page.getByRole('button', { name: 'Crear cuenta' }).click()

    await expect(page.getByLabel('Correo electrónico')).toHaveAttribute('aria-invalid', 'true')
    await expect(page.getByLabel('Repite la contraseña', { exact: true })).toHaveAttribute('aria-invalid', 'true')
    await expect(page.getByLabel('Correo electrónico')).toBeFocused()
  })

  test('inicio de sesión: campos vacíos', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('button', { name: 'Iniciar sesión' }).click()
    await expect(page.getByText('Escribe tu correo electrónico.')).toBeVisible()
    await expect(page.getByText('Escribe tu contraseña.')).toBeVisible()
  })

  test('mostrar y ocultar la contraseña', async ({ page }) => {
    await page.goto('/login')
    const password = page.getByLabel('Contraseña', { exact: true })
    await password.fill('secreto-de-prueba')
    const toggle = page.getByRole('button', { name: /mostrar contraseña/i })
    await toggle.click()
    await expect(password).toHaveAttribute('type', 'text')
    await expect(toggle).toHaveAttribute('aria-pressed', 'true')
    await toggle.click()
    await expect(password).toHaveAttribute('type', 'password')
  })
})

test.describe('F1-17 / F1-18: diseño y accesibilidad en navegador real', () => {
  for (const path of ['/login', '/registro', '/no-existe']) {
    test(`${path}: sin infracciones axe (incluido contraste) ni scroll horizontal`, async ({ page }) => {
      await page.goto(path)
      await page.locator('h1').first().waitFor()
      const results = await new AxeBuilder({ page }).analyze()
      expect(results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([])
      expect(await hasHorizontalOverflow(page)).toBe(false)
    })
  }

  test('el formulario es usable solo con teclado', async ({ page }) => {
    await page.goto('/login')
    await page.keyboard.press('Tab')
    // Recorre hasta el correo y comprueba que el foco es visible (outline o box-shadow).
    for (let i = 0; i < 6; i += 1) {
      if (await page.getByLabel('Correo electrónico').evaluate((el) => el === document.activeElement)) break
      await page.keyboard.press('Tab')
    }
    const email = page.getByLabel('Correo electrónico')
    await expect(email).toBeFocused()
    const ring = await email.evaluate((el) => {
      const style = getComputedStyle(el)
      return style.outlineStyle !== 'none' || style.boxShadow !== 'none'
    })
    expect(ring).toBe(true)
  })
})

test.describe('Despliegue', () => {
  test('la CSP de vercel.json no bloquea nada de la aplicación', async ({ page }) => {
    const vercel = JSON.parse(readFileSync(`${projectRoot}vercel.json`, 'utf8')) as {
      headers: { source: string; headers: { key: string; value: string }[] }[]
    }
    const csp = vercel.headers.flatMap((h) => h.headers).find((h) => h.key === 'Content-Security-Policy')?.value
    expect(csp).toBeTruthy()

    // Se sirve el documento con la misma cabecera que pondrá Vercel.
    await page.route(
      (url) => url.hostname === 'localhost' && !url.pathname.startsWith('/assets/'),
      async (route) => {
        const response = await route.fetch()
        await route.fulfill({ response, headers: { ...response.headers(), 'content-security-policy': csp! } })
      },
    )
    await page.addInitScript(() => {
      const w = window as unknown as { __cspViolations: string[] }
      w.__cspViolations = []
      document.addEventListener('securitypolicyviolation', (e) => w.__cspViolations.push(`${e.violatedDirective} ${e.blockedURI}`))
    })

    await page.goto('/registro')
    await page.getByLabel('Correo electrónico').fill('a@b')
    await page.getByRole('button', { name: 'Crear cuenta' }).click()
    await page.goto('/no-existe')
    const violations = await page.evaluate(() => (window as unknown as { __cspViolations: string[] }).__cspViolations)
    expect(violations).toEqual([])
  })

  test('el build no contiene secretos (service_role, claves secretas, NVIDIA)', () => {
    const assetsDir = `${projectRoot}dist/assets`
    const bundle = readdirSync(assetsDir)
      .filter((file) => file.endsWith('.js'))
      .map((file) => readFileSync(`${assetsDir}/${file}`, 'utf8'))
      .join('\n')
    expect(bundle).not.toMatch(/service_role/i)
    expect(bundle).not.toMatch(/NVIDIA/i)
    // "sb_secret_" solo puede aparecer como prefijo comprobado, nunca seguido de una clave.
    expect(bundle).not.toMatch(/sb_secret_[A-Za-z0-9_-]{8,}/)
    // Cualquier JWT incrustado (p. ej. una clave anon heredada) no puede tener rol service_role.
    const roles = [...bundle.matchAll(/eyJ[\w-]+\.(eyJ[\w-]+)\.[\w-]+/g)].map((match) => {
      const payload = JSON.parse(Buffer.from(match[1]!, 'base64url').toString('utf8')) as { role?: string }
      return payload.role ?? 'sin rol'
    })
    expect(roles).not.toContain('service_role')
  })
})
