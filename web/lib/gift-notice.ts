import { compressToBlob } from "@/lib/image-compress"

/** Readable for slip text, yet ~150–300 KB as JPEG — the upload is over in a moment on 4G. */
export const SLIP_MAX_EDGE = 1600
export const SLIP_QUALITY = 0.8
export const GIVER_MAX = 120
export const AMOUNT_MAX = 10_000_000
/** Phone clocks drift — matches the API's allowance. */
const CLOCK_SKEW_MS = 10 * 60 * 1000

/**
 * Always re-encodes in the browser: the result is a small JPEG with EXIF (and any GPS)
 * gone, so the API only has to check it and store it. HEIC works wherever the browser
 * can decode it (Safari).
 */
export async function prepareSlip(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" })
  try {
    return await compressToBlob(bitmap, SLIP_MAX_EDGE, SLIP_QUALITY)
  } finally {
    bitmap.close()
  }
}

const bangkokParts = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Bangkok",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
})

/** `datetime-local` value for an instant, in Bangkok time — what the guest's bank app shows. */
export function toBangkokInput(date: Date): string {
  const p = Object.fromEntries(bangkokParts.formatToParts(date).map((x) => [x.type, x.value]))
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`
}

/** Reads a `datetime-local` value as Bangkok time; null when it isn't one. */
export function fromBangkokInput(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null
  const date = new Date(`${value}:00+07:00`)
  return Number.isNaN(date.getTime()) ? null : date
}

/** "1,500" / "1500.50" → number; null when blank; NaN when it isn't a valid amount. */
export function parseAmount(raw: string): number | null {
  const cleaned = raw.replace(/[,\s฿]/g, "")
  if (cleaned === "") return null
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return NaN
  const value = Number(cleaned)
  return value > 0 && value <= AMOUNT_MAX ? value : NaN
}

export interface NoticeFields {
  giver: string
  time: string
  amount: string
}

export type NoticeErrors = Partial<Record<keyof NoticeFields, string>>

export function validateNotice(fields: NoticeFields, now = new Date()): NoticeErrors {
  const errors: NoticeErrors = {}
  const giver = fields.giver.trim()
  if (!giver) errors.giver = "กรุณาใส่ชื่อผู้ให้"
  else if (giver.length > GIVER_MAX) errors.giver = `ชื่อยาวได้ไม่เกิน ${GIVER_MAX} ตัวอักษร`

  const time = fromBangkokInput(fields.time)
  if (!time) errors.time = "กรุณาใส่วันและเวลาที่โอน"
  else if (time.getTime() > now.getTime() + CLOCK_SKEW_MS) errors.time = "เวลาที่โอนต้องไม่เกินเวลาปัจจุบัน"

  if (Number.isNaN(parseAmount(fields.amount))) errors.amount = "ใส่ยอดเป็นตัวเลข เช่น 1000 หรือ 1,500.50"
  return errors
}
