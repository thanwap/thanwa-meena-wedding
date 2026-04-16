"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Pagination } from "@/components/pagination"
import { deleteGuestbookEntry, type GuestbookAdminDto } from "./actions"

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function ImagePreview({ urls }: { urls: string[] }) {
  const [lightbox, setLightbox] = useState<string | null>(null)

  if (urls.length === 0) return <span className="text-muted-foreground text-sm">—</span>

  return (
    <>
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          onClick={() => setLightbox(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightbox}
            alt="Full size"
            className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
      <div className="flex gap-1.5">
        {urls.map((url, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setLightbox(url)}
            className="rounded overflow-hidden border hover:opacity-80 transition-opacity"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={`photo ${i + 1}`} className="h-20 w-20 object-cover" />
          </button>
        ))}
      </div>
    </>
  )
}

export function GuestbookTable({
  initialEntries,
  page,
  pageSize,
  totalPages,
  totalCount,
  search,
}: {
  initialEntries: GuestbookAdminDto[]
  page: number
  pageSize: number
  totalPages: number
  totalCount: number
  search: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [entries, setEntries] = useState(initialEntries)
  const [searchInput, setSearchInput] = useState(search)
  const [deleteTarget, setDeleteTarget] = useState<GuestbookAdminDto | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Sync entries when server re-renders with new data
  useEffect(() => { setEntries(initialEntries) }, [initialEntries])

  // Debounce search → URL navigation
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (searchInput === search) return
      const params = new URLSearchParams(searchParams.toString())
      params.set("page", "1")
      if (searchInput) params.set("search", searchInput)
      else params.delete("search")
      router.push(`${pathname}?${params}`)
    }, 400)
    return () => clearTimeout(timeout)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput])

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    const result = await deleteGuestbookEntry(deleteTarget.id)
    setDeleting(false)
    if (result.success) {
      setEntries((prev) => prev.filter((e) => e.id !== deleteTarget.id))
      toast.success(`Deleted entry from "${deleteTarget.name}"`)
      setDeleteTarget(null)
    } else {
      toast.error(result.error ?? "Delete failed")
    }
  }

  return (
    <>
      <div className="mb-4">
        <Input
          placeholder="Search by name…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="max-w-xs"
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-36">Name</TableHead>
              <TableHead>Message</TableHead>
              <TableHead className="w-52">Photos</TableHead>
              <TableHead className="w-28">Date</TableHead>
              <TableHead className="w-20 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-muted-foreground py-8"
                >
                  No entries found.
                </TableCell>
              </TableRow>
            )}
            {entries.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell className="font-medium">{entry.name}</TableCell>
                <TableCell>
                  <p className="max-w-xs line-clamp-2 text-sm text-muted-foreground">
                    {entry.message}
                  </p>
                </TableCell>
                <TableCell>
                  <ImagePreview urls={entry.imageUrls} />
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDate(entry.createdAt)}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setDeleteTarget(entry)}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Pagination page={page} pageSize={pageSize} totalPages={totalPages} totalCount={totalCount} />

      <Dialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete entry?</DialogTitle>
            <DialogDescription>
              This will permanently remove the message from{" "}
              <strong>{deleteTarget?.name}</strong>. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
