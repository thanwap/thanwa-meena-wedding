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

function clamp(v: number): number {
  return Math.max(0, Math.min(255, Math.round(v)))
}

/** Apply pixel-level filter to a canvas. Call after drawing image/video frame. */
export function applyFilterToCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  filter: FilterName,
  withGrain = true,
): void {
  if (filter === "none") return

  const imageData = ctx.getImageData(0, 0, width, height)
  const d = imageData.data

  for (let i = 0; i < d.length; i += 4) {
    let r = d[i]
    let g = d[i + 1]
    let b = d[i + 2]

    if (filter === "warm-vintage") {
      // Warm tones: boost red, reduce blue, lift shadows
      const luma = 0.299 * r + 0.587 * g + 0.114 * b
      const lift = Math.max(0, (80 - luma) * 0.2) // lift shadows only
      r = clamp(r * 1.08 + lift)
      g = clamp(g * 1.02 + lift)
      b = clamp(b * 0.82 + lift)
      // Sepia blend at 40%
      const sr = clamp(r * 0.393 + g * 0.769 + b * 0.189)
      const sg = clamp(r * 0.349 + g * 0.686 + b * 0.168)
      const sb = clamp(r * 0.272 + g * 0.534 + b * 0.131)
      r = clamp(r * 0.6 + sr * 0.4)
      g = clamp(g * 0.6 + sg * 0.4)
      b = clamp(b * 0.6 + sb * 0.4)
    } else if (filter === "cool-film") {
      // Filmic fade: lift blacks, slight blue cast in shadows
      r = clamp(r * 0.88 + 20)
      g = clamp(g * 0.88 + 20)
      b = clamp(b * 0.9 + 28)
      // Desaturate slightly
      const gray = 0.299 * r + 0.587 * g + 0.114 * b
      r = clamp(r * 0.8 + gray * 0.2)
      g = clamp(g * 0.8 + gray * 0.2)
      b = clamp(b * 0.8 + gray * 0.2)
    } else if (filter === "bw-classic") {
      // Luminance grayscale with boosted contrast
      const gray = 0.299 * r + 0.587 * g + 0.114 * b
      const contrasted = clamp((gray - 128) * 1.25 + 128)
      r = contrasted
      g = contrasted
      b = contrasted
    }

    // Grain
    if (withGrain) {
      const noise = (Math.random() - 0.5) * 22
      r = clamp(r + noise)
      g = clamp(g + noise)
      b = clamp(b + noise)
    }

    d[i] = r
    d[i + 1] = g
    d[i + 2] = b
  }

  ctx.putImageData(imageData, 0, 0)

  // Vignette
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
