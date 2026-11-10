import { useRef, useState, type SubmitEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { useFocusFirstInvalid } from '@/shared/lib/useFocusOnChange.ts'
import { Button } from '@/shared/ui/Button.tsx'
import { InlineAlert } from '@/shared/ui/InlineAlert.tsx'
import { TextField } from '@/shared/ui/TextField.tsx'
import { useAuth } from './authContext.ts'
import type { AuthFailure } from './authErrors.ts'
import { PasswordField } from './PasswordField.tsx'
import { safeRedirectPath } from './redirect.ts'
import { firstFieldErrors, loginSchema, type FieldErrors, type LoginValues } from './schema.ts'

export function LoginForm() {
  const { signIn, sessionExpired, accountDeleted } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [values, setValues] = useState<LoginValues>({ email: '', password: '' })
  const [errors, setErrors] = useState<FieldErrors>({})
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [serverError, setServerError] = useState<AuthFailure | null>(null)
  const [attempt, setAttempt] = useState(0)
  const formRef = useRef<HTMLFormElement>(null)
  const alertRef = useRef<HTMLDivElement>(null)

  useFocusFirstInvalid(formRef, attempt, alertRef)

  const update = (field: keyof LoginValues, value: string) => {
    const next = { ...values, [field]: value }
    setValues(next)
    if (submitted) {
      const result = loginSchema.safeParse(next)
      setErrors(result.success ? {} : firstFieldErrors(result.error))
    }
  }

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isSubmitting) return
    setSubmitted(true)
    setServerError(null)

    const result = loginSchema.safeParse(values)
    if (!result.success) {
      setErrors(firstFieldErrors(result.error))
      setAttempt((n) => n + 1)
      return
    }
    setErrors({})
    setIsSubmitting(true)
    const outcome = await signIn(result.data.email, result.data.password)
    setIsSubmitting(false)
    if (!outcome.ok) {
      setServerError(outcome.error)
      setAttempt((n) => n + 1)
      return
    }
    navigate(safeRedirectPath(location.state), { replace: true })
  }

  return (
    <form ref={formRef} className="form" onSubmit={handleSubmit} noValidate aria-label="Iniciar sesión">
      {accountDeleted && !serverError && (
        <InlineAlert tone="success">Tu cuenta y todos tus registros se han eliminado.</InlineAlert>
      )}

      {sessionExpired && !serverError && (
        <InlineAlert tone="info">Tu sesión ha terminado. Inicia sesión para continuar.</InlineAlert>
      )}

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
        name="password"
        autoComplete="current-password"
        value={values.password}
        onChange={(e) => update('password', e.target.value)}
        error={errors.password}
        disabled={isSubmitting}
        required
      />

      {serverError && (
        <InlineAlert ref={alertRef} tone="error">
          {serverError.message}
        </InlineAlert>
      )}

      <Button type="submit" block size="lg" isLoading={isSubmitting} loadingText="Entrando…">
        Iniciar sesión
      </Button>

      <p className="auth__switch">
        ¿Aún no tienes cuenta? <Link to="/registro">Crear cuenta</Link>
      </p>
    </form>
  )
}
