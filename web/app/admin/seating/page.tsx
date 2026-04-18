import { auth } from "@/auth"
import { getSeatingOverview } from "./actions"
import { SeatingClient } from "./components/seating-client"

export const dynamic = "force-dynamic"

export default async function SeatingPage() {
  const [data, session] = await Promise.all([getSeatingOverview(), auth()])
  return (
    <SeatingClient
      initialData={data}
      isSuperAdmin={session?.role === "super_admin"}
    />
  )
}
