import { useCurrentUser } from '@/features/auth/authContext.ts'
import { SignOutButton } from '@/features/auth/SignOutButton.tsx'
import { PageHeading } from '@/shared/ui/PageHeading.tsx'

export function SettingsPage() {
  const user = useCurrentUser()

  return (
    <section className="page settings" aria-labelledby="settings-title">
      <PageHeading title="Ajustes" />

      <section className="card settings__section" aria-labelledby="settings-account">
        <h2 className="settings__heading" id="settings-account">
          Cuenta
        </h2>
        <div className="settings__row">
          <div>
            {user.name && <p className="settings__name">{user.name}</p>}
            <p className="settings__email">{user.email ?? 'Cuenta sin correo'}</p>
          </div>
          <SignOutButton />
        </div>
      </section>

      <section className="card settings__section" aria-labelledby="settings-privacy">
        <h2 className="settings__heading" id="settings-privacy">
          Privacidad
        </h2>
        <p>
          Tus registros se guardan en una base de datos en la nube asociada a tu cuenta y protegida con tu correo y tu
          contraseña. Solo tu cuenta puede leerlos. Usamos medidas de seguridad estándar, aunque ningún sistema puede
          garantizar una protección absoluta.
        </p>
        <p>
          Guarda tu contraseña en un lugar seguro: la aplicación no ofrece recuperarla por correo.
        </p>
      </section>
    </section>
  )
}
