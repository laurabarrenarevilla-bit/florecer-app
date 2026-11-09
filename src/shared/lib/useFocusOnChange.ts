import { useEffect, type RefObject } from 'react'

/**
 * Tras un intento de envío fallido, mueve el foco al primer campo inválido
 * del formulario o, si no hay, al elemento indicado (p. ej. una alerta).
 * `trigger` debe cambiar en cada intento.
 */
export function useFocusFirstInvalid(
  formRef: RefObject<HTMLFormElement | null>,
  trigger: number,
  fallbackRef?: RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    if (trigger === 0) return
    const invalid = formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')
    if (invalid) {
      invalid.focus()
      return
    }
    fallbackRef?.current?.focus()
  }, [trigger, formRef, fallbackRef])
}
