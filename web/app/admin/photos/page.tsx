"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { adminGetPhotos, adminDeletePhotos, type AdminPhotoRecord } from "./actions"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { PageHeader } from "@/components/admin/page-header"

export default function AdminPhotosPage() {
  const [photos, setPhotos] = useState<AdminPhotoRecord[]>([])
  const [, setCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [confirmDelete, setConfirmDelete] = useState<string[]>([])
  const sentinelRef = useRef<HTMLDivElement>(null)
  const cursorRef = useRef<string | null>(null)

  const loadPhotos = useCallback(
    async () => {
      if (loading) return
      setLoading(true)
      const result = await adminGetPhotos({
        cursor: cursorRef.current ?? undefined,
        limit: 50,
      })
      cursorRef.current = result.nextCursor
      setPhotos((prev) => [...prev, ...result.photos])
      setCursor(result.nextCursor)
      setHasMore(result.nextCursor !== null)
      setLoading(false)
    },
    [loading],
  )

  // Initial load — setState calls are after await inside local async fn
  useEffect(() => {
    async function init() {
      const result = await adminGetPhotos({ limit: 50 })
      cursorRef.current = result.nextCursor
      setPhotos(result.photos)
      setCursor(result.nextCursor)
      setHasMore(result.nextCursor !== null)
      setTotal(result.total)
      setLoading(false)
    }
    init()
  }, [])

  useEffect(() => {
    if (!sentinelRef.current) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !loading) loadPhotos()
      },
      { rootMargin: "300px" },
    )
    obs.observe(sentinelRef.current)
    return () => obs.disconnect()
  }, [hasMore, loading, loadPhotos])

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleDelete = async (ids: string[]) => {
    setConfirmDelete([])
    const result = await adminDeletePhotos(ids)
    if (result.success) {
      setPhotos((prev) => prev.filter((p) => !ids.includes(p.id)))
      setSelected((prev) => {
        const next = new Set(prev)
        ids.forEach((id) => next.delete(id))
        return next
      })
      setTotal((t) => t - ids.length)
      toast.success(`ลบ ${ids.length} รูปแล้ว`)
    } else {
      toast.error(result.error ?? "Delete failed")
    }
  }

  return (
    <div>
      <PageHeader
        title="Photos"
        subtitle={`${total} ${total === 1 ? "photo" : "photos"}`}
      >
        {selected.size > 0 && (
          <Button
            variant="destructive"
            onClick={() => setConfirmDelete([...selected])}
          >
            Delete {selected.size} selected
          </Button>
        )}
      </PageHeader>

      {/* Grid */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-2">
        {photos.map((photo) => {
          const isSelected = selected.has(photo.id)
          return (
            <div
              key={photo.id}
              className={[
                "group relative rounded-lg overflow-hidden cursor-pointer border-2 transition-colors duration-150",
                isSelected ? "border-destructive" : "border-transparent",
              ].join(" ")}
              onClick={() => toggleSelect(photo.id)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.thumbUrl}
                alt={photo.displayName}
                loading="lazy"
                className="w-full aspect-square object-cover block"
              />

              {/* Selection indicator */}
              {isSelected && (
                <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-destructive flex items-center justify-center">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 5l2 2 4-4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}

              {/* Info overlay */}
              <div className="absolute bottom-0 left-0 right-0 px-1.5 pb-1.5 pt-4 bg-gradient-to-t from-black/65 to-transparent">
                <p className="text-white text-[11px] font-medium leading-snug m-0">
                  {photo.displayName}
                </p>
                <p className="text-white/55 text-[10px] m-0">
                  {new Date(photo.createdAt).toLocaleDateString("th-TH")}
                </p>
              </div>

              {/* Quick delete (single) — hidden until hover via group-hover */}
              <button
                onClick={(e) => { e.stopPropagation(); setConfirmDelete([photo.id]) }}
                className="absolute top-1.5 left-1.5 w-6 h-6 rounded-full bg-black/50 border-0 flex items-center justify-center cursor-pointer text-white opacity-0 group-hover:opacity-100 transition-opacity duration-150"
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M2 2l6 6M8 2L2 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          )
        })}
      </div>

      {loading && (
        <div className="text-center py-8 text-muted-foreground text-sm">Loading…</div>
      )}
      <div ref={sentinelRef} className="h-px" />

      {/* Confirm delete dialog */}
      <Dialog open={confirmDelete.length > 0} onOpenChange={() => setConfirmDelete([])}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Delete {confirmDelete.length === 1 ? "photo" : `${confirmDelete.length} photos`}?
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This cannot be undone. The {confirmDelete.length === 1 ? "photo" : "photos"} will be permanently removed.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete([])}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleDelete(confirmDelete)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
