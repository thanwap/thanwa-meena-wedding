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
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Photos</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {total} {total === 1 ? "photo" : "photos"}
          </p>
        </div>
        {selected.size > 0 && (
          <Button
            variant="destructive"
            onClick={() => setConfirmDelete([...selected])}
          >
            Delete {selected.size} selected
          </Button>
        )}
      </div>

      {/* Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
          gap: 8,
        }}
      >
        {photos.map((photo) => {
          const isSelected = selected.has(photo.id)
          return (
            <div
              key={photo.id}
              style={{
                position: "relative",
                borderRadius: 8,
                overflow: "hidden",
                cursor: "pointer",
                border: isSelected ? "2px solid hsl(var(--destructive))" : "2px solid transparent",
                transition: "border-color 0.15s ease",
              }}
              onClick={() => toggleSelect(photo.id)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.thumbUrl}
                alt={photo.displayName}
                loading="lazy"
                style={{ width: "100%", aspectRatio: "1", objectFit: "cover", display: "block" }}
              />

              {/* Selection indicator */}
              {isSelected && (
                <div
                  style={{
                    position: "absolute",
                    top: 6,
                    right: 6,
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    background: "hsl(var(--destructive))",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 5l2 2 4-4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}

              {/* Info overlay */}
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  padding: "16px 6px 5px",
                  background: "linear-gradient(to top, rgba(0,0,0,0.65), transparent)",
                }}
              >
                <p style={{ color: "#fff", fontSize: 11, margin: 0, fontWeight: 500, lineHeight: 1.3 }}>
                  {photo.displayName}
                </p>
                <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 10, margin: 0 }}>
                  {new Date(photo.createdAt).toLocaleDateString("th-TH")}
                </p>
              </div>

              {/* Quick delete (single) */}
              <button
                onClick={(e) => { e.stopPropagation(); setConfirmDelete([photo.id]) }}
                style={{
                  position: "absolute",
                  top: 6,
                  left: 6,
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  background: "rgba(0,0,0,0.5)",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "#fff",
                  opacity: 0,
                  transition: "opacity 0.15s ease",
                }}
                className="delete-btn"
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
      <div ref={sentinelRef} style={{ height: 1 }} />

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

      <style>{`
        .delete-btn { opacity: 0; }
        @media (hover: hover) {
          div:hover > .delete-btn { opacity: 1; }
        }
        @media (hover: none) {
          .delete-btn { display: none; }
        }
      `}</style>
    </div>
  )
}
