import { useCurrentUser } from '@/features/auth/authContext.ts'
import { SignOutButton } from '@/features/auth/SignOutButton.tsx'
import { AppShell } from '@/shared/ui/layout/AppShell.tsx'
import { UserIcon } from '@/shared/ui/icons.tsx'
import { Link } from 'react-router'

export function AuthenticatedLayout() {
  const user = useCurrentUser()
  return (
    <AppShell
      sidebarFooter={
        <>
          <Link to="/ajustes" className="sidebar__account">
            <span className="sidebar__avatar"><UserIcon size={20} /></span>
            <span className="sidebar__identity">
              <strong className="sidebar__name">{user.name || 'Tu cuenta'}</strong>
              {user.email && <span className="sidebar__email" title={user.email}>{user.email}</span>}
            </span>
          </Link>
          <SignOutButton variant="ghost" />
        </>
      }
    />
  )
}
