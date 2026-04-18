import { getSeatingOverview } from "../actions"
import { SeatingManageClient } from "./seating-manage-client"

export const dynamic = "force-dynamic"

export default async function SeatingManagePage() {
  const data = await getSeatingOverview()
  return <SeatingManageClient initialData={data} />
}
