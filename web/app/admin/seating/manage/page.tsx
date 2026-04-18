import { auth } from "@/auth"
import { getSeatingOverview } from "../actions"
import { SeatingManageClient } from "./seating-manage-client"

export const dynamic = "force-dynamic"

export default async function SeatingManagePage() {
  const [data, session] = await Promise.all([getSeatingOverview(), auth()])
  return (
    <SeatingManageClient
      initialData={data}
      isSuperAdmin={session?.role === "super_admin"}
    />
  )
}
