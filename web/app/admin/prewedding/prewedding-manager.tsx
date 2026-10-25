"use client"

import { useRef, useState } from "react"
import { DragDropProvider } from "@dnd-kit/react"
import { useSortable, isSortable } from "@dnd-kit/react/sortable"
import {
  RiUploadCloud2Line,
  RiDraggable,
  RiPencilLine,
  RiDeleteBinLine,
  RiCheckLine,
  RiErrorWarningLine,
  RiLoader4Line,
} from "@remixicon/react"
import { toast } from "sonner"
import { PageHeader } from "@/components/admin/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogFooter,
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
import { TILE_SIZES, type PreweddingPhoto, type TileSize } from "@/lib/prewedding"
import { ACCEPT_ATTR, isAcceptedImage, prepareForUpload } from "@/lib/prewedding-upload"
import {
  adminDeletePreweddingPhoto,
  adminReorderPreweddingPhotos,
  adminUpdatePreweddingPhoto,
  adminUploadPreweddingPhoto,
} from "./actions"

type UploadStatus = "waiting" | "optimising" | "uploading" | "done" | "error"

interface UploadItem {
  key: string
  name: string
  status: UploadStatus
  error?: string
}

const STATUS_LABEL: Record<UploadStatus, string> = {
  waiting: "Waiting",
  optimising: "Optimising…",
  uploading: "Uploading…",
  done: "Done",
  error: "Failed",
}

export function PreweddingManager({ initialPhotos }: { initialPhotos: PreweddingPhoto[] }) {
  const [photos, setPhotos] = useState(initialPhotos)
  const [queue, setQueue] = useState<UploadItem[]>([])
  const [dragOver, setDragOver] = useState(false)
  const [editing, setEditing] = useState<PreweddingPhoto | null>(null)
  const [deleting, setDeleting] = useState<PreweddingPhoto | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const uploadingRef = useRef(false)
  const pendingRef = useRef<{ key: string; file: File }[]>([])

  const setItem = (key: string, patch: Partial<UploadItem>) =>
    setQueue((q) => q.map((item) => (item.key === key ? { ...item, ...patch } : item)))

  /* Uploads run one at a time so each request stays under the body limit */
  async function drain() {
    if (uploadingRef.current) return
    uploadingRef.current = true
    let next
    while ((next = pendingRef.current.shift())) {
      const { key, file } = next
      try {
        setItem(key, { status: "optimising" })
        const blob = await prepareForUpload(file)

        setItem(key, { status: "uploading" })
        const form = new FormData()
        form.append("file", blob, file.name)
        const result = await adminUploadPreweddingPhoto(form)

        if (result.success) {
          setItem(key, { status: "done" })
          setPhotos((p) => [...p, result.data])
        } else {
          setItem(key, { status: "error", error: result.error })
        }
      } catch (err) {
        setItem(key, { status: "error", error: err instanceof Error ? err.message : String(err) })
      }
    }
    uploadingRef.current = false
  }

  function addFiles(files: FileList | File[]) {
    const all = Array.from(files)
    const accepted = all.filter(isAcceptedImage)
    const rejected = all.length - accepted.length
    if (rejected > 0) toast.error(`Skipped ${rejected} file(s) — only JPG and PNG are supported`)
    if (accepted.length === 0) return

    const items = accepted.map((file) => ({ key: crypto.randomUUID(), file }))
    pendingRef.current.push(...items)
    setQueue((q) => [
      ...q.filter((item) => item.status !== "done"),
      ...items.map(({ key, file }) => ({ key, name: file.name, status: "waiting" as const })),
    ])
    drain()
  }

  async function handleReorder(from: number, to: number) {
    if (from === to) return
    const previous = photos
    const next = [...photos]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    setPhotos(next)

    const result = await adminReorderPreweddingPhotos(next.map((p) => p.id))
    if (!result.success) {
      setPhotos(previous)
      toast.error(result.error)
    }
  }

  async function handleDelete(photo: PreweddingPhoto) {
    setDeleting(null)
    const result = await adminDeletePreweddingPhoto(photo.id)
    if (result.success) {
      setPhotos((p) => p.filter((x) => x.id !== photo.id))
      toast.success("Photo deleted")
    } else {
      toast.error(result.error)
    }
  }

  const busy = queue.some((item) => item.status !== "done" && item.status !== "error")

  return (
    <div>
      <PageHeader
        title="Pre-wedding Gallery"
        subtitle={`${photos.length} ${photos.length === 1 ? "photo" : "photos"} · shown on the landing page in this order`}
      >
        <Button onClick={() => inputRef.current?.click()}>
          <RiUploadCloud2Line className="size-4" />
          Upload photos
        </Button>
      </PageHeader>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_ATTR}
        multiple
        hidden
        onChange={(e) => {
          if (e.target.files) addFiles(e.target.files)
          e.target.value = ""
        }}
      />

      {/* Drop zone */}
      <Card
        className={`mb-6 border-2 border-dashed transition-colors ${dragOver ? "border-primary bg-muted/50" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          addFiles(e.dataTransfer.files)
        }}
      >
        <CardContent className="flex flex-col items-center gap-2 py-8 text-center">
          <RiUploadCloud2Line className="size-8 text-muted-foreground" />
          <p className="text-sm font-medium">Drop JPG or PNG photos here</p>
          <p className="text-xs text-muted-foreground">
            Converted to WebP automatically (full 2400px + thumbnail 900px), EXIF/GPS removed
          </p>
        </CardContent>
      </Card>

      {/* Upload queue */}
      {queue.length > 0 && (
        <Card className="mb-6">
          <CardContent className="divide-y py-0">
            {queue.map((item) => (
              <div key={item.key} className="flex items-center gap-3 py-2.5 text-sm">
                <StatusIcon status={item.status} />
                <span className="min-w-0 flex-1 truncate">{item.name}</span>
                <span className={item.status === "error" ? "text-destructive text-xs" : "text-muted-foreground text-xs"}>
                  {item.status === "error" ? item.error : STATUS_LABEL[item.status]}
                </span>
              </div>
            ))}
          </CardContent>
          {!busy && (
            <div className="flex justify-end px-4 pb-3">
              <Button variant="ghost" size="sm" onClick={() => setQueue([])}>
                Clear
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* Sortable grid */}
      {photos.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No photos yet — the Pre-wedding section is hidden on the landing page until you upload some.
        </p>
      ) : (
        <>
          <p className="mb-3 text-xs text-muted-foreground">
            Drag to reorder. #1 is the hero shot. Tiles without a size follow the automatic bento pattern.
          </p>
          <DragDropProvider
            onDragEnd={(event) => {
              if (event.canceled) return
              const { source } = event.operation
              if (isSortable(source)) handleReorder(source.initialIndex, source.index)
            }}
          >
            <div className="grid grid-cols-[repeat(auto-fill,minmax(170px,1fr))] gap-3">
              {photos.map((photo, index) => (
                <SortablePhoto
                  key={photo.id}
                  photo={photo}
                  index={index}
                  onEdit={() => setEditing(photo)}
                  onDelete={() => setDeleting(photo)}
                />
              ))}
            </div>
          </DragDropProvider>
        </>
      )}

      <EditDialog
        photo={editing}
        onClose={() => setEditing(null)}
        onSaved={(updated) => setPhotos((p) => p.map((x) => (x.id === updated.id ? updated : x)))}
      />

      <Dialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete photo?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            It will be removed from the landing page and storage. This cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleting && handleDelete(deleting)}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function StatusIcon({ status }: { status: UploadStatus }) {
  if (status === "done") return <RiCheckLine className="size-4 text-green-600" />
  if (status === "error") return <RiErrorWarningLine className="size-4 text-destructive" />
  if (status === "waiting") return <span className="size-4" />
  return <RiLoader4Line className="size-4 animate-spin text-muted-foreground" />
}

function SortablePhoto({
  photo,
  index,
  onEdit,
  onDelete,
}: {
  photo: PreweddingPhoto
  index: number
  onEdit: () => void
  onDelete: () => void
}) {
  const { ref, handleRef, isDragging } = useSortable({ id: photo.id, index })

  return (
    <Card ref={ref} className={`gap-0 overflow-hidden py-0 ${isDragging ? "opacity-60 ring-2 ring-primary" : ""}`}>
      <div className="relative aspect-[4/5] bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo.thumbUrl} alt={photo.title ?? ""} loading="lazy" className="size-full object-cover" />
        <Badge variant="secondary" className="absolute top-2 left-2">#{index + 1}</Badge>
        <button
          ref={handleRef}
          type="button"
          aria-label="Drag to reorder"
          className="absolute top-2 right-2 grid size-8 cursor-grab place-items-center rounded-md bg-background/80 active:cursor-grabbing"
        >
          <RiDraggable className="size-4" />
        </button>
      </div>
      <div className="flex items-center gap-2 p-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{photo.title ?? <span className="text-muted-foreground">Untitled</span>}</p>
          <p className="text-xs text-muted-foreground">
            {photo.tileSize ?? "auto"} · {photo.width}×{photo.height}
          </p>
        </div>
        <Button variant="ghost" size="icon" aria-label="Edit" onClick={onEdit}>
          <RiPencilLine className="size-4" />
        </Button>
        <Button variant="ghost" size="icon" aria-label="Delete" onClick={onDelete}>
          <RiDeleteBinLine className="size-4" />
        </Button>
      </div>
    </Card>
  )
}

const AUTO = "auto"

function EditDialog({
  photo,
  onClose,
  onSaved,
}: {
  photo: PreweddingPhoto | null
  onClose: () => void
  onSaved: (photo: PreweddingPhoto) => void
}) {
  return (
    <Dialog open={photo !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit photo</DialogTitle>
        </DialogHeader>
        {/* Keyed so the form resets to each photo's values */}
        {photo && <EditForm key={photo.id} photo={photo} onClose={onClose} onSaved={onSaved} />}
      </DialogContent>
    </Dialog>
  )
}

function EditForm({
  photo,
  onClose,
  onSaved,
}: {
  photo: PreweddingPhoto
  onClose: () => void
  onSaved: (photo: PreweddingPhoto) => void
}) {
  const [title, setTitle] = useState(photo.title ?? "")
  const [caption, setCaption] = useState(photo.caption ?? "")
  const [tileSize, setTileSize] = useState<string>(photo.tileSize ?? AUTO)
  const [saving, setSaving] = useState(false)

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const result = await adminUpdatePreweddingPhoto(photo.id, {
      title: title.trim() || null,
      caption: caption.trim() || null,
      tileSize: tileSize === AUTO ? null : (tileSize as TileSize),
    })
    setSaving(false)
    if (result.success) {
      onSaved(result.data)
      onClose()
      toast.success("Saved")
    } else {
      toast.error(result.error)
    }
  }

  return (
    <form onSubmit={save} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="pw-title">Title</Label>
        <Input id="pw-title" value={title} maxLength={200} onChange={(e) => setTitle(e.target.value)} placeholder="Golden Hour" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="pw-caption">Caption</Label>
        <Input id="pw-caption" value={caption} maxLength={200} onChange={(e) => setCaption(e.target.value)} placeholder="Pattaya · 2026" />
      </div>
      <div className="space-y-2">
        <Label>Tile size</Label>
        <Select value={tileSize} onValueChange={(v) => v && setTileSize(v)}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={AUTO}>Auto (follow pattern)</SelectItem>
            {TILE_SIZES.map((size) => (
              <SelectItem key={size} value={size}>
                {size[0].toUpperCase() + size.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
      </DialogFooter>
    </form>
  )
}
