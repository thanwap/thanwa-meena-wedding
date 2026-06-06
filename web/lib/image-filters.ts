declare global {
  interface Window {
    pixelsJS: {
      filterImgData(imageData: ImageData, filter: string): ImageData
      filterImg(img: HTMLImageElement, filter: string): void
      getFilterList(): string[]
    }
  }
}

export type FilterName = "none" | "warm-vintage" | "cool-film" | "bw-classic"

export interface FilterPreset {
  id: FilterName
  label: string
  labelTh: string
  /** CSS filter string used for real-time video preview */
  css: string
}

export const FILTER_PRESETS: FilterPreset[] = [
  {
    id: "none",
    label: "Original",
    labelTh: "ปกติ",
    css: "none",
  },
  {
    id: "warm-vintage",
    label: "Warm Vintage",
    labelTh: "วินเทจ",
    css: "sepia(0.45) contrast(1.08) brightness(1.05) saturate(1.2)",
  },
  {
    id: "cool-film",
    label: "Cool Film",
    labelTh: "ฟิล์ม",
    css: "contrast(0.88) brightness(1.1) saturate(0.7) hue-rotate(195deg)",
  },
  {
    id: "bw-classic",
    label: "B&W",
    labelTh: "ขาวดำ",
    css: "grayscale(1) contrast(1.3) brightness(0.95)",
  },
]

/** Maps our filter IDs to pixels.js filter names */
export const PIXELS_JS_FILTER: Record<Exclude<FilterName, "none">, string> = {
  "warm-vintage": "vintage",
  "cool-film": "cool_twilight",
  "bw-classic": "greyscale",
}

function clamp(v: number): number {
  return Math.max(0, Math.min(255, Math.round(v)))
}

function addGrain(data: Uint8ClampedArray): void {
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 22
    data[i] = clamp(data[i] + noise)
    data[i + 1] = clamp(data[i + 1] + noise)
    data[i + 2] = clamp(data[i + 2] + noise)
  }
}

/** Apply pixel-level filter to a canvas using pixels.js. Call after drawing image/video frame. */
export function applyFilterToCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  filter: FilterName,
  withGrain = true,
): void {
  if (filter === "none") return

  const pixelsFilterName = PIXELS_JS_FILTER[filter]
  const imageData = ctx.getImageData(0, 0, width, height)

  if (typeof window !== "undefined" && window.pixelsJS) {
    window.pixelsJS.filterImgData(imageData, pixelsFilterName)
  }

  if (withGrain) {
    addGrain(imageData.data)
  }

  ctx.putImageData(imageData, 0, 0)
  addVignette(ctx, width, height, filter)
}

function addVignette(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  filter: FilterName,
): void {
  const cx = w / 2
  const cy = h / 2
  const innerR = Math.min(w, h) * 0.25
  const outerR = Math.max(w, h) * 0.78
  const grad = ctx.createRadialGradient(cx, cy, innerR, cx, cy, outerR)
  grad.addColorStop(0, "rgba(0,0,0,0)")
  const vigColor =
    filter === "cool-film" ? "rgba(0,10,40,0.42)" : "rgba(0,0,0,0.45)"
  grad.addColorStop(1, vigColor)
  ctx.save()
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, w, h)
  ctx.restore()
}
