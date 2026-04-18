import { Suspense } from "react"
import { auth } from "@/auth"
import { getGuestbookEntries } from "./actions"
import { GuestbookTable } from "./guestbook-table"

export const dynamic = "force-dynamic"

export default async function GuestbookAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; pageSize?: string; search?: string }>
}) {
  const params = await searchParams
  const page = Math.max(1, Number(params.page) || 1)
  const pageSize = Math.min(50, Math.max(10, Number(params.pageSize) || 20))
  const search = params.search ?? ""
  const [result, session] = await Promise.all([
    getGuestbookEntries(page, pageSize, search),
    auth(),
  ])

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Guestbook</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {result.totalCount} {result.totalCount === 1 ? "entry" : "entries"}
        </p>
      </div>
      <Suspense>
        <GuestbookTable
          initialEntries={result.items}
          page={page}
          pageSize={pageSize}
          totalPages={result.totalPages}
          totalCount={result.totalCount}
          search={search}
          isSuperAdmin={session?.role === "super_admin"}
        />
      </Suspense>
    </div>
  )
}
