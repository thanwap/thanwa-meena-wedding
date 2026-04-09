import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { RSVPForm } from "../components/rsvp-form"

// Mock the submitRsvp server action
vi.mock("@/app/actions/rsvp", () => ({
  submitRsvp: vi.fn(),
}))

import { submitRsvp } from "@/app/actions/rsvp"
const mockSubmitRsvp = vi.mocked(submitRsvp)

beforeEach(() => {
  vi.clearAllMocks()
  // Default: successful submission
  mockSubmitRsvp.mockResolvedValue({ success: true })
})

describe("RSVPForm", () => {
  it("renders attendance toggle buttons", () => {
    render(<RSVPForm />)
    expect(screen.getByText(/ยืนยันเข้าร่วม/)).toBeInTheDocument()
    expect(screen.getByText(/ไม่สะดวก/)).toBeInTheDocument()
  })

  it("shows form fields when attending is confirmed", () => {
    render(<RSVPForm />)
    fireEvent.click(screen.getByText(/ยืนยันเข้าร่วม/))
    expect(screen.getByLabelText(/ชื่อ-นามสกุล/)).toBeInTheDocument()
    expect(screen.getByLabelText(/จำนวนผู้เข้าร่วม/)).toBeInTheDocument()
  })

  it("shows decline message when not attending", () => {
    render(<RSVPForm />)
    fireEvent.click(screen.getByText(/ไม่สะดวก/))
    expect(screen.getByText(/เราเข้าใจ/)).toBeInTheDocument()
  })

  it("shows dietary input when 'มี' is selected", () => {
    render(<RSVPForm />)
    fireEvent.click(screen.getByText(/ยืนยันเข้าร่วม/))

    // dietary toggle — find "มี" button
    const dietaryButtons = screen.getAllByText("มี")
    fireEvent.click(dietaryButtons[0])

    expect(
      screen.getByPlaceholderText(/ระบุอาหารที่แพ้/),
    ).toBeInTheDocument()
  })

  it("shows thank you message after successful form submission", async () => {
    render(<RSVPForm />)
    fireEvent.click(screen.getByText(/ยืนยันเข้าร่วม/))

    fireEvent.change(screen.getByLabelText(/ชื่อ-นามสกุล/), {
      target: { value: "สมชาย ใจดี" },
    })

    fireEvent.click(screen.getByText(/Confirm Attendance/i))

    await waitFor(() => {
      expect(screen.getByText(/ขอบคุณมาก/)).toBeInTheDocument()
    })
  })

  it("calls submitRsvp with the correct attending flag", async () => {
    render(<RSVPForm />)
    fireEvent.click(screen.getByText(/ยืนยันเข้าร่วม/))

    fireEvent.change(screen.getByLabelText(/ชื่อ-นามสกุล/), {
      target: { value: "ทดสอบ" },
    })

    fireEvent.click(screen.getByText(/Confirm Attendance/i))

    await waitFor(() => {
      expect(mockSubmitRsvp).toHaveBeenCalledOnce()
    })

    const formData: FormData = mockSubmitRsvp.mock.calls[0][0]
    expect(formData.get("attending")).toBe("true")
    expect(formData.get("name")).toBe("ทดสอบ")
  })

  it("shows inline error when submitRsvp returns an error", async () => {
    mockSubmitRsvp.mockResolvedValue({
      success: false,
      error: "Too many submissions. Please try again later.",
    })

    render(<RSVPForm />)
    fireEvent.click(screen.getByText(/ยืนยันเข้าร่วม/))

    fireEvent.change(screen.getByLabelText(/ชื่อ-นามสกุล/), {
      target: { value: "สมชาย ใจดี" },
    })

    fireEvent.click(screen.getByText(/Confirm Attendance/i))

    await waitFor(() => {
      expect(
        screen.getByText(/Too many submissions/),
      ).toBeInTheDocument()
    })

    // Should NOT show thank you
    expect(screen.queryByText(/ขอบคุณมาก/)).not.toBeInTheDocument()
  })

  it("includes a hidden honeypot field", () => {
    render(<RSVPForm />)
    fireEvent.click(screen.getByText(/ยืนยันเข้าร่วม/))
    // Honeypot input exists in the DOM with name hp_website
    const honeypot = document.querySelector('input[name="hp_website"]')
    expect(honeypot).not.toBeNull()
    expect((honeypot as HTMLInputElement).style.display).toBe("none")
  })
})
