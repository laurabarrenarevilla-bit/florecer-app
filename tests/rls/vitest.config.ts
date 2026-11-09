import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'

// Pruebas de aislamiento RLS contra el proyecto Supabase real.
// Requiere .env.test.local (ignorado por git) y autorización expresa para ejecutarse.
const projectRoot = fileURLToPath(new URL('../../', import.meta.url))

export default defineConfig(({ mode }) => ({
  root: projectRoot,
  resolve: {
    alias: [{ find: /^@\//, replacement: `${projectRoot}src/` }],
  },
  test: {
    environment: 'node',
    include: ['tests/rls/**/*.test.ts'],
    env: loadEnv(mode, projectRoot, ''),
    testTimeout: 30_000,
    hookTimeout: 60_000,
    fileParallelism: false,
  },
}))
