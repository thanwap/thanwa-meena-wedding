import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { HeroVideo } from "../components/hero-video"

// Static image imports carry no blurDataURL under Vitest; the poster is decorative
vi.mock("next/image", () => ({ default: () => null }))

beforeEach(() => {
  vi.stubGlobal(
    "IntersectionObserver",
    vi.fn(function () {
      return { observe: vi.fn(), disconnect: vi.fn() }
    }),
  )
  vi.stubGlobal("matchMedia", vi.fn().mockReturnValue({ matches: false }))
  vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined)
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

function setup() {
  const { container } = render(<HeroVideo />)
  const video = container.querySelector("video")!
  return { video, button: screen.getByRole("button") }
}

describe("HeroVideo", () => {
  it("stays hidden over the poster until frames are playing, then fades in", () => {
    const { video } = setup()
    expect(video).toHaveClass("opacity-0")
    expect(video).toHaveAttribute("preload", "none")
    fireEvent.playing(video)
    expect(video).toHaveClass("opacity-100")
  })

  it("does not autoplay on Save-Data or 2G connections", () => {
    for (const connection of [{ saveData: true }, { effectiveType: "2g" }]) {
      vi.stubGlobal("navigator", { ...navigator, connection })
      const observer = vi.mocked(IntersectionObserver)
      observer.mockClear()
      const { unmount } = render(<HeroVideo />)
      expect(observer).not.toHaveBeenCalled()
      unmount()
    }
  })

  it("autoplays on a normal connection", () => {
    vi.stubGlobal("navigator", { ...navigator, connection: { effectiveType: "4g" } })
    setup()
    expect(IntersectionObserver).toHaveBeenCalled()
  })

  it("starts muted with an unmute button", () => {
    const { video, button } = setup()
    expect(video.muted).toBe(true)
    expect(button).toHaveAccessibleName("เปิดเสียง")
    expect(button).toHaveAttribute("aria-pressed", "false")
  })

  it("unmutes from the top of the reel on first tap", () => {
    const { video, button } = setup()
    video.currentTime = 12
    fireEvent.click(button)
    expect(video.muted).toBe(false)
    expect(video.currentTime).toBe(0)
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalled()
    expect(button).toHaveAccessibleName("ปิดเสียง")
    expect(button).toHaveAttribute("aria-pressed", "true")
  })

  it("mutes again without rewinding, and later unmutes resume in place", () => {
    const { video, button } = setup()
    fireEvent.click(button)
    video.currentTime = 8
    fireEvent.click(button)
    expect(video.muted).toBe(true)
    expect(video.currentTime).toBe(8)
    fireEvent.click(button)
    expect(video.muted).toBe(false)
    expect(video.currentTime).toBe(8)
  })
})
