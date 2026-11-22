import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'

// Pruebas de las migraciones SQL sobre un PostgreSQL local en memoria (PGlite).
// No usan red ni credenciales: no tocan el proyecto Supabase.
const projectRoot = fileURLToPath(new URL('../../', import.meta.url))

export default defineConfig({
  root: projectRoot,
  test: {
    environment: 'node',
    include: ['tests/db/**/*.test.ts'],
    testTimeout: 30_000,
    hookTimeout: 60_000,
  },
})
