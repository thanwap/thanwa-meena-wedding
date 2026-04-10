"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { WeddingTableDto } from "../types"

interface EditTableDialogProps {
  table: WeddingTableDto | null
  onClose: () => void
  onUpdateTable: (
    id: number,
    data: { name?: string; capacity?: number; shape?: string },
  ) => void
}

export function EditTableDialog({
  table,
  onClose,
  onUpdateTable,
}: EditTableDialogProps) {
  return (
    <Dialog open={table !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Table</DialogTitle>
        </DialogHeader>
        {table && (
          <EditTableForm
            key={table.id}
            table={table}
            onSubmit={(data) => {
              onUpdateTable(table.id, data)
              onClose()
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function EditTableForm({
  table,
  onSubmit,
}: {
  table: WeddingTableDto
  onSubmit: (data: { name: string; capacity: number; shape: string }) => void
}) {
  const [name, setName] = useState(table.name)
  const [capacity, setCapacity] = useState(String(table.capacity))
  const [shape, setShape] = useState(table.shape)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    onSubmit({ name: name.trim(), capacity: Number(capacity), shape })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="edit-table-name">Table Name</Label>
        <Input
          id="edit-table-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="edit-table-capacity">Capacity</Label>
        <Input
          id="edit-table-capacity"
          type="number"
          min={1}
          max={50}
          value={capacity}
          onChange={(e) => setCapacity(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="edit-table-shape">Shape</Label>
        <Select value={shape} onValueChange={(v) => v && setShape(v)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="circle">Circle</SelectItem>
            <SelectItem value="rectangle">Rectangle (Head Table)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" className="w-full">
        Save
      </Button>
    </form>
  )
}
