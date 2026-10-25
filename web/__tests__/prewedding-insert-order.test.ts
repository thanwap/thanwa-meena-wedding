import { describe, it, expect, vi } from "vitest"

vi.mock("@/app/admin/prewedding/actions", () => ({}))

import { insertBySortOrder } from "@/app/admin/prewedding/prewedding-manager"
import type { PreweddingPhoto } from "@/lib/prewedding"

const photo = (id: string, sortOrder: number) => ({ id, sortOrder }) as PreweddingPhoto
const ids = (photos: PreweddingPhoto[]) => photos.map((p) => p.id)

describe("insertBySortOrder", () => {
  it("appends when the upload is the newest", () => {
    expect(ids(insertBySortOrder([photo("a", 0), photo("b", 1)], photo("c", 2)))).toEqual(["a", "b", "c"])
  })

  it("places an upload that finished late before later uploads", () => {
    expect(ids(insertBySortOrder([photo("a", 0), photo("c", 2)], photo("b", 1)))).toEqual(["a", "b", "c"])
  })

  it("keeps a dragged order with stale sortOrders intact", () => {
    // "b" was dragged ahead of "a"; local sortOrders were not rewritten
    expect(ids(insertBySortOrder([photo("b", 1), photo("a", 0)], photo("c", 2)))).toEqual(["b", "a", "c"])
  })
})
