import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent, act } from "@testing-library/react"
import { InvitationCard } from "../components/invitation-card"

vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: ({ alt }: { alt: string }) => <img alt={alt} />,
}))

function stubMotion(reduce: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn((q: string) => ({ matches: reduce && q.includes("reduce") })),
  )
}

beforeEach(() => {
  vi.stubGlobal(
    "ResizeObserver",
    vi.fn(function () {
      return { observe: vi.fn(), disconnect: vi.fn() }
    }),
  )
  vi.stubGlobal(
    "IntersectionObserver",
    vi.fn(function () {
      return { observe: vi.fn(), disconnect: vi.fn() }
    }),
  )
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe("InvitationCard", () => {
  it("describes both sides of the card for screen readers", () => {
    stubMotion(false)
    render(<InvitationCard />)
    expect(screen.getByAltText(/การ์ดเชิญด้านหน้า/)).toBeInTheDocument()
    expect(screen.getByAltText(/THE COP Seminar & Resort พัทยา/)).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: /I still choose you/ })).toBeInTheDocument()
  })

  it("keeps manual flipping locked while the card is still in the envelope", () => {
    stubMotion(false)
    render(<InvitationCard />)
    const button = screen.getByRole("button", { name: "พลิกการ์ด" })
    expect(button).toBeDisabled()
    fireEvent.click(button)
    expect(button).toHaveAttribute("aria-pressed", "false")
  })

  it("unlocks the flip once scrolling has pulled the card out", () => {
    stubMotion(false)
    const { container } = render(<InvitationCard />)
    const section = container.querySelector("section")!
    vi.spyOn(section, "getBoundingClientRect").mockReturnValue({ top: -2000, height: 3000 } as DOMRect)
    vi.stubGlobal("innerHeight", 800)
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => (cb(0), 1))
    // IntersectionObserver is stubbed, so trigger its callback by hand
    const io = vi.mocked(IntersectionObserver).mock.calls[0][0] as IntersectionObserverCallback
    act(() => io([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver))
    const button = screen.getByRole("button", { name: "พลิกการ์ด" })
    expect(button).toBeEnabled()
    fireEvent.click(button)
    expect(button).toHaveAttribute("aria-pressed", "true")
  })

  it("shows the card already out of the envelope for reduced-motion guests", () => {
    stubMotion(true)
    render(<InvitationCard />)
    expect(screen.getByRole("button", { name: "พลิกการ์ด" })).toBeEnabled()
    expect(IntersectionObserver).not.toHaveBeenCalled()
  })
})
