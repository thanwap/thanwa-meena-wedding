import { describe, it, expect } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { PreweddingGallery } from "../components/prewedding-gallery"
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
