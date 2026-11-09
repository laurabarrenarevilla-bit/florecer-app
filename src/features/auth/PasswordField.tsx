import { forwardRef, useId, useState, type InputHTMLAttributes, type ReactNode } from 'react'
import { TextField } from '@/shared/ui/TextField.tsx'

interface PasswordFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'id'> {
  label: ReactNode
  hint?: ReactNode
  error?: string | undefined
  autoComplete: 'current-password' | 'new-password'
}

export const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(function PasswordField(props, ref) {
  const id = useId()
  const [visible, setVisible] = useState(false)

  return (
    <TextField
      {...props}
      ref={ref}
      id={id}
      type={visible ? 'text' : 'password'}
      autoCapitalize="off"
      autoCorrect="off"
      spellCheck={false}
      controlWrapperClassName="password-field"
      adornment={
        <button
          type="button"
          className="password-field__toggle"
          aria-pressed={visible}
          aria-controls={id}
          aria-label={`Mostrar contraseña${typeof props.label === 'string' ? `: ${props.label}` : ''}`}
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? 'Ocultar' : 'Mostrar'}
        </button>
      }
    />
  )
})
