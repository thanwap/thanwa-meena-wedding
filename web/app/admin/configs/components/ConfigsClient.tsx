"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ConfigForm } from "./ConfigForm"
import { createConfig, deleteConfig, updateConfig } from "../actions"
import type { ConfigDto, ConfigInput } from "../types"

export function ConfigsClient({
  initialConfigs,
}: {
  initialConfigs: ConfigDto[]
}) {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<ConfigDto | null>(null)
  const [deletingCfg, setDeletingCfg] = useState<ConfigDto | null>(null)
  const [isPending, startTransition] = useTransition()

  const onCreate = () => {
    setEditing(null)
    setOpen(true)
  }

  const onEdit = (cfg: ConfigDto) => {
    setEditing(cfg)
    setOpen(true)
  }

  const onSubmit = (input: ConfigInput) => {
    startTransition(async () => {
      try {
        if (editing) {
          await updateConfig(editing.id, input)
          toast.success("Config updated")
        } else {
          await createConfig(input)
          toast.success("Config created")
        }
        setOpen(false)
      } catch (e) {
        toast.error((e as Error).message)
      }
    })
  }

  const onDelete = (cfg: ConfigDto) => setDeletingCfg(cfg)

  const confirmDelete = () => {
    if (!deletingCfg) return
    const cfg = deletingCfg
    setDeletingCfg(null)
    startTransition(async () => {
      try {
        await deleteConfig(cfg.id)
        toast.success("Config deleted")
      } catch (e) {
        toast.error((e as Error).message)
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Configs</h1>
          <p className="text-muted-foreground text-sm">
            Site key/value settings.
          </p>
        </div>
        <Button onClick={onCreate}>New config</Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Key</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="w-[140px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialConfigs.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-muted-foreground text-center"
                >
                  No configs yet.
                </TableCell>
              </TableRow>
            ) : (
              initialConfigs.map((cfg) => (
                <TableRow key={cfg.id}>
                  <TableCell className="font-medium">{cfg.key}</TableCell>
                  <TableCell className="max-w-[320px] truncate">
                    {cfg.value}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{cfg.type}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(cfg)}
                      disabled={isPending}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(cfg)}
                      disabled={isPending}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <ConfigForm
        open={open}
        onOpenChange={setOpen}
        initial={editing}
        onSubmit={onSubmit}
        isPending={isPending}
      />

      <Dialog open={!!deletingCfg} onOpenChange={(o) => !o && setDeletingCfg(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete config?</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-sm">
            <span className="text-foreground font-medium">&ldquo;{deletingCfg?.key}&rdquo;</span> will be permanently removed.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingCfg(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={isPending}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
