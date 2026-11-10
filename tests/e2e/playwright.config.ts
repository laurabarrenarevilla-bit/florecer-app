import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from '@playwright/test'
import { loadEnv } from 'vite'

/**
 * E2E de Florecer contra el build de producción servido con `vite preview`.
 *
 * - local-*: sin Supabase (cualquier petición externa se bloquea y falla).
 *            `pnpm e2e`
 * - remote:  contra el proyecto Supabase configurado, con las cuentas de prueba
 *            A/B de .env.test.local. Requiere autorización. `pnpm e2e:remote`
 */
const projectRoot = fileURLToPath(new URL('../../', import.meta.url))
for (const [name, value] of Object.entries(loadEnv('test', projectRoot, ''))) {
  process.env[name] ??= value
}

const PORT = 4173
const mobile = { viewport: { width: 360, height: 740 }, isMobile: true, hasTouch: true }
const desktop = { viewport: { width: 1440, height: 900 } }

export default defineConfig({
  testDir: '.',
  outputDir: '../../test-results/e2e',
  reporter: [['list'], ['html', { outputFolder: '../../playwright-report', open: 'never' }]],
  // Las pruebas remotas comparten cuentas y fechas: siempre en serie.
  fullyParallel: false,
  workers: 1,
  retries: 0,
  use: {
    baseURL: `http://localhost:${PORT}`,
    browserName: 'chromium',
    locale: 'es-ES',
    timezoneId: 'Europe/Madrid',
    // Sin animaciones: axe no debe medir contraste a mitad de un fundido.
    reducedMotion: 'reduce',
    // Sin trazas: guardarían tokens de sesión y textos de las peticiones.
    trace: 'off',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: `pnpm exec vite build && pnpm exec vite preview --port ${PORT} --strictPort`,
    cwd: projectRoot,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false,
    timeout: 180_000,
  },
  projects: [
    { name: 'local-mobile', testDir: './local', use: mobile },
    { name: 'local-desktop', testDir: './local', use: desktop },
    { name: 'remote-setup', testDir: './remote', testMatch: /.*\.setup\.ts/, use: mobile },
    { name: 'remote', testDir: './remote', testMatch: /.*\.spec\.ts/, dependencies: ['remote-setup'], use: mobile },
  ],
})
