"use client"

import { useState, useTransition, useMemo } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { CreateTableDialog } from "../components/create-table-dialog"
import {
  createTable,
  deleteTable,
  unassignGuest,
  updateGuest,
  getSeatingOverview,
} from "../actions"
import type { SeatingOverviewDto, WeddingTableDto, GuestDto } from "../types"

interface SeatingManageClientProps {
  initialData: SeatingOverviewDto
  isSuperAdmin?: boolean
}

export function SeatingManageClient({ initialData, isSuperAdmin = false }: SeatingManageClientProps) {
  const [data, setData] = useState(initialData)
  const [tableSearch, setTableSearch] = useState("")
  const [guestSearch, setGuestSearch] = useState("")
  const [isPending, startTransition] = useTransition()
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null)
  const [addGuestTableId, setAddGuestTableId] = useState<number | null>(null)
  const [addGuestSearch, setAddGuestSearch] = useState("")

  function refresh() {
    startTransition(async () => {
      try {
        const updated = await getSeatingOverview()
        setData(updated)
      } catch (e) {
        toast.error((e as Error).message)
      }
    })
  }

  function handleCreateTable(tableData: {
    name: string
    capacity: number
    shape: string
  }) {
    startTransition(async () => {
      try {
        await createTable(tableData)
        toast.success(`Table "${tableData.name}" created.`)
        refresh()
      } catch (e) {
        toast.error((e as Error).message)
      }
    })
  }

  function handleDeleteTable(table: WeddingTableDto) {
    startTransition(async () => {
      try {
        await deleteTable(table.id)
        toast.success(`Table "${table.name}" deleted.`)
        setDeleteConfirmId(null)
        refresh()
      } catch (e) {
        toast.error((e as Error).message)
      }
    })
  }

  function handleUnassignGuest(guestId: number, guestName: string) {
    startTransition(async () => {
      try {
        await unassignGuest(guestId)
        toast.success(`"${guestName}" removed from table.`)
        refresh()
      } catch (e) {
        toast.error((e as Error).message)
      }
    })
  }

  function handleAssignGuest(guest: GuestDto, tableId: number) {
    startTransition(async () => {
      try {
        await updateGuest(guest.id, { tableId })
        toast.success(`"${guest.name}" added to table.`)
        refresh()
      } catch (e) {
        toast.error((e as Error).message)
      }
    })
  }

  const filteredUnassignedGuests = useMemo(() => {
    const search = addGuestSearch.toLowerCase().trim()
    const guests = [...data.unassignedGuests].sort((a, b) =>
      a.name.localeCompare(b.name, "th"),
    )
    if (!search) return guests
    return guests.filter(
      (g) =>
        g.name.toLowerCase().includes(search) ||
        g.rsvpName.toLowerCase().includes(search),
    )
  }, [data.unassignedGuests, addGuestSearch])

  const filteredTables = useMemo(() => {
    const tSearch = tableSearch.toLowerCase().trim()
    const gSearch = guestSearch.toLowerCase().trim()

    let tables = [...data.tables].sort((a, b) =>
      a.name.localeCompare(b.name, "th"),
    )

    if (tSearch) {
      tables = tables.filter((t) => t.name.toLowerCase().includes(tSearch))
    }

    if (gSearch) {
      tables = tables.filter((t) =>
        t.guests.some((g) => g.name.toLowerCase().includes(gSearch)),
      )
    }

    return tables.map((t) => ({
      ...t,
      guests: [...t.guests].sort((a, b) => a.name.localeCompare(b.name, "th")),
    }))
  }, [data.tables, tableSearch, guestSearch])

  const gSearchLower = guestSearch.toLowerCase().trim()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Seating Management</h1>
        {isSuperAdmin && <CreateTableDialog onCreateTable={handleCreateTable} />}
      </div>

      <div className="flex gap-4">
        <Input
          placeholder="Search tables..."
          value={tableSearch}
          onChange={(e) => setTableSearch(e.target.value)}
          className="max-w-xs"
        />
        <Input
          placeholder="Search guests..."
          value={guestSearch}
          onChange={(e) => setGuestSearch(e.target.value)}
          className="max-w-xs"
        />
      </div>

      {filteredTables.length === 0 && (
        <p className="text-muted-foreground py-8 text-center">
          {data.tables.length === 0
            ? "No tables yet. Click \"Add Table\" to create one."
            : "No tables match your search."}
        </p>
      )}

      {filteredTables.map((table) => (
        <Card key={table.id}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="text-lg">{table.name}</CardTitle>
                <div className="text-muted-foreground flex items-center gap-3 text-sm">
                  <span>Capacity: {table.capacity}</span>
                  <Badge variant="outline">{table.shape}</Badge>
                  <span>
                    Position: ({Math.round(table.positionX)},{" "}
                    {Math.round(table.positionY)})
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={table.guests.length >= table.capacity ? "destructive" : "secondary"}>
                  {table.guests.length}/{table.capacity} guests
                </Badge>
                {isSuperAdmin && (
                  <>
                    <Dialog
                      open={addGuestTableId === table.id}
                      onOpenChange={(open) => {
                        setAddGuestTableId(open ? table.id : null)
                        if (!open) setAddGuestSearch("")
                      }}
                    >
                      <DialogTrigger render={
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={table.guests.length >= table.capacity}
                        />
                      }>
                        Add Guest
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Add Guest to {table.name}</DialogTitle>
                        </DialogHeader>
                        <Input
                          placeholder="Search unassigned guests..."
                          value={addGuestSearch}
                          onChange={(e) => setAddGuestSearch(e.target.value)}
                          autoFocus
                        />
                        {filteredUnassignedGuests.length === 0 ? (
                          <p className="text-muted-foreground py-4 text-center text-sm">
                            {data.unassignedGuests.length === 0
                              ? "No unassigned guests available."
                              : "No guests match your search."}
                          </p>
                        ) : (
                          <div className="max-h-64 overflow-y-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Guest Name</TableHead>
                                  <TableHead>RSVP Name</TableHead>
                                  <TableHead className="w-20 text-right">Action</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {filteredUnassignedGuests.map((guest) => (
                                  <TableRow key={guest.id}>
                                    <TableCell>{guest.name}</TableCell>
                                    <TableCell className="text-muted-foreground">
                                      {guest.rsvpName}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={isPending}
                                        onClick={() =>
                                          handleAssignGuest(guest, table.id)
                                        }
                                      >
                                        Add
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                    <Dialog
                      open={deleteConfirmId === table.id}
                      onOpenChange={(open) =>
                        setDeleteConfirmId(open ? table.id : null)
                      }
                    >
                      <DialogTrigger render={
                        <Button variant="destructive" size="sm" />
                      }>
                        Delete
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Delete Table</DialogTitle>
                        </DialogHeader>
                        <p className="text-muted-foreground text-sm">
                          Are you sure you want to delete &quot;{table.name}&quot;?
                          {table.guests.length > 0 &&
                            ` ${table.guests.length} guest(s) will be unassigned.`}
                        </p>
                        <div className="flex justify-end gap-2 pt-4">
                          <Button
                            variant="outline"
                            onClick={() => setDeleteConfirmId(null)}
                          >
                            Cancel
                          </Button>
                          <Button
                            variant="destructive"
                            disabled={isPending}
                            onClick={() => handleDeleteTable(table)}
                          >
                            Delete
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {table.guests.length === 0 ? (
              <p className="text-muted-foreground text-sm italic">
                No guests assigned
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Guest Name</TableHead>
                    <TableHead>RSVP Name</TableHead>
                    {isSuperAdmin && (
                      <TableHead className="w-24 text-right">Action</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {table.guests.map((guest) => {
                    const isHighlighted =
                      gSearchLower &&
                      guest.name.toLowerCase().includes(gSearchLower)
                    return (
                      <TableRow
                        key={guest.id}
                        className={isHighlighted ? "bg-yellow-50 dark:bg-yellow-950" : ""}
                      >
                        <TableCell>{guest.name}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {guest.rsvpName}
                        </TableCell>
                        {isSuperAdmin && (
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={isPending}
                              onClick={() =>
                                handleUnassignGuest(guest.id, guest.name)
                              }
                            >
                              Remove
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
