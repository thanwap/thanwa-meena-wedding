import { describe, it, expect, vi, afterEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { SaveQrButton } from "../components/save-qr-button"

const IPHONE_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/130.0 Mobile/15E148 Safari/604.1"
const ANDROID_UA =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36"

function setup(ua: string) {
  vi.spyOn(navigator, "userAgent", "get").mockReturnValue(ua)
  const share = vi.fn().mockResolvedValue(undefined)
  Object.assign(navigator, { share, canShare: vi.fn().mockReturnValue(true) })
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({ blob: () => Promise.resolve(new Blob(["x"], { type: "image/jpeg" })) }),
  )
  render(
    <SaveQrButton src="/qr.jpg" filename="qr.jpg">
      Save
    </SaveQrButton>,
  )
  return { share, link: screen.getByRole("link", { name: "Save" }) }
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe("SaveQrButton", () => {
  it("is a plain download link", () => {
    const { link } = setup(ANDROID_UA)
    expect(link).toHaveAttribute("href", "/qr.jpg")
    expect(link).toHaveAttribute("download", "qr.jpg")
  })

  it("opens the share sheet with the image on iOS so it can be saved to Photos", async () => {
    const { share, link } = setup(IPHONE_UA)
    await waitFor(() => expect(fetch).toHaveBeenCalledWith("/qr.jpg"))
    await waitFor(() => {
      const prevented = !fireEvent.click(link)
      expect(prevented).toBe(true)
    })
    const [{ files }] = share.mock.calls[0]
    expect(files[0].name).toBe("qr.jpg")
  })

  it("leaves the download alone off iOS", async () => {
    const { share, link } = setup(ANDROID_UA)
    expect(fireEvent.click(link)).toBe(true)
    expect(fetch).not.toHaveBeenCalled()
    expect(share).not.toHaveBeenCalled()
  })
})
