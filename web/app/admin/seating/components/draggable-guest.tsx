"use client"

import { useDraggable } from "@dnd-kit/react"
import type { GuestDto } from "../types"

interface DraggableGuestProps {
  guest: GuestDto
}

export function DraggableGuest({ guest }: DraggableGuestProps) {
  const { ref, isDragging } = useDraggable({
    id: `guest-${guest.id}`,
    data: { type: "guest", guest },
  })

  return (
    <div
      ref={ref}
      className={`cursor-grab rounded-md border bg-white px-3 py-2 text-sm shadow-sm transition-opacity active:cursor-grabbing ${
        isDragging ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="font-medium">{guest.name}</div>
      {guest.name !== guest.rsvpName && (
        <div className="text-muted-foreground text-xs">{guest.rsvpName}</div>
      )}
    </div>
  )
}
