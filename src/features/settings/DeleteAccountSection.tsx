import { useRef, useState, type SubmitEvent } from 'react'
import { useAuth } from '@/features/auth/authContext.ts'
import { PasswordField } from '@/features/auth/PasswordField.tsx'
import { Button } from '@/shared/ui/Button.tsx'
import { Dialog } from '@/shared/ui/Dialog.tsx'

/**
 * Eliminación de la propia cuenta: confirmación explícita y contraseña.
 * Tras el borrado, AuthProvider cierra la sesión y /login lo confirma.
 */
export function DeleteAccountSection() {
  const { deleteAccount } = useAuth()
  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const passwordRef = useRef<HTMLInputElement>(null)
  const submittingRef = useRef(false)

  const close = () => {
    if (pending) return
    setOpen(false)
    setPassword('')
    setError(null)
  }

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submittingRef.current) return
    if (!password) {
      setError('Escribe tu contraseña para confirmar.')
      passwordRef.current?.focus()
      return
    }
    submittingRef.current = true
    setPending(true)
    setError(null)
    const result = await deleteAccount(password)
    submittingRef.current = false
    // Si ha ido bien, la sesión ya se ha cerrado y la app lleva a /login.
    if (result.ok) return
    setPending(false)
    setError(result.error.code === 'INVALID_CREDENTIALS' ? 'La contraseña no es correcta. No se ha borrado nada.' : result.error.message)
    passwordRef.current?.focus()
  }

  return (
    <section className="card settings__section settings__section--danger" aria-labelledby="settings-delete">
      <h2 className="settings__heading" id="settings-delete">
        Eliminar cuenta
      </h2>
      <p>
        Se borrarán de forma permanente tu cuenta y todos tus registros: emociones, reflexiones y logros. No se puede
        deshacer.
      </p>
      <div>
        <Button variant="danger-outline" onClick={() => setOpen(true)}>
          Eliminar mi cuenta
        </Button>
      </div>

      <Dialog open={open} onClose={close} title="¿Eliminar tu cuenta?" narrow role="alertdialog">
        <form className="form" onSubmit={handleSubmit} noValidate aria-label="Confirmar eliminación de la cuenta">
          <p className="dialog__text">
            Vas a borrar tu cuenta y <strong>todos tus registros</strong>. Esta acción es definitiva: no se pueden
            recuperar.
          </p>
          <PasswordField
            ref={passwordRef}
            label="Tu contraseña"
            hint="Por seguridad, confirma que eres tú."
            name="current-password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={error ?? undefined}
            disabled={pending}
            required
          />
          <div className="btn-row">
            <Button variant="secondary" onClick={close} disabled={pending} autoFocus>
              Cancelar
            </Button>
            <Button type="submit" variant="danger" isLoading={pending} loadingText="Eliminando…">
              Eliminar definitivamente
            </Button>
          </div>
        </form>
      </Dialog>
    </section>
  )
}
