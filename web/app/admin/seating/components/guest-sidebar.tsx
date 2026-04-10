"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { DraggableGuest } from "./draggable-guest"
import type { GuestDto } from "../types"

interface GuestSidebarProps {
  guests: GuestDto[]
}

export function GuestSidebar({ guests }: GuestSidebarProps) {
  const [search, setSearch] = useState("")

  const filtered = search
    ? guests.filter((g) =>
        g.name.toLowerCase().includes(search.toLowerCase()),
      )
    : guests

  return (
    <div className="flex h-full w-72 flex-shrink-0 flex-col border-r bg-gray-50">
      <div className="border-b p-3">
        <h3 className="mb-2 text-sm font-semibold">
          Unassigned ({guests.length})
        </h3>
        <Input
          placeholder="Search guests..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8 text-sm"
        />
      </div>
      <div className="flex-1 space-y-1 overflow-y-auto p-3">
        {filtered.length === 0 && (
          <p className="text-muted-foreground py-4 text-center text-xs">
            {guests.length === 0
              ? "No guests generated yet"
              : "No matches found"}
          </p>
        )}
        {filtered.map((guest) => (
          <DraggableGuest key={guest.id} guest={guest} />
        ))}
      </div>
    </div>
  )
}
