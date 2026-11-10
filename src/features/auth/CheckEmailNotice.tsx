import { useEffect, useRef } from 'react'
import { Link } from 'react-router'
import { useDocumentTitle } from '@/shared/lib/useDocumentTitle.ts'
import { MailIcon } from '@/shared/ui/icons.tsx'

/**
 * Tras registrarse cuando Supabase exige confirmar el correo: sustituye al
 * formulario y explica el siguiente paso. Solo se muestra si signUp terminó
 * sin error y sin sesión (Supabase ha enviado el correo de confirmación).
 */
export function CheckEmailNotice({ email }: { email: string }) {
  useDocumentTitle('Revisa tu correo')
  const headingRef = useRef<HTMLHeadingElement>(null)

  // El formulario desaparece: el foco pasa al título para anunciar el cambio.
  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  return (
    <section className="check-email" aria-labelledby="check-email-title">
      <span className="check-email__icon" aria-hidden="true">
        <MailIcon />
      </span>
      <h2 id="check-email-title" className="check-email__title" ref={headingRef} tabIndex={-1}>
        Revisa tu correo
      </h2>
      <p>
        Te hemos enviado un enlace para confirmar tu cuenta a <strong className="check-email__address">{email}</strong>.
      </p>
      <p>Ábrelo para activarla y después vuelve aquí para iniciar sesión.</p>
      <p className="check-email__hint">
        Si no lo encuentras en unos minutos, mira en la carpeta de correo no deseado.
      </p>
      <Link className="btn btn--primary btn--block btn--lg" to="/login" replace>
        Ir a iniciar sesión
      </Link>
    </section>
  )
}
