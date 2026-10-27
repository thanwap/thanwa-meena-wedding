import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"

vi.mock("@/app/actions/gift-notice", () => ({ submitGiftNotice: vi.fn() }))
vi.mock("@/lib/gift-notice", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/gift-notice")>()),
  prepareSlip: vi.fn(),
}))

import { submitGiftNotice } from "@/app/actions/gift-notice"
import { prepareSlip } from "@/lib/gift-notice"
import { GiftNotice } from "@/components/gift-notice"

const mockSubmit = vi.mocked(submitGiftNotice)
const mockPrepare = vi.mocked(prepareSlip)

beforeEach(() => {
  vi.clearAllMocks()
  mockSubmit.mockResolvedValue({ success: true })
  mockPrepare.mockResolvedValue(new Blob(["jpeg"], { type: "image/jpeg" }))
  URL.createObjectURL = vi.fn(() => "blob:preview")
  URL.revokeObjectURL = vi.fn()
})

function open() {
  render(<GiftNotice />)
  fireEvent.click(screen.getByRole("button", { name: /แจ้งการโอน/ }))
}

function pickSlip() {
  const input = document.getElementById("gn-slip") as HTMLInputElement
  fireEvent.change(input, { target: { files: [new File(["x"], "slip.png", { type: "image/png" })] } })
}

describe("GiftNotice", () => {
  it("prefills the transfer date and time with now", () => {
    open()
    expect((screen.getByLabelText("วันที่โอน") as HTMLInputElement).value).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect((screen.getByLabelText("เวลาที่โอน") as HTMLInputElement).value).toMatch(/^\d{2}:\d{2}$/)
  })

  it("sends the date and time the guest changed them to, as Bangkok time", async () => {
    open()
    fireEvent.change(screen.getByLabelText(/ชื่อผู้ให้/), { target: { value: "ต้อม" } })
    fireEvent.change(screen.getByLabelText("วันที่โอน"), { target: { value: "2026-10-20" } })
    fireEvent.change(screen.getByLabelText("เวลาที่โอน"), { target: { value: "09:05" } })
    fireEvent.click(screen.getByRole("button", { name: "ส่ง" }))

    await waitFor(() =>
      expect(mockSubmit).toHaveBeenCalledWith(expect.objectContaining({ transferredAt: "2026-10-20T02:05:00.000Z" })),
    )
  })

  it("needs a giver before sending", async () => {
    open()
    fireEvent.click(screen.getByRole("button", { name: "ส่ง" }))

    expect(await screen.findByText(/กรุณาใส่ชื่อผู้ให้/)).toBeInTheDocument()
    expect(mockSubmit).not.toHaveBeenCalled()
  })

  it("sends giver and time without amount or slip", async () => {
    open()
    fireEvent.change(screen.getByLabelText(/ชื่อผู้ให้/), { target: { value: "ต้อม & แนน" } })
    fireEvent.click(screen.getByRole("button", { name: "ส่ง" }))

    await screen.findByText(/ได้รับแล้ว/)
    expect(mockSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ giver: "ต้อม & แนน", amount: null, slipId: null }),
    )
  })

  it("uploads the slip as soon as it is picked", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ slipId: "abc" }), { status: 201 }))
    vi.stubGlobal("fetch", fetchMock)
    open()

    pickSlip()

    expect(await screen.findByText(/แนบสลิปแล้ว/)).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledWith("/api/gift-slips", expect.objectContaining({ method: "POST" }))
  })

  it("waits for a slip still uploading, then sends its id", async () => {
    let finish!: (r: Response) => void
    vi.stubGlobal("fetch", vi.fn(() => new Promise<Response>((r) => (finish = r))))
    open()
    fireEvent.change(screen.getByLabelText(/ชื่อผู้ให้/), { target: { value: "แนน" } })
    fireEvent.change(screen.getByLabelText(/ยอดเงิน/), { target: { value: "1,000" } })
    pickSlip()
    await screen.findByText(/กำลังอัปโหลด…/)

    fireEvent.click(screen.getByRole("button", { name: "ส่ง" }))
    expect(mockSubmit).not.toHaveBeenCalled()

    finish(new Response(JSON.stringify({ slipId: "slip-1" }), { status: 201 }))

    await waitFor(() =>
      expect(mockSubmit).toHaveBeenCalledWith(expect.objectContaining({ amount: 1000, slipId: "slip-1" })),
    )
  })

  it("blocks sending when the slip failed, until it is removed", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 500 })))
    open()
    fireEvent.change(screen.getByLabelText(/ชื่อผู้ให้/), { target: { value: "แนน" } })
    pickSlip()
    await screen.findByText(/อัปโหลดสลิปไม่สำเร็จ/)

    fireEvent.click(screen.getByRole("button", { name: "ส่ง" }))
    expect(await screen.findByText(/สลิปยังอัปโหลดไม่สำเร็จ/)).toBeInTheDocument()
    expect(mockSubmit).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole("button", { name: "ลบสลิป" }))
    fireEvent.click(screen.getByRole("button", { name: "ส่ง" }))
    await waitFor(() => expect(mockSubmit).toHaveBeenCalledWith(expect.objectContaining({ slipId: null })))
  })
})
