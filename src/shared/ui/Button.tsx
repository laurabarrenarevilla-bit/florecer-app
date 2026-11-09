import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'danger' | 'danger-outline' | 'ghost'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  block?: boolean
  size?: 'md' | 'lg'
  /** Muestra estado de carga: deshabilita el botón y anuncia aria-busy. */
  isLoading?: boolean
  loadingText?: string
  children: ReactNode
}

export function Button({
  variant = 'primary',
  block = false,
  size = 'md',
  isLoading = false,
  loadingText,
  disabled,
  className,
  type = 'button',
  children,
  ...rest
}: ButtonProps) {
  const classes = [
    'btn',
    `btn--${variant}`,
    block ? 'btn--block' : '',
    size === 'lg' ? 'btn--lg' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button
      {...rest}
      type={type}
      className={classes}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
    >
      {isLoading && loadingText ? loadingText : children}
    </button>
  )
}
