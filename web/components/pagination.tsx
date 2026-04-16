"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const PAGE_SIZE_OPTIONS = [10, 20, 30, 40, 50]

interface PaginationProps {
  page: number
  pageSize: number
  totalPages: number
  totalCount: number
}

export function Pagination({ page, pageSize, totalPages, totalCount }: PaginationProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()

  function navigate(newPage: number, newPageSize?: number) {
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", String(newPage))
    if (newPageSize !== undefined) params.set("pageSize", String(newPageSize))
    router.push(`${pathname}?${params}`)
  }

  return (
    <div className="flex items-center justify-between mt-4">
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">Rows per page</span>
        <Select
          value={String(pageSize)}
          onValueChange={(v) => navigate(1, Number(v))}
        >
          <SelectTrigger className="h-8 w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PAGE_SIZE_OPTIONS.map((n) => (
              <SelectItem key={n} value={String(n)}>
                {n}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">
          {totalCount} total
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">
          Page {page} of {Math.max(1, totalPages)}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => navigate(page - 1)}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => navigate(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  )
}
