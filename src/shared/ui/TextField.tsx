import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react'

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: ReactNode
  hint?: ReactNode
  error?: string | undefined
  optional?: boolean
  /** Muestra contador "n/max" si se indica maxLength. */
  showCounter?: boolean
  /** Contenido adicional dentro del contenedor del control (p. ej. botón mostrar). */
  adornment?: ReactNode
  controlWrapperClassName?: string
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, hint, error, optional, showCounter, adornment, controlWrapperClassName, maxLength, value, className, ...rest },
  ref,
) {
  const id = useId()
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined
  const length = typeof value === 'string' ? value.length : 0

  return (
    <div className={['field', className ?? ''].filter(Boolean).join(' ')}>
      <label className="field__label" htmlFor={id}>
        {label}
        {optional && <span className="field__optional">Opcional</span>}
      </label>
      {hint && (
        <p className="field__hint" id={hintId}>
          {hint}
        </p>
      )}
      <div className={controlWrapperClassName}>
        <input
          {...rest}
          ref={ref}
          id={id}
          value={value}
          maxLength={maxLength}
          className="field__control"
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
        />
        {adornment}
      </div>
      {error && (
        <p className="field__error" id={errorId}>
          {error}
        </p>
      )}
      {showCounter && maxLength !== undefined && (
        <span className="field__counter" aria-hidden="true">
          {length}/{maxLength}
        </span>
      )}
    </div>
  )
})
