/**
 * Configuración de las pruebas E2E. Las variables se cargan desde .env y
 * .env.test.local (ignorados por git) en playwright.config.ts.
 *
 * Las pruebas "remote" escriben en el proyecto Supabase real y SOLO se ejecutan
 * con FLORECER_REMOTE_TESTS=1 (script `pnpm e2e:remote`), tras autorización.
 */
export const REMOTE_ENABLED = process.env.FLORECER_REMOTE_TESTS === '1'
export const REMOTE_SKIP_REASON =
  'Pruebas contra Supabase desactivadas: requieren autorización y FLORECER_REMOTE_TESTS=1 (pnpm e2e:remote).'

export interface TestAccount {
  label: 'A' | 'B'
  email: string
  password: string
}

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Falta la variable ${name} en .env.test.local`)
  return value
}

/**
 * Cuentas sintéticas de prueba. Salvaguarda: el correo debe contener "test"
 * para no operar nunca sobre una cuenta real por error de configuración.
 */
export function testAccounts(): { a: TestAccount; b: TestAccount } {
  const a: TestAccount = { label: 'A', email: requireEnv('TEST_A_EMAIL'), password: requireEnv('TEST_A_PASSWORD') }
  const b: TestAccount = { label: 'B', email: requireEnv('TEST_B_EMAIL'), password: requireEnv('TEST_B_PASSWORD') }
  for (const account of [a, b]) {
    if (!/test/i.test(account.email)) {
      throw new Error(`La cuenta de prueba ${account.label} debe ser sintética (su correo debe contener "test").`)
    }
  }
  if (a.email.toLowerCase() === b.email.toLowerCase()) throw new Error('Las cuentas A y B deben ser distintas.')
  return { a, b }
}

/**
 * Cuenta sintética C, solo para probar la eliminación de cuentas: se registra
 * por la UI y se elimina en la misma ejecución, de modo que no se acumula.
 */
export function deletionTestAccount(): TestAccount & { label: 'A' | 'B' } {
  const email = requireEnv('TEST_C_EMAIL')
  if (!/test/i.test(email)) throw new Error('La cuenta C debe ser sintética (su correo debe contener "test").')
  const { a, b } = testAccounts()
  if ([a.email, b.email].map((e) => e.toLowerCase()).includes(email.toLowerCase())) {
    throw new Error('La cuenta C no puede ser A ni B: se elimina durante la prueba.')
  }
  return { label: 'A', email, password: requireEnv('TEST_C_PASSWORD') }
}

export function supabasePublicConfig(): { url: string; key: string } {
  const url = requireEnv('VITE_SUPABASE_URL')
  const key = requireEnv('VITE_SUPABASE_PUBLISHABLE_KEY')
  if (key.startsWith('sb_secret_')) throw new Error('Las pruebas nunca usan una clave secreta.')
  return { url, key }
}
