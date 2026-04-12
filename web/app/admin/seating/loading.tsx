import { Skeleton } from "@/components/ui/skeleton"

export default function SeatingLoading() {
  return (
    <div className="flex h-[calc(100vh-10rem)] flex-col gap-4">
      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-9 w-28" />
        <div className="flex-1" />
        <Skeleton className="h-9 w-24" />
      </div>

      <div className="flex flex-1 gap-4 overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 shrink-0 space-y-3 overflow-auto rounded-md border p-4">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-9 w-full" />
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2 rounded-md border px-3 py-2">
              <Skeleton className="h-4 w-4 rounded-full" />
              <Skeleton className="h-4 flex-1" />
            </div>
          ))}
        </div>

        {/* Canvas */}
        <div className="relative flex-1 overflow-auto rounded-md border bg-muted/30">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="absolute rounded-lg border bg-background p-3"
              style={{
                left: `${80 + (i % 3) * 200}px`,
                top: `${60 + Math.floor(i / 3) * 160}px`,
                width: 150,
              }}
            >
              <Skeleton className="mb-2 h-4 w-20" />
              <div className="space-y-1">
                {Array.from({ length: 3 }).map((_, j) => (
                  <Skeleton key={j} className="h-3 w-full" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
