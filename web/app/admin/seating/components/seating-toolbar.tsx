"use client"

import { Badge } from "@/components/ui/badge"
import { CreateTableDialog } from "./create-table-dialog"

interface SeatingToolbarProps {
  totalGuests: number
  assignedGuests: number
  onCreateTable: (data: {
    name: string
    capacity: number
    shape: string
  }) => void
  isSuperAdmin?: boolean
}

export function SeatingToolbar({
  totalGuests,
  assignedGuests,
  onCreateTable,
  isSuperAdmin = false,
}: SeatingToolbarProps) {
  return (
    <div className="flex items-center justify-between border-b px-4 py-3">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold">Seating Chart</h2>
        <Badge variant="outline">
          {assignedGuests}/{totalGuests} assigned
        </Badge>
      </div>
      {isSuperAdmin && (
        <div className="flex items-center gap-2">
          <CreateTableDialog onCreateTable={onCreateTable} />
        </div>
      )}
    </div>
  )
}
