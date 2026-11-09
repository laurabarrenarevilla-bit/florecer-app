import { useEffect, useId, useRef, type MouseEvent, type ReactNode } from 'react'
import { CloseIcon } from './icons.tsx'

interface DialogProps {
  open: boolean
  onClose: () => void
  title: ReactNode
  children: ReactNode
  narrow?: boolean
  /** Rol alertdialog para confirmaciones destructivas. */
  role?: 'dialog' | 'alertdialog'
  closeLabel?: string
}

/**
 * Diálogo modal basado en <dialog> nativo:
 * - showModal() atrapa el foco y gestiona Escape.
 * - Al cerrar se devuelve el foco al elemento que lo abrió.
 * - Un clic en el fondo (fuera del panel) cierra.
 */
export function Dialog({ open, onClose, title, children, narrow = false, role = 'dialog', closeLabel = 'Cerrar' }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const returnFocusRef = useRef<HTMLElement | null>(null)
  const onCloseRef = useRef(onClose)
  const titleId = useId()

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) {
      returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
      dialog.showModal()
    } else if (!open && dialog.open) {
      dialog.close()
    }
  }, [open])

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    const handleClose = () => {
      const target = returnFocusRef.current
      returnFocusRef.current = null
      if (target?.isConnected) target.focus()
      onCloseRef.current()
    }
    dialog.addEventListener('close', handleClose)
    return () => dialog.removeEventListener('close', handleClose)
  }, [])

  const handleBackdropClick = (event: MouseEvent<HTMLDialogElement>) => {
    const dialog = ref.current
    if (!dialog || event.target !== dialog) return
    const rect = dialog.getBoundingClientRect()
    const inside =
      event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom
    if (!inside) dialog.close()
  }

  return (
    <dialog
      ref={ref}
      className={narrow ? 'dialog dialog--narrow' : 'dialog'}
      aria-labelledby={titleId}
      role={role === 'alertdialog' ? 'alertdialog' : undefined}
      onClick={handleBackdropClick}
    >
      {open && (
        <>
          <div className="dialog__header">
            <h2 className="dialog__title" id={titleId}>
              {title}
            </h2>
            <button type="button" className="dialog__close" onClick={() => ref.current?.close()} aria-label={closeLabel}>
              <CloseIcon />
            </button>
          </div>
          <div className="dialog__body">{children}</div>
        </>
      )}
    </dialog>
  )
}
