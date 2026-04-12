"use client"

import { useState, useTransition, useRef } from "react"
import { DragDropProvider, DragOverlay } from "@dnd-kit/react"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { SeatingToolbar } from "./seating-toolbar"
import { GuestSidebar } from "./guest-sidebar"
import { SeatingCanvas } from "./seating-canvas"
import { EditTableDialog } from "./edit-table-dialog"
import type { SeatingOverviewDto, WeddingTableDto, GuestDto } from "../types"
import {
  createTable,
  updateTable,
  updateTablePosition,
  deleteTable,
  generateAllGuests,
  updateGuest,
  unassignGuest,
} from "../actions"

interface SeatingClientProps {
  initialData: SeatingOverviewDto
}

export function SeatingClient({ initialData }: SeatingClientProps) {
  const [tables, setTables] = useState<WeddingTableDto[]>(initialData.tables)
  const [unassigned, setUnassigned] = useState<GuestDto[]>(
    initialData.unassignedGuests,
  )
  const [selectedGuestIds, setSelectedGuestIds] = useState<Set<number>>(new Set())
  const [editingTable, setEditingTable] = useState<WeddingTableDto | null>(null)
  const [isGenerating, startGenerating] = useTransition()
  const [, startTransition] = useTransition()
  const positionSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingPositions = useRef<Map<number, { x: number; y: number }>>(
    new Map(),
  )

  const totalGuests =
    unassigned.length + tables.reduce((s, t) => s + t.guests.length, 0)
  const assignedGuests = tables.reduce((s, t) => s + t.guests.length, 0)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function handleDragEnd(event: any) {
    if (event.canceled) return

    const { source, target, transform } = event.operation
    if (!source) return

    const sourceData = source.data as
      | { type: string; guest?: GuestDto; tableId?: number }
      | undefined

    if (sourceData?.type === "guest" && sourceData.guest) {
      if (!target) return
      const guest = sourceData.guest
      const targetId = String(target.id)

      if (targetId.startsWith("table-")) {
        const tableId = Number(targetId.replace("table-", ""))
        const table = tables.find((t) => t.id === tableId)
        if (!table) return

        // Multi-select: if dragged guest is selected, move all selected guests
        const guestsToAssign =
          selectedGuestIds.has(guest.id) && selectedGuestIds.size > 1
            ? unassigned.filter((g) => selectedGuestIds.has(g.id))
            : [guest]

        const seatsLeft = table.capacity - table.guests.length
        if (guestsToAssign.length > seatsLeft) {
          toast.error(
            guestsToAssign.length === 1
              ? `${table.name} is at full capacity`
              : `${table.name} only has ${seatsLeft} seat${seatsLeft === 1 ? "" : "s"} left`,
          )
          return
        }

        const assignedIds = new Set(guestsToAssign.map((g) => g.id))
        const updatedGuests = guestsToAssign.map((g) => ({ ...g, tableId }))
        setUnassigned((prev) => prev.filter((g) => !assignedIds.has(g.id)))
        setTables((prev) =>
          prev.map((t) =>
            t.id === tableId
              ? { ...t, guests: [...t.guests, ...updatedGuests] }
              : t,
          ),
        )
        setSelectedGuestIds(new Set())

        for (const g of guestsToAssign) {
          updateGuest(g.id, { tableId }).catch(() => {
            toast.error("Failed to save — please reload")
          })
        }
      }
    }

    if (sourceData?.type === "table-move" && sourceData.tableId) {
      const tableId = sourceData.tableId
      const table = tables.find((t) => t.id === tableId)
      if (!table) return

      const delta = transform as { x: number; y: number }
      const newX = Math.max(0, table.positionX + delta.x)
      const newY = Math.max(0, table.positionY + delta.y)

      setTables((prev) =>
        prev.map((t) =>
          t.id === tableId ? { ...t, positionX: newX, positionY: newY } : t,
        ),
      )

      // Debounced fire-and-forget: collect moves, flush after 400ms of inactivity
      pendingPositions.current.set(tableId, { x: newX, y: newY })
      if (positionSaveTimer.current) clearTimeout(positionSaveTimer.current)
      positionSaveTimer.current = setTimeout(() => {
        const entries = Array.from(pendingPositions.current.entries())
        pendingPositions.current.clear()
        for (const [id, pos] of entries) {
          updateTablePosition(id, pos.x, pos.y).catch(() => {
            toast.error("Failed to save table position")
          })
        }
      }, 400)
    }
  }

  function handleCreateTable(data: {
    name: string
    capacity: number
    shape: string
  }) {
    startTransition(async () => {
      try {
        const newTable = await createTable(data)
        setTables((prev) => [...prev, newTable])
        toast.success(`Created ${data.name}`)
      } catch {
        toast.error("Failed to create table")
      }
    })
  }

  function handleUpdateTable(
    id: number,
    data: { name?: string; capacity?: number; shape?: string },
  ) {
    startTransition(async () => {
      try {
        const updated = await updateTable(id, data)
        setTables((prev) => prev.map((t) => (t.id === id ? updated : t)))
        toast.success("Table updated")
      } catch {
        toast.error("Failed to update table")
      }
    })
  }

  function handleDeleteTable(tableId: number) {
    const table = tables.find((t) => t.id === tableId)
    if (!table) return

    // Move seated guests back to unassigned
    setUnassigned((prev) => [...prev, ...table.guests])
    setTables((prev) => prev.filter((t) => t.id !== tableId))

    startTransition(async () => {
      try {
        await deleteTable(tableId)
        toast.success(`Deleted ${table.name}`)
      } catch {
        // Revert
        setTables((prev) => [...prev, table])
        setUnassigned((prev) =>
          prev.filter((g) => !table.guests.some((tg) => tg.id === g.id)),
        )
        toast.error("Failed to delete table")
      }
    })
  }

  function handleUnassignGuest(guestId: number) {
    let guest: GuestDto | undefined
    let fromTableId: number | undefined

    for (const table of tables) {
      const found = table.guests.find((g) => g.id === guestId)
      if (found) {
        guest = found
        fromTableId = table.id
        break
      }
    }
    if (!guest || fromTableId === undefined) return

    // Optimistic update
    const unassignedGuest = { ...guest, tableId: null }
    setTables((prev) =>
      prev.map((t) =>
        t.id === fromTableId
          ? { ...t, guests: t.guests.filter((g) => g.id !== guestId) }
          : t,
      ),
    )
    setUnassigned((prev) => [...prev, unassignedGuest])

    startTransition(async () => {
      try {
        await unassignGuest(guestId)
      } catch {
        // Revert
        setTables((prev) =>
          prev.map((t) =>
            t.id === fromTableId
              ? { ...t, guests: [...t.guests, guest!] }
              : t,
          ),
        )
        setUnassigned((prev) => prev.filter((g) => g.id !== guestId))
        toast.error("Failed to unassign guest")
      }
    })
  }

  function handleToggleGuestSelect(guestId: number) {
    setSelectedGuestIds((prev) => {
      const next = new Set(prev)
      if (next.has(guestId)) next.delete(guestId)
      else next.add(guestId)
      return next
    })
  }

  function handleGenerateAll() {
    startGenerating(async () => {
      try {
        const guests = await generateAllGuests()
        if (guests.length === 0) {
          toast.info("No new guests to generate")
          return
        }
        setUnassigned((prev) => [...prev, ...guests])
        toast.success(`Generated ${guests.length} guests`)
      } catch {
        toast.error("Failed to generate guests")
      }
    })
  }

  return (
    <div className="-mx-6 -mt-8 flex h-[calc(100svh-65px)] flex-col">
      <SeatingToolbar
        totalGuests={totalGuests}
        assignedGuests={assignedGuests}
        onCreateTable={handleCreateTable}
        onGenerateAll={handleGenerateAll}
        isGenerating={isGenerating}
      />
      <div className="flex flex-1 overflow-hidden">
        <DragDropProvider onDragEnd={handleDragEnd}>
          <GuestSidebar
            guests={unassigned}
            selectedGuestIds={selectedGuestIds}
            onToggleSelect={handleToggleGuestSelect}
          />
          <SeatingCanvas
            tables={tables}
            onUnassignGuest={handleUnassignGuest}
            onEditTable={setEditingTable}
            onDeleteTable={handleDeleteTable}
          />
          <DragOverlay dropAnimation={null}>
            {(source) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const data = source.data as any

              if (data?.type === "guest" && data.guest) {
                const guest = data.guest as GuestDto
                const isMulti = selectedGuestIds.has(guest.id) && selectedGuestIds.size > 1

                if (isMulti) {
                  return (
                    <div className="pointer-events-none cursor-grabbing rounded-md border border-blue-400 bg-blue-50 px-3 py-2 text-sm shadow-xl ring-1 ring-blue-300 rotate-2">
                      <div className="font-semibold text-blue-700">
                        {selectedGuestIds.size} guests
                      </div>
                      <div className="text-blue-500 text-xs truncate max-w-[160px]">
                        {guest.name}{selectedGuestIds.size > 1 ? ` +${selectedGuestIds.size - 1} more` : ""}
                      </div>
                    </div>
                  )
                }

                return (
                  <div className="cursor-grabbing rounded-md border bg-white px-3 py-2 text-sm shadow-xl ring-1 ring-blue-300 rotate-2 pointer-events-none">
                    <div className="font-medium">{guest.name}</div>
                    {guest.name !== guest.rsvpName && (
                      <div className="text-muted-foreground text-xs">{guest.rsvpName}</div>
                    )}
                  </div>
                )
              }

              if (data?.type === "table-move" && data.tableId) {
                const table = tables.find((t) => t.id === data.tableId)
                if (!table) return null
                const isFull = table.guests.length >= table.capacity
                const isCircle = table.shape === "circle"
                return (
                  <div
                    className={`pointer-events-none flex cursor-grabbing flex-col items-center justify-start border-2 border-gray-400 bg-white shadow-2xl rotate-1 ${
                      isCircle
                        ? "h-64 w-64 rounded-full p-6"
                        : "h-40 w-80 rounded-lg p-4"
                    }`}
                  >
                    <div className="mb-1 flex w-full items-center justify-center gap-1">
                      <span className="truncate text-xs font-semibold">{table.name}</span>
                      <Badge
                        variant={isFull ? "destructive" : "secondary"}
                        className="ml-1 text-[10px]"
                      >
                        {table.guests.length}/{table.capacity}
                      </Badge>
                    </div>
                    <div className={`w-full flex-1 space-y-0.5 overflow-y-auto ${isCircle ? "px-2 text-center" : ""}`}>
                      {table.guests.map((guest) => (
                        <div
                          key={guest.id}
                          className="text-muted-foreground block w-full truncate text-[11px]"
                        >
                          {guest.name}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              }

              return null
            }}
          </DragOverlay>
        </DragDropProvider>
      </div>
      <EditTableDialog
        table={editingTable}
        onClose={() => setEditingTable(null)}
        onUpdateTable={handleUpdateTable}
      />
    </div>
  )
}
