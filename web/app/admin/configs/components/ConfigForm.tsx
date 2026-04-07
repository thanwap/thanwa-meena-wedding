"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { ConfigDto, ConfigInput } from "../types"

const TYPES = ["string", "number", "boolean", "json"] as const

export function ConfigForm({
  open,
  onOpenChange,
  initial,
  onSubmit,
  isPending,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  initial: ConfigDto | null
  onSubmit: (input: ConfigInput) => void
  isPending: boolean
}) {
  const [key, setKey] = useState("")
  const [value, setValue] = useState("")
  const [type, setType] = useState<string>("string")

  useEffect(() => {
    if (open) {
      setKey(initial?.key ?? "")
      setValue(initial?.value ?? "")
      setType(initial?.type ?? "string")
    }
  }, [open, initial])

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({ key, value, type })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={submit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>
              {initial ? "Edit config" : "New config"}
            </DialogTitle>
            <DialogDescription>
              Key/value setting stored in the admin API.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="key">Key</Label>
            <Input
              id="key"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="value">Value</Label>
            <Input
              id="value"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select value={type} onValueChange={(v) => v && setType(v)}>
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
