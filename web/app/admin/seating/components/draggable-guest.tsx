"use client"

import { useDraggable } from "@dnd-kit/react"
import type { GuestDto } from "../types"

interface DraggableGuestProps {
  guest: GuestDto
  isSelected: boolean
  onToggleSelect: (id: number) => void
  isSuperAdmin?: boolean
}

export function DraggableGuest({
  guest,
  isSelected,
  onToggleSelect,
  isSuperAdmin = false,
}: DraggableGuestProps) {
  const { ref, isDragging } = useDraggable({
    id: `guest-${guest.id}`,
    data: { type: "guest", guest },
    disabled: !isSuperAdmin,
  })

  return (
    <div
      ref={ref}
      className={`flex items-center gap-2 rounded-md border px-2 py-2 text-sm shadow-sm transition-all ${
        isSuperAdmin ? "cursor-grab active:cursor-grabbing" : ""
      } ${isDragging ? "opacity-0" : ""} ${
        isSelected ? "border-blue-400 bg-blue-50" : "border-gray-200 bg-white"
      }`}
    >
      {isSuperAdmin && (
        <button
          onClick={() => onToggleSelect(guest.id)}
          aria-label={isSelected ? "Deselect" : "Select"}
          className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border text-[10px] font-bold transition-colors ${
            isSelected
              ? "border-blue-500 bg-blue-500 text-white"
              : "border-gray-300 text-transparent hover:border-blue-400"
          }`}
        >
          ✓
        </button>
      )}
      <div className="min-w-0">
        <div className="truncate font-medium">{guest.name}</div>
        {guest.name !== guest.rsvpName && (
          <div className="text-muted-foreground truncate text-xs">
            {guest.rsvpName}
          </div>
        )}
      </div>
    </div>
  )
}
