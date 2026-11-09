import { Button } from '@/shared/ui/Button.tsx'
import { InlineAlert } from '@/shared/ui/InlineAlert.tsx'
import { useAuth } from './authContext.ts'

/** Confirmación visual tras crear la cuenta (solo si se inició sesión de verdad). */
export function WelcomeNotice() {
  const { justSignedUp, dismissWelcome } = useAuth()
  if (!justSignedUp) return null

  return (
    <InlineAlert
      tone="success"
      actions={
        <Button variant="ghost" onClick={dismissWelcome}>
          Entendido
        </Button>
      }
    >
      <strong>Tu cuenta está lista.</strong> Ya has iniciado sesión. Te damos la bienvenida a Florecer.
    </InlineAlert>
  )
}
