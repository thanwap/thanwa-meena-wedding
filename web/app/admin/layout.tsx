import { auth, signOut } from '@/auth'
import { redirect } from 'next/navigation'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session) redirect('/api/auth/signin')

  async function handleSignOut() {
    'use server'
    await signOut({ redirectTo: '/' })
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="flex justify-between items-center px-6 py-3 border-b border-gray-200">
        <span className="font-semibold text-gray-800">Wedding Admin</span>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">{session.user?.email}</span>
          <form action={handleSignOut}>
            <button
              type="submit"
              className="text-sm text-red-600 hover:underline"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>
      <main className="p-6">{children}</main>
    </div>
  )
}
