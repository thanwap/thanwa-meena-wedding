"use client"

import { DraggableTable } from "./draggable-table"
import type { WeddingTableDto } from "../types"

interface SeatingCanvasProps {
  tables: WeddingTableDto[]
  onUnassignGuest: (guestId: number) => void
  onEditTable: (table: WeddingTableDto) => void
  onDeleteTable: (tableId: number) => void
}

export function SeatingCanvas({
  tables,
  onUnassignGuest,
  onEditTable,
  onDeleteTable,
}: SeatingCanvasProps) {
  return (
    <div
      className="relative flex-1 overflow-auto"
      style={{
        backgroundImage:
          "radial-gradient(circle, #ddd 1px, transparent 1px)",
        backgroundSize: "24px 24px",
      }}
    >
      {/* Large inner canvas — creates the scrollable area in both directions */}
      <div style={{ width: 3200, height: 2400, position: "relative" }}>
        {tables.map((table) => (
          <DraggableTable
            key={table.id}
            table={table}
            onUnassignGuest={onUnassignGuest}
            onEditTable={onEditTable}
            onDeleteTable={onDeleteTable}
          />
        ))}
        {tables.length === 0 && (
          <div className="text-muted-foreground flex h-full items-center justify-center">
            <p className="text-sm">Click &quot;Add Table&quot; to get started</p>
          </div>
        )}
      </div>
    </div>
  )
}
