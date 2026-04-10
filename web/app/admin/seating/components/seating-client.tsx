"use client"

import { useState, useTransition, useRef } from "react"
import { DragDropProvider } from "@dnd-kit/react"
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
    if (!source || !target) return

    const sourceData = source.data as
      | { type: string; guest?: GuestDto; tableId?: number }
      | undefined

    if (sourceData?.type === "guest" && sourceData.guest) {
      const guest = sourceData.guest
      const targetId = String(target.id)

      if (targetId.startsWith("table-")) {
        const tableId = Number(targetId.replace("table-", ""))
        const table = tables.find((t) => t.id === tableId)
        if (!table) return

        if (table.guests.length >= table.capacity) {
          toast.error(`${table.name} is at full capacity`)
          return
        }

        // Optimistic update
        const updatedGuest = { ...guest, tableId }
        setUnassigned((prev) => prev.filter((g) => g.id !== guest.id))
        setTables((prev) =>
          prev.map((t) =>
            t.id === tableId
              ? { ...t, guests: [...t.guests, updatedGuest] }
              : t,
          ),
        )

        startTransition(async () => {
          try {
            await updateGuest(guest.id, { tableId })
          } catch {
            // Revert on failure
            setUnassigned((prev) => [...prev, guest])
            setTables((prev) =>
              prev.map((t) =>
                t.id === tableId
                  ? { ...t, guests: t.guests.filter((g) => g.id !== guest.id) }
                  : t,
              ),
            )
            toast.error("Failed to assign guest")
          }
        })
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
          <GuestSidebar guests={unassigned} />
          <SeatingCanvas
            tables={tables}
            onUnassignGuest={handleUnassignGuest}
            onEditTable={setEditingTable}
            onDeleteTable={handleDeleteTable}
          />
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
