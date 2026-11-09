import { useId, type ReactNode, type TextareaHTMLAttributes } from 'react'

interface TextAreaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> {
  label: ReactNode
  hint?: ReactNode
  error?: string | undefined
  optional?: boolean
  showCounter?: boolean
}

export function TextArea({ label, hint, error, optional, showCounter, maxLength, value, ...rest }: TextAreaProps) {
  const id = useId()
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined
  const length = typeof value === 'string' ? value.length : 0

  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>
        {label}
        {optional && <span className="field__optional">Opcional</span>}
      </label>
      {hint && (
        <p className="field__hint" id={hintId}>
          {hint}
        </p>
      )}
      <textarea
        {...rest}
        id={id}
        value={value}
        maxLength={maxLength}
        className="field__control"
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
      />
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
}
