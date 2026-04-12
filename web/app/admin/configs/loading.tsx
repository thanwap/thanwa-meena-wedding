import { Skeleton } from "@/components/ui/skeleton"

export default function ConfigsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-9 w-28" />
      </div>
      <div className="rounded-md border">
        <div className="border-b px-4 py-3 grid grid-cols-3 gap-4">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-12" />
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="border-b last:border-0 px-4 py-3 grid grid-cols-3 gap-4 items-center">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>
    </div>
  )
}
