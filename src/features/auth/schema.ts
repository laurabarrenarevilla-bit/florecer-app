import { z } from 'zod'

/** Debe coincidir con la política de contraseñas configurada en Supabase Auth. */
export const PASSWORD_MIN_LENGTH = 8
export const PASSWORD_MAX_LENGTH = 72
export const PASSWORD_REQUIREMENTS_TEXT = 'Mínimo 8 caracteres, con mayúsculas, minúsculas y números.'

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, { error: 'Escribe tu correo electrónico.' })
  .pipe(z.email({ error: 'Revisa el correo electrónico: parece que no es válido.' }))

const newPasswordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, { error: `Usa al menos ${PASSWORD_MIN_LENGTH} caracteres.` })
  .max(PASSWORD_MAX_LENGTH, { error: `Usa como máximo ${PASSWORD_MAX_LENGTH} caracteres.` })
  .regex(/[a-z]/, { error: 'Incluye al menos una letra minúscula.' })
  .regex(/[A-Z]/, { error: 'Incluye al menos una letra mayúscula.' })
  .regex(/\d/, { error: 'Incluye al menos un número.' })

export const loginSchema = z.object({
  email: emailSchema,
  // En el acceso no se revela la política: solo se exige que no esté vacía.
  password: z.string().min(1, { error: 'Escribe tu contraseña.' }),
})

export const signUpSchema = z
  .object({
    email: emailSchema,
    password: newPasswordSchema,
    confirmPassword: z.string().min(1, { error: 'Repite la contraseña.' }),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    error: 'Las contraseñas no coinciden.',
  })

export type LoginValues = z.input<typeof loginSchema>
export type SignUpValues = z.input<typeof signUpSchema>

export { firstFieldErrors, type FieldErrors } from '@/shared/lib/fieldErrors.ts'
