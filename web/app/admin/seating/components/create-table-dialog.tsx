"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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

interface CreateTableDialogProps {
  onCreateTable: (data: {
    name: string
    capacity: number
    shape: string
  }) => void
}

export function CreateTableDialog({ onCreateTable }: CreateTableDialogProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [capacity, setCapacity] = useState("10")
  const [shape, setShape] = useState("circle")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    onCreateTable({ name: name.trim(), capacity: Number(capacity), shape })
    setName("")
    setCapacity("10")
    setShape("circle")
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>
        Add Table
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Table</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="table-name">Table Name</Label>
            <Input
              id="table-name"
              placeholder="e.g. โต๊ะเพื่อนเจ้าสาว"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="table-capacity">Capacity</Label>
            <Input
              id="table-capacity"
              type="number"
              min={1}
              max={50}
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="table-shape">Shape</Label>
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
            Create
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
