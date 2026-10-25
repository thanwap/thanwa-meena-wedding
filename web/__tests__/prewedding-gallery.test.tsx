import { describe, it, expect } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { PreweddingGallery, autoTileSize } from "../components/prewedding-gallery"
import type { PreweddingPhoto } from "../lib/prewedding"

const photo = (id: string, title: string | null, sortOrder: number): PreweddingPhoto => ({
  id,
  fullUrl: `https://cdn.test/full/${id}.webp`,
  thumbUrl: `https://cdn.test/thumb/${id}.webp`,
  width: 2400,
  height: 1600,
  title,
  caption: null,
  tileSize: null,
  sortOrder,
})

const PHOTOS = [photo("a", "First", 0), photo("b", "Second", 1), photo("c", null, 2)]

function openPhoto(i: number) {
  fireEvent.click(screen.getAllByRole("button", { name: /View photo/ })[i])
}

describe("PreweddingGallery", () => {
  it("renders a tile per photo and no lightbox initially", () => {
    render(<PreweddingGallery photos={PHOTOS} />)
    expect(screen.getAllByRole("button", { name: /View photo/ })).toHaveLength(3)
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  it("opens the lightbox on the clicked photo with a counter", () => {
    render(<PreweddingGallery photos={PHOTOS} />)
    openPhoto(1)
    expect(screen.getByRole("dialog")).toBeInTheDocument()
    expect(screen.getByText("2 / 3")).toBeInTheDocument()
  })

  it("navigates with buttons and wraps around", () => {
    render(<PreweddingGallery photos={PHOTOS} />)
    openPhoto(2)
    fireEvent.click(screen.getByRole("button", { name: "Next photo" }))
    expect(screen.getByText("1 / 3")).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Previous photo" }))
    expect(screen.getByText("3 / 3")).toBeInTheDocument()
  })

  it("navigates with arrow keys and closes on Escape", () => {
    render(<PreweddingGallery photos={PHOTOS} />)
    openPhoto(0)
    fireEvent.keyDown(window, { key: "ArrowRight" })
    expect(screen.getByText("2 / 3")).toBeInTheDocument()
    fireEvent.keyDown(window, { key: "Escape" })
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  it("uses thumbnails in the grid and the full image in the lightbox", () => {
    render(<PreweddingGallery photos={PHOTOS} />)
    expect(screen.getByAltText("First")).toHaveAttribute("src", "https://cdn.test/thumb/a.webp")
    openPhoto(0)
    const dialog = screen.getByRole("dialog")
    expect(dialog.querySelector("img")).toHaveAttribute("src", "https://cdn.test/full/a.webp")
  })

  it("falls back to a numbered alt text when a photo has no title", () => {
    render(<PreweddingGallery photos={PHOTOS} />)
    expect(screen.getByAltText("Pre-wedding photo 3")).toBeInTheDocument()
  })

  it("closes via the close button", () => {
    render(<PreweddingGallery photos={PHOTOS} />)
    openPhoto(0)
    fireEvent.click(screen.getByRole("button", { name: "Close" }))
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })
})

describe("autoTileSize", () => {
  const dims = (width: number, height: number) => ({ width, height })

  it("gives portraits a tall tile so faces are not cropped", () => {
    expect(autoTileSize(dims(1350, 2400), 3)).toBe("tall")
    expect(autoTileSize(dims(1800, 2400), 1)).toBe("tall")
  })

  it("keeps the first photo as the large hero unless it is very tall", () => {
    expect(autoTileSize(dims(1800, 2400), 0)).toBe("large")
    expect(autoTileSize(dims(2400, 1800), 0)).toBe("large")
    expect(autoTileSize(dims(1350, 2400), 0)).toBe("tall")
  })

  it("uses small tiles for 4:3 / square and wide tiles for panoramas", () => {
    expect(autoTileSize(dims(2400, 1800), 2)).toBe("small")
    expect(autoTileSize(dims(2000, 2000), 2)).toBe("small")
    expect(autoTileSize(dims(2400, 1350), 2)).toBe("wide")
  })
})
