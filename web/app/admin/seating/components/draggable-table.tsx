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
}

export const DraggableTable = memo(function DraggableTable({
  table,
  onUnassignGuest,
  onEditTable,
  onDeleteTable,
  onClearTable,
}: DraggableTableProps) {
  const { ref, isDragging } = useDraggable({
    id: `move-table-${table.id}`,
    data: { type: "table-move", tableId: table.id },
  })

  return (
    <div
      ref={ref}
      style={{
        position: "absolute",
        left: table.positionX,
        top: table.positionY,
        cursor: "grab",
        opacity: isDragging ? 0.5 : 1,
      }}
    >
      <DroppableTable
        table={table}
        onUnassignGuest={onUnassignGuest}
        onEditTable={onEditTable}
        onDeleteTable={onDeleteTable}
        onClearTable={onClearTable}
      />
    </div>
  )
})
