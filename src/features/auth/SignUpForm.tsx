import { useRef, useState, type SubmitEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { useFocusFirstInvalid } from '@/shared/lib/useFocusOnChange.ts'
import { Button } from '@/shared/ui/Button.tsx'
import { InlineAlert } from '@/shared/ui/InlineAlert.tsx'
import { TextField } from '@/shared/ui/TextField.tsx'
import { useAuth } from './authContext.ts'
import type { AuthFailure } from './authErrors.ts'
import { PasswordField } from './PasswordField.tsx'
import { firstFieldErrors, PASSWORD_REQUIREMENTS_TEXT, signUpSchema, type FieldErrors, type SignUpValues } from './schema.ts'

type Outcome = { kind: 'error'; error: AuthFailure } | { kind: 'no-session' } | null

export function SignUpForm() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [values, setValues] = useState<SignUpValues>({ email: '', password: '', confirmPassword: '' })
  const [errors, setErrors] = useState<FieldErrors>({})
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [outcome, setOutcome] = useState<Outcome>(null)
  const [attempt, setAttempt] = useState(0)
  const formRef = useRef<HTMLFormElement>(null)
  const alertRef = useRef<HTMLDivElement>(null)

  useFocusFirstInvalid(formRef, attempt, alertRef)

  const update = (field: keyof SignUpValues, value: string) => {
    const next = { ...values, [field]: value }
    setValues(next)
    if (submitted) {
      const result = signUpSchema.safeParse(next)
      setErrors(result.success ? {} : firstFieldErrors(result.error))
    }
  }

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isSubmitting) return
    setSubmitted(true)
    setOutcome(null)

    const result = signUpSchema.safeParse(values)
    if (!result.success) {
      setErrors(firstFieldErrors(result.error))
      setAttempt((n) => n + 1)
      return
    }
    setErrors({})
    setIsSubmitting(true)
    const response = await signUp(result.data.email, result.data.password)
    setIsSubmitting(false)

    if (!response.ok) {
      if (response.error.code === 'WEAK_PASSWORD') {
        setErrors({ password: response.error.message })
      } else if (response.error.code === 'INVALID_EMAIL') {
        setErrors({ email: response.error.message })
      } else {
        setOutcome({ kind: 'error', error: response.error })
      }
      setAttempt((n) => n + 1)
      return
    }
    if (!response.sessionStarted) {
      // La configuración remota exige una verificación que no está disponible.
      setOutcome({ kind: 'no-session' })
      setAttempt((n) => n + 1)
      return
    }
    // La confirmación visual se muestra en Hoy (justSignedUp).
    navigate('/hoy', { replace: true })
  }

  return (
    <form ref={formRef} className="form" onSubmit={handleSubmit} noValidate aria-label="Crear cuenta">
      <TextField
        label="Correo electrónico"
        type="email"
        name="email"
        inputMode="email"
        autoComplete="email"
        autoCapitalize="off"
        spellCheck={false}
        placeholder="tucorreo@ejemplo.com"
        value={values.email}
        onChange={(e) => update('email', e.target.value)}
        error={errors.email}
        disabled={isSubmitting}
        required
      />

      <PasswordField
        label="Contraseña"
        name="new-password"
        autoComplete="new-password"
        hint={PASSWORD_REQUIREMENTS_TEXT}
        value={values.password}
        onChange={(e) => update('password', e.target.value)}
        error={errors.password}
        disabled={isSubmitting}
        required
      />

      <PasswordField
        label="Repite la contraseña"
        name="confirm-password"
        autoComplete="new-password"
        value={values.confirmPassword}
        onChange={(e) => update('confirmPassword', e.target.value)}
        error={errors.confirmPassword}
        disabled={isSubmitting}
        required
      />

      {outcome?.kind === 'error' && (
        <InlineAlert
          ref={alertRef}
          tone="error"
          actions={
            outcome.error.code === 'USER_ALREADY_EXISTS' ? <Link to="/login">Ir a iniciar sesión</Link> : undefined
          }
        >
          {outcome.error.message}
        </InlineAlert>
      )}

      {outcome?.kind === 'no-session' && (
        <InlineAlert ref={alertRef} tone="info">
          Tu cuenta se ha creado, pero todavía no puedes acceder: el acceso requiere una verificación que ahora mismo no
          está disponible.
        </InlineAlert>
      )}

      <Button type="submit" block size="lg" isLoading={isSubmitting} loadingText="Creando cuenta…">
        Crear cuenta
      </Button>

      <p className="auth__note">Guarda tu contraseña en un lugar seguro: no se puede recuperar por correo.</p>

      <p className="auth__switch">
        ¿Ya tienes cuenta? <Link to="/login">Iniciar sesión</Link>
      </p>
    </form>
  )
}
