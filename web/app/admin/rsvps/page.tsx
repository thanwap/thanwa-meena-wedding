import { getStats, getRsvps } from "./actions"
import { RsvpsClient } from "./rsvps-table"

export const dynamic = "force-dynamic"

export default async function RsvpsPage() {
  const [stats, rsvps] = await Promise.all([getStats(), getRsvps()])
  return <RsvpsClient initialStats={stats} initialRsvps={rsvps} />
}
