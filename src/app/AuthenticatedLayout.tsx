import { useCurrentUser } from '@/features/auth/authContext.ts'
import { SignOutButton } from '@/features/auth/SignOutButton.tsx'
import { AppShell } from '@/shared/ui/layout/AppShell.tsx'

export function AuthenticatedLayout() {
  const user = useCurrentUser()
  return (
    <AppShell
      sidebarFooter={
        <>
          {user.name && <strong>{user.name}</strong>}
          {user.email && <span>{user.email}</span>}
          <SignOutButton variant="ghost" />
        </>
      }
    />
  )
}
