import { getSeatingOverview } from "./actions"
import { SeatingClient } from "./components/seating-client"

export const dynamic = "force-dynamic"

export default async function SeatingPage() {
  const data = await getSeatingOverview()
  return <SeatingClient initialData={data} />
}
