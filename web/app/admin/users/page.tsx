import { auth } from "@/auth"
import { getUsers } from "./actions"
import { UsersClient } from "./users-client"

export const dynamic = "force-dynamic"

export default async function UsersPage() {
  const [users, session] = await Promise.all([getUsers(), auth()])
  const currentUser = session?.user?.name ?? ""
  const isSuperAdmin = session?.role === "super_admin"
  return (
    <UsersClient
      initialUsers={users}
      currentUser={currentUser}
      isSuperAdmin={isSuperAdmin}
    />
  )
}
