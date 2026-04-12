"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { updateRsvpStatus, deleteRsvp, createRsvp } from "./actions"
import type { RsvpDto, RsvpStatsDto, RsvpStatus } from "./actions"

// ── Status helpers ──────────────────────────────────────────────────────────

const STATUS_VARIANT: Record<
  RsvpStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  pending: "secondary",
  confirmed: "default",
  cancelled: "destructive",
}

const STATUS_LABELS: Record<RsvpStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
}

// ── Stats bar ───────────────────────────────────────────────────────────────

function StatsBar({ stats }: { stats: RsvpStatsDto }) {
  const cards = [
    { label: "Total RSVPs", value: stats.total },
    { label: "Attending", value: stats.attending },
    { label: "Declining", value: stats.declining },
    { label: "Total Guests", value: stats.totalGuests },
  ]
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {cards.map(({ label, value }) => (
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
  )
}

// ── Detail dialog ───────────────────────────────────────────────────────────

function DetailDialog({
  rsvp,
  open,
  onOpenChange,
}: {
  rsvp: RsvpDto | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  if (!rsvp) return null
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{rsvp.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <Row label="Attending" value={rsvp.attending ? "Yes" : "No"} />
          <Row label="Guests" value={String(rsvp.guestCount)} />
          <Row label="Dietary" value={rsvp.dietary ?? "—"} />
          <Row label="Status">
            <Badge variant={STATUS_VARIANT[rsvp.status]}>
              {STATUS_LABELS[rsvp.status]}
            </Badge>
          </Row>
          <Row label="Message" value={rsvp.message ?? "—"} />
          <Row
            label="Submitted"
            value={new Date(rsvp.createdAt).toLocaleString()}
          />
          <Row
            label="Updated"
            value={new Date(rsvp.updatedAt).toLocaleString()}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}

function Row({
  label,
  value,
  children,
}: {
  label: string
  value?: string
  children?: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-muted-foreground w-24 shrink-0">{label}</span>
      <span className="font-medium">{children ?? value}</span>
    </div>
  )
}

// ── Add Guest dialog ────────────────────────────────────────────────────────

const EMPTY_FORM = {
  name: "",
  attending: "true",
  guestCount: "1",
  dietary: "",
  message: "",
  status: "confirmed",
}

function AddGuestDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (rsvp: RsvpDto) => void
}) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [isPending, startTransition] = useTransition()

  function set(field: keyof typeof EMPTY_FORM, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleSubmit() {
    if (!form.name.trim()) {
      toast.error("Name is required.")
      return
    }
    const guestCount = parseInt(form.guestCount, 10)
    if (isNaN(guestCount) || guestCount < 1 || guestCount > 10) {
      toast.error("Guest count must be between 1 and 10.")
      return
    }
    startTransition(async () => {
      try {
        const created = await createRsvp({
          name: form.name.trim(),
          attending: form.attending === "true",
          guestCount,
          dietary: form.dietary.trim() || undefined,
          message: form.message.trim() || undefined,
          status: form.status as RsvpStatus,
        })
        onCreated(created)
        setForm(EMPTY_FORM)
        onOpenChange(false)
        toast.success(`RSVP for "${created.name}" added.`)
      } catch (e) {
        toast.error((e as Error).message)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Guest</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="ag-name">Name *</Label>
            <Input
              id="ag-name"
              placeholder="Full name"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="ag-attending">Attending</Label>
              <Select value={form.attending} onValueChange={(v) => v && set("attending", v)}>
                <SelectTrigger id="ag-attending">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Yes</SelectItem>
                  <SelectItem value="false">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ag-guests">Guests</Label>
              <Input
                id="ag-guests"
                type="number"
                min={1}
                max={10}
                value={form.guestCount}
                onChange={(e) => set("guestCount", e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ag-status">Status</Label>
            <Select value={form.status} onValueChange={(v) => v && set("status", v)}>
              <SelectTrigger id="ag-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ag-dietary">Dietary restrictions</Label>
            <Input
              id="ag-dietary"
              placeholder="Optional"
              value={form.dietary}
              onChange={(e) => set("dietary", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ag-message">Message</Label>
            <Input
              id="ag-message"
              placeholder="Optional"
              value={form.message}
              onChange={(e) => set("message", e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? "Adding…" : "Add Guest"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Main client component ───────────────────────────────────────────────────

type FilterStatus = "all" | RsvpStatus

export function RsvpsClient({
  initialStats,
  initialRsvps,
}: {
  initialStats: RsvpStatsDto
  initialRsvps: RsvpDto[]
}) {
  const [rsvps, setRsvps] = useState<RsvpDto[]>(initialRsvps)
  const [stats, setStats] = useState<RsvpStatsDto>(initialStats)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all")
  const [detailRsvp, setDetailRsvp] = useState<RsvpDto | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [deletingRsvp, setDeletingRsvp] = useState<{ id: number; name: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  // ── Derived filtered list ─────────────────────────────────────────────────
  const filtered = rsvps.filter((r) => {
    const matchesSearch = r.name
      .toLowerCase()
      .includes(search.toLowerCase().trim())
    const matchesStatus = statusFilter === "all" || r.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // ── Actions ───────────────────────────────────────────────────────────────
  function handleStatusChange(id: number, status: RsvpStatus) {
    startTransition(async () => {
      try {
        await updateRsvpStatus(id, status)
        setRsvps((prev) =>
          prev.map((r) =>
            r.id === id ? { ...r, status, updatedAt: new Date().toISOString() } : r,
          ),
        )
        // Recompute stats locally (simple approach — server revalidation handles the next load)
        toast.success(`Status updated to ${STATUS_LABELS[status]}`)
      } catch (e) {
        toast.error((e as Error).message)
      }
    })
  }

  function handleDelete(id: number, name: string) {
    setDeletingRsvp({ id, name })
  }

  function confirmDelete() {
    if (!deletingRsvp) return
    const { id } = deletingRsvp
    setDeletingRsvp(null)
    startTransition(async () => {
      try {
        await deleteRsvp(id)
        setRsvps((prev) => prev.filter((r) => r.id !== id))
        setStats((prev) => ({ ...prev, total: Math.max(0, prev.total - 1) }))
        toast.success("RSVP deleted")
      } catch (e) {
        toast.error((e as Error).message)
      }
    })
  }

  function handleGuestCreated(rsvp: RsvpDto) {
    setRsvps((prev) => [rsvp, ...prev])
    setStats((prev) => ({
      ...prev,
      total: prev.total + 1,
      attending: rsvp.attending ? prev.attending + 1 : prev.attending,
      declining: rsvp.attending ? prev.declining : prev.declining + 1,
      totalGuests: rsvp.attending ? prev.totalGuests + rsvp.guestCount : prev.totalGuests,
      pending: rsvp.status === "pending" ? prev.pending + 1 : prev.pending,
      confirmed: rsvp.status === "confirmed" ? prev.confirmed + 1 : prev.confirmed,
      cancelled: rsvp.status === "cancelled" ? prev.cancelled + 1 : prev.cancelled,
    }))
  }

  function handleViewDetail(rsvp: RsvpDto) {
    setDetailRsvp(rsvp)
    setDetailOpen(true)
  }

  // ── CSV export ────────────────────────────────────────────────────────────
  async function handleExportCsv() {
    try {
      // Hits the Next.js proxy route — bearer token injected server-side
      const res = await fetch("/api/admin/rsvps/export.csv")
      if (!res.ok) {
        toast.error(`Export failed (${res.status})`)
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "rsvps.csv"
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      toast.error((e as Error).message)
    }
  }

  // ── Status filter chips ────────────────────────────────────────────────────
  const filterOptions: { value: FilterStatus; label: string; count?: number }[] =
    [
      { value: "all", label: "All", count: rsvps.length },
      { value: "pending", label: "Pending", count: stats.pending },
      { value: "confirmed", label: "Confirmed", count: stats.confirmed },
      { value: "cancelled", label: "Cancelled", count: stats.cancelled },
    ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">RSVPs</h1>
          <p className="text-muted-foreground text-sm">
            Manage guest responses and attendance.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setAddOpen(true)}>Add Guest</Button>
          <Button variant="outline" onClick={handleExportCsv}>
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats */}
      <StatsBar stats={stats} />

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          placeholder="Search by name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <div className="flex gap-2 flex-wrap">
          {filterOptions.map(({ value, label, count }) => (
            <button
              key={value}
              onClick={() => setStatusFilter(value)}
              className="inline-flex cursor-pointer items-center gap-1"
            >
              <Badge
                variant={statusFilter === value ? "default" : "outline"}
                className="cursor-pointer"
              >
                {label}
                {count !== undefined && (
                  <span className="ml-1 opacity-70">({count})</span>
                )}
              </Badge>
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Attending</TableHead>
              <TableHead>Guests</TableHead>
              <TableHead>Dietary</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead className="w-[60px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-muted-foreground text-center"
                >
                  No RSVPs found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((rsvp) => (
                <TableRow key={rsvp.id}>
                  <TableCell className="font-medium">{rsvp.name}</TableCell>
                  <TableCell>{rsvp.attending ? "Yes" : "No"}</TableCell>
                  <TableCell>{rsvp.guestCount}</TableCell>
                  <TableCell className="max-w-[160px] truncate">
                    {rsvp.dietary ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[rsvp.status]}>
                      {STATUS_LABELS[rsvp.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(rsvp.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        disabled={isPending}
                        aria-label="Row actions"
                        className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
                      >
                        ⋯
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleViewDetail(rsvp)}
                        >
                          View details
                        </DropdownMenuItem>
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger>
                            Change status
                          </DropdownMenuSubTrigger>
                          <DropdownMenuSubContent>
                            {(
                              [
                                "pending",
                                "confirmed",
                                "cancelled",
                              ] as RsvpStatus[]
                            ).map((s) => (
                              <DropdownMenuItem
                                key={s}
                                onClick={() =>
                                  handleStatusChange(rsvp.id, s)
                                }
                                disabled={rsvp.status === s}
                              >
                                {STATUS_LABELS[s]}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => handleDelete(rsvp.id, rsvp.name)}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Detail dialog */}
      <DetailDialog
        rsvp={detailRsvp}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />

      {/* Add Guest dialog */}
      <AddGuestDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onCreated={handleGuestCreated}
      />

      {/* Delete confirm dialog */}
      <Dialog open={!!deletingRsvp} onOpenChange={(o) => !o && setDeletingRsvp(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete RSVP?</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-sm">
            RSVP from{" "}
            <span className="text-foreground font-medium">&ldquo;{deletingRsvp?.name}&rdquo;</span>{" "}
            will be permanently removed.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingRsvp(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={isPending}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
