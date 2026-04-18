"use client"

import { memo } from "react"
import { useDroppable } from "@dnd-kit/react"
import { Badge } from "@/components/ui/badge"
import type { WeddingTableDto } from "../types"

interface DroppableTableProps {
  table: WeddingTableDto
  onUnassignGuest: (guestId: number) => void
  onEditTable: (table: WeddingTableDto) => void
  onDeleteTable: (tableId: number) => void
  onClearTable: (tableId: number) => void
  isSuperAdmin?: boolean
}

export const DroppableTable = memo(function DroppableTable({
  table,
  onUnassignGuest,
  onEditTable,
  onDeleteTable,
  onClearTable,
  isSuperAdmin = false,
}: DroppableTableProps) {
  const { ref, isDropTarget } = useDroppable({
    id: `table-${table.id}`,
    data: { type: "table", tableId: table.id },
    disabled: !isSuperAdmin,
  })

  const isFull = table.guests.length >= table.capacity
  const isCircle = table.shape === "circle"

  return (
    <div
      ref={ref}
      className={`flex flex-col items-center justify-start border-2 bg-white shadow-md transition-all duration-150 ${
        isCircle
          ? "h-64 w-64 rounded-full p-6"
          : "h-40 w-80 rounded-lg p-4"
      } ${
        isDropTarget && !isFull
          ? "scale-[1.03] border-blue-500 bg-blue-50 shadow-lg"
          : isDropTarget && isFull
            ? "border-red-400 bg-red-50"
            : "border-gray-300"
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

      <div
        className={`w-full flex-1 space-y-0.5 overflow-y-auto ${
          isCircle ? "px-2 text-center" : ""
        }`}
      >
        {table.guests.map((guest) =>
          isSuperAdmin ? (
            <button
              key={guest.id}
              onClick={() => onUnassignGuest(guest.id)}
              className="text-muted-foreground hover:text-destructive block w-full cursor-pointer truncate text-[11px] transition-colors hover:line-through"
              title={`Click to unassign ${guest.name}`}
            >
              {guest.name}
            </button>
          ) : (
            <div
              key={guest.id}
              className="text-muted-foreground block w-full truncate text-[11px]"
            >
              {guest.name}
            </div>
          ),
        )}
      </div>

      {isSuperAdmin && (
        <div className="mt-1 flex gap-1">
          <button
            onClick={() => onEditTable(table)}
            className="text-muted-foreground hover:text-foreground cursor-pointer text-[10px]"
          >
            Edit
          </button>
          <span className="text-muted-foreground text-[10px]">·</span>
          {table.guests.length > 0 && (
            <>
              <button
                onClick={() => onClearTable(table.id)}
                className="text-muted-foreground hover:text-orange-500 cursor-pointer text-[10px]"
              >
                Clear
              </button>
              <span className="text-muted-foreground text-[10px]">·</span>
            </>
          )}
          <button
            onClick={() => onDeleteTable(table.id)}
            className="text-muted-foreground hover:text-destructive cursor-pointer text-[10px]"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  )
})
