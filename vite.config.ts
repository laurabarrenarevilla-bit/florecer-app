/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const sassDir = (folder: string) =>
  fileURLToPath(new URL(`./src/sass/${folder}`, import.meta.url))

// Alias que ya usa src/sass/main.scss (@abstracts/..., @base/..., etc.).
// Se anclan con ^ y / para no interferir con paquetes con scope (@supabase/...).
const sassFolders = ['abstracts', 'base', 'components', 'layout', 'pages', 'themes', 'vendors']

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: /^@\//, replacement: `${fileURLToPath(new URL('./src', import.meta.url))}/` },
      ...sassFolders.map((folder) => ({
        find: new RegExp(`^@${folder}/`),
        replacement: `${sassDir(folder)}/`,
      })),
    ],
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    css: false,
    restoreMocks: true,
  },
})
