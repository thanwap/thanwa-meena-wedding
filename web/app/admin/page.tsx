import Link from "next/link"
import { auth } from "@/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/admin/page-header"
import { NAV_GROUPS } from "./_nav"
import { getStats } from "./rsvps/actions"
import { getGuestbookEntries } from "./guestbook/actions"
import { adminGetPhotos } from "./photos/actions"

export const dynamic = "force-dynamic"

const QUICK_LINK_DESCRIPTIONS: Record<string, string> = {
  "/admin/rsvps": "View and manage guest responses",
  "/admin/seating": "Arrange guests on tables",
  "/admin/seating/manage": "Create and edit tables",
  "/admin/guestbook": "Read and moderate messages",
  "/admin/photos": "Browse and manage uploads",
  "/admin/users": "Manage admin accounts",
}

export default async function AdminHome() {
  const session = await auth()
  const isSuperAdmin = session?.role === "super_admin"

  const [rsvpStats, guestbookResult, photosResult] = await Promise.all([
    getStats().catch(() => ({
      total: 0,
      attending: 0,
      declining: 0,
      totalGuests: 0,
      confirmedGuests: 0,
      pending: 0,
      confirmed: 0,
      cancelled: 0,
    })),
    getGuestbookEntries(1, 1, "").catch(() => ({
      items: [],
      totalCount: 0,
      page: 1,
      pageSize: 1,
      totalPages: 0,
    })),
    adminGetPhotos({ limit: 1 }).catch(() => ({
      photos: [],
      nextCursor: null,
      total: 0,
    })),
  ])

  const statCards = [
    { label: "Total RSVPs", value: String(rsvpStats.total) },
    { label: "Confirmed Guests", value: String(rsvpStats.confirmedGuests) },
    { label: "Guestbook Entries", value: String(guestbookResult.totalCount) },
    { label: "Photos", value: String(photosResult.total) },
  ]

  const allNavItems = NAV_GROUPS.flatMap((group) => group.items).filter(
    (item) => !item.superAdminOnly || isSuperAdmin,
  )

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        subtitle="Overview of your wedding website."
      />

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map(({ label, value }) => (
          <Card key={label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-muted-foreground text-sm font-medium">
                {label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick links */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Manage</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {allNavItems.map((item) => {
            const Icon = item.icon
            return (
              <Link key={item.href} href={item.href}>
                <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base font-semibold">
                      <Icon className="h-5 w-5 shrink-0" />
                      {item.label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm">
                      {QUICK_LINK_DESCRIPTIONS[item.href] ?? ""}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
