import { auth, signOut } from "@/auth"

import { AdminShell } from "./admin-shell"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  // Unauthenticated routes (e.g. /admin/login) render without the admin chrome
  if (!session) {
    return <>{children}</>
  }

  async function signOutAction() {
    "use server"
    await signOut({ redirectTo: "/" })
  }

  return (
    <AdminShell
      userName={session.user?.name}
      userRole={session.role}
      signOutAction={signOutAction}
    >
      {children}
    </AdminShell>
  )
}
