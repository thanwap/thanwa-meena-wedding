import Link from "next/link"
import { auth, signOut } from "@/auth"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/sonner"

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

  return (
    <div className="min-h-svh bg-background">
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <nav className="flex items-center gap-6">
            <Link href="/admin" className="font-medium">
              Admin
            </Link>
            <Link
              href="/admin/rsvps"
              className="text-muted-foreground text-sm hover:text-foreground"
            >
              RSVPs
            </Link>
            <Link
              href="/admin/seating"
              className="text-muted-foreground text-sm hover:text-foreground"
            >
              Seating
            </Link>
            <Link
              href="/admin/change-password"
              className="text-muted-foreground text-sm hover:text-foreground"
            >
              Change password
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            {session?.user?.name && (
              <span className="text-muted-foreground text-sm">
                {session.user.name}
              </span>
            )}
            <form
              action={async () => {
                "use server"
                await signOut({ redirectTo: "/" })
              }}
            >
              <Button type="submit" variant="outline" size="sm">
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
      <Toaster />
    </div>
  )
}
