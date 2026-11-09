import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Button } from '@/shared/ui/Button.tsx'
import { InlineAlert } from '@/shared/ui/InlineAlert.tsx'
import { useAuth } from './authContext.ts'

interface SignOutButtonProps {
  variant?: 'ghost' | 'danger-outline' | 'secondary'
}

export function SignOutButton({ variant = 'danger-outline' }: SignOutButtonProps) {
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleClick = async () => {
    setPending(true)
    setError(null)
    const result = await signOut()
    setPending(false)
    if (!result.ok) {
      setError(result.error.message)
      return
    }
    navigate('/login', { replace: true })
  }

  return (
    <>
      <Button variant={variant} onClick={handleClick} isLoading={pending} loadingText="Cerrando sesión…">
        Cerrar sesión
      </Button>
      {error && <InlineAlert tone="error">{error}</InlineAlert>}
    </>
  )
}
