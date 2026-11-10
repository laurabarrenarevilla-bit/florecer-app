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
  build: {
    rolldownOptions: {
      output: {
        // Librerías en chunks propios: cambian poco y la caché del navegador
        // las conserva entre despliegues de la aplicación.
        codeSplitting: {
          groups: [
            { name: 'react', test: /[\\/]node_modules[\\/](react|react-dom|react-router|scheduler)[\\/]/, priority: 3 },
            { name: 'supabase', test: /[\\/]node_modules[\\/]@supabase[\\/]/, priority: 2 },
            { name: 'vendor', test: /[\\/]node_modules[\\/]/, priority: 1 },
          ],
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    css: false,
    restoreMocks: true,
  },
})
