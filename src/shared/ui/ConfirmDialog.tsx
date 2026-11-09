import type { ReactNode } from 'react'
import { Button } from './Button.tsx'
import { Dialog } from './Dialog.tsx'
import { InlineAlert } from './InlineAlert.tsx'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: ReactNode
  confirmLabel: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
  isLoading?: boolean
  loadingText?: string
  error?: string | null
  destructive?: boolean
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel = 'Cancelar',
  onConfirm,
  onCancel,
  isLoading = false,
  loadingText,
  error,
  destructive = true,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onClose={onCancel} title={title} narrow role="alertdialog">
      <p className="dialog__text">{message}</p>
      {error && <InlineAlert tone="error">{error}</InlineAlert>}
      <div className="btn-row">
        <Button variant="secondary" onClick={onCancel} disabled={isLoading} autoFocus>
          {cancelLabel}
        </Button>
        <Button
          variant={destructive ? 'danger' : 'primary'}
          onClick={onConfirm}
          isLoading={isLoading}
          loadingText={loadingText}
        >
          {confirmLabel}
        </Button>
      </div>
    </Dialog>
  )
}
