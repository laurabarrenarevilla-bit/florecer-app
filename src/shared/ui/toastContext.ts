import { createContext, useContext } from 'react'

export interface ToastContextValue {
  /** Muestra un aviso breve. Usar solo tras confirmación real del backend. */
  showToast: (message: string) => void
}

export const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast debe usarse dentro de <ToastProvider>.')
  return ctx
}
