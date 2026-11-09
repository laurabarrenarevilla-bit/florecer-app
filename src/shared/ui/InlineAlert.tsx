import { forwardRef, type ReactNode } from 'react'

interface InlineAlertProps {
  tone: 'error' | 'success' | 'info'
  children: ReactNode
  actions?: ReactNode
}

/**
 * Mensaje en línea. Los errores se anuncian con role="alert"; el resto con
 * role="status". tabIndex=-1 permite mover el foco al mensaje.
 */
export const InlineAlert = forwardRef<HTMLDivElement, InlineAlertProps>(function InlineAlert(
  { tone, children, actions },
  ref,
) {
  return (
    <div ref={ref} className={`alert alert--${tone}`} role={tone === 'error' ? 'alert' : 'status'} tabIndex={-1}>
      <div>{children}</div>
      {actions && <div className="alert__actions">{actions}</div>}
    </div>
  )
})
