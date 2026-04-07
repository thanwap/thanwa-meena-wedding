import { describe, it, expect } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { RSVPForm } from "../components/rsvp-form"

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

  it("shows thank you message after form submission", () => {
    render(<RSVPForm />)
    fireEvent.click(screen.getByText(/ยืนยันเข้าร่วม/))

    fireEvent.change(screen.getByLabelText(/ชื่อ-นามสกุล/), {
      target: { value: "สมชาย ใจดี" },
    })

    fireEvent.click(screen.getByText(/Confirm Attendance/i))
    expect(screen.getByText(/ขอบคุณมาก/)).toBeInTheDocument()
  })
})
