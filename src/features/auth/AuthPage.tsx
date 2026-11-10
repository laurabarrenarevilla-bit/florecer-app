import { useState } from 'react'
import { NavLink } from 'react-router'
import { useDocumentTitle } from '@/shared/lib/useDocumentTitle.ts'
import { SproutIcon, LockIcon } from '@/shared/ui/icons.tsx'
import { CheckEmailNotice } from './CheckEmailNotice.tsx'
import { LoginForm } from './LoginForm.tsx'
import { SignUpForm } from './SignUpForm.tsx'

interface AuthPageProps {
  mode: 'login' | 'signup'
}

export function AuthPage({ mode }: AuthPageProps) {
  useDocumentTitle(mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta')
  // Correo al que Supabase envió la confirmación; mientras exista, no se muestran los formularios.
  const [pendingEmail, setPendingEmail] = useState<string | null>(null)

  return (
    <main className="centered-page auth">
      <header className="auth__header">
        <SproutIcon size={36} />
        <h1 className="auth__title">Florecer</h1>
        <p className="auth__tagline">Un espacio privado para ti.</p>
      </header>

      {mode === 'signup' && pendingEmail !== null ? (
        <div className="auth__panel">
          <CheckEmailNotice email={pendingEmail} />
        </div>
      ) : (
        <>
          <nav className="auth__tabs" aria-label="Acceso a la cuenta">
            <ul className="segmented" role="list">
              <li className="segmented__item">
                <NavLink to="/login" className="segmented__option" replace>
                  Iniciar sesión
                </NavLink>
              </li>
              <li className="segmented__item">
                <NavLink to="/registro" className="segmented__option" replace>
                  Crear cuenta
                </NavLink>
              </li>
            </ul>
          </nav>

          <div className="auth__panel">
            {mode === 'login' ? <LoginForm /> : <SignUpForm onConfirmationRequired={setPendingEmail} />}
          </div>
        </>
      )}

      <div className="auth__privacy">
        <p>
          <LockIcon />
          Tus registros se guardan en la nube, asociados a tu cuenta, y solo tu cuenta puede acceder a ellos.
        </p>
      </div>
    </main>
  )
}
