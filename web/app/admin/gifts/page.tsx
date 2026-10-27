import { getGiftNotices } from "./actions"
import { GiftsTable } from "./gifts-table"

export const dynamic = "force-dynamic"

export default async function GiftsPage() {
  const notices = await getGiftNotices()
  return <GiftsTable initialNotices={notices} />
}
