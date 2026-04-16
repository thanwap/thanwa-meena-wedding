import { Skeleton } from "@/components/ui/skeleton"

export default function GuestbookLoading() {
  return (
    <div>
      <div className="mb-6">
        <Skeleton className="h-8 w-40 mb-2" />
        <Skeleton className="h-4 w-24" />
      </div>
      <Skeleton className="h-9 w-48 mb-4" />
      <div className="rounded-md border">
        <div className="p-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-4 items-center">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-5 flex-1" />
              <Skeleton className="h-10 w-10" />
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-8 w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
