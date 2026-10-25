export type TileSize = "large" | "tall" | "wide" | "small"

export const TILE_SIZES: TileSize[] = ["large", "tall", "wide", "small"]

export interface PreweddingPhoto {
  id: string
  fullUrl: string
  thumbUrl: string
  width: number
  height: number
  title: string | null
  caption: string | null
  tileSize: TileSize | null
  sortOrder: number
}

export const PREWEDDING_CACHE_TAG = "prewedding"
