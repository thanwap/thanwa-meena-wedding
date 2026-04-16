import { Suspense } from "react"
import { getStats, getRsvps } from "./actions"
import { RsvpsClient } from "./rsvps-table"

export const dynamic = "force-dynamic"

export default async function RsvpsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; pageSize?: string; search?: string; status?: string }>
}) {
  const params = await searchParams
  const page = Math.max(1, Number(params.page) || 1)
  const pageSize = Math.min(50, Math.max(10, Number(params.pageSize) || 20))
  const search = params.search ?? ""
  const status = params.status ?? "all"

  const [stats, rsvpResult] = await Promise.all([
    getStats(),
    getRsvps(page, pageSize, search, status),
  ])

  return (
    <Suspense>
      <RsvpsClient
        initialStats={stats}
        initialRsvps={rsvpResult.items}
        page={page}
        pageSize={pageSize}
        totalPages={rsvpResult.totalPages}
        totalCount={rsvpResult.totalCount}
        search={search}
        statusFilter={status}
      />
    </Suspense>
  )
}
