"use client"

import { memo } from "react"
import { useDraggable } from "@dnd-kit/react"
import { DroppableTable } from "./droppable-table"
import type { WeddingTableDto } from "../types"

interface DraggableTableProps {
  table: WeddingTableDto
  onUnassignGuest: (guestId: number) => void
  onEditTable: (table: WeddingTableDto) => void
  onDeleteTable: (tableId: number) => void
  onClearTable: (tableId: number) => void
  isSuperAdmin?: boolean
}

export const DraggableTable = memo(function DraggableTable({
  table,
  onUnassignGuest,
  onEditTable,
  onDeleteTable,
  onClearTable,
  isSuperAdmin = false,
}: DraggableTableProps) {
  const { ref, isDragging } = useDraggable({
    id: `move-table-${table.id}`,
    data: { type: "table-move", tableId: table.id },
    disabled: !isSuperAdmin,
  })

  return (
    <div
      ref={ref}
      style={{
        position: "absolute",
        left: table.positionX,
        top: table.positionY,
        cursor: isSuperAdmin ? "grab" : "default",
        opacity: isDragging ? 0.5 : 1,
      }}
    >
      <DroppableTable
        table={table}
        onUnassignGuest={onUnassignGuest}
        onEditTable={onEditTable}
        onDeleteTable={onDeleteTable}
        onClearTable={onClearTable}
        isSuperAdmin={isSuperAdmin}
      />
    </div>
  )
})
