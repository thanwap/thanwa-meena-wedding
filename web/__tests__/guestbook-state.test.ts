import { describe, it, expect } from "vitest"
import {
  guestbookReducer,
  initialState,
  lettersFromEntries,
  validateLetter,
  MESSAGE_MAX,
  type GuestbookState,
  type Letter,
} from "../components/guestbook/guestbook-state"
import { POSTCARDS, postcardForEntry } from "../components/guestbook/postcards"

const entries = [
  { id: 4, name: "Fang", message: "ยินดีด้วยนะ", postcardId: null, imageUrls: [], createdAt: "2026-10-01T00:00:00Z" },
  { id: 9, name: "Ploy", message: "Congrats!", postcardId: 7, imageUrls: [], createdAt: "2026-10-02T00:00:00Z" },
]

const saved: Letter = { id: 31, name: "Mint", message: "รักกันนาน ๆ", postcardId: 3, createdAt: "2026-10-26T12:00:00Z" }

function writing(): GuestbookState {
  return guestbookReducer(initialState(entries), { type: "pick", postcardId: 3 })
}

function sending(): GuestbookState {
  return guestbookReducer(writing(), { type: "send", name: "Mint", message: "รักกันนาน ๆ" })
}

describe("postcardForEntry", () => {
  it("gives older entries a stable card from the line", () => {
    const ids = POSTCARDS.map((p) => p.id)
    for (const id of [1, 5, 6, 42, -3]) expect(ids).toContain(postcardForEntry(id))
    expect(postcardForEntry(POSTCARDS.length + 1)).toBe(postcardForEntry(1))
  })
})

describe("lettersFromEntries", () => {
  it("uses the postcard the guest chose, falling back for older entries", () => {
    const [old, chosen] = lettersFromEntries(entries)
    expect(old.postcardId).toBe(postcardForEntry(4))
    expect(chosen.postcardId).toBe(7)
  })
})

describe("validateLetter", () => {
  it("requires a name and a message", () => {
    expect(validateLetter("  ", "")).toEqual({ name: expect.any(String), message: expect.any(String) })
    expect(validateLetter("Fang", "hi")).toEqual({})
  })

  it("treats zero-width-only text as blank, like the API", () => {
    expect(validateLetter("\u200B\u200B", "hi").name).toBeDefined()
    expect(validateLetter("Fang", "\uFEFF \u2060").message).toBeDefined()
    expect(validateLetter("👩‍❤️‍👨", "🎉").name).toBeUndefined()
  })

  it("rejects messages over the limit", () => {
    expect(validateLetter("Fang", "ก".repeat(MESSAGE_MAX + 1)).message).toBeDefined()
  })
})

describe("guestbookReducer", () => {
  it("seeds the box with saved entries", () => {
    const s = initialState(entries)
    expect(s.step).toBe("pick")
    expect(s.letters.map((l) => l.id)).toEqual([4, 9])
  })

  it("goes pick → write → sending → back to pick with the saved letter in the box", () => {
    let s = writing()
    expect(s).toMatchObject({ step: "write", postcardId: 3 })

    s = sending()
    expect(s.step).toBe("sending")

    s = guestbookReducer(s, { type: "delivered", letter: saved })
    expect(s.step).toBe("pick")
    expect(s.postcardId).toBeNull()
    expect(s.letters.at(-1)).toEqual(saved)
    expect(s.sentId).toBe(31)
  })

  it("returns to the postcard when saving fails, keeping the chosen card", () => {
    const s = guestbookReducer(sending(), { type: "sendFailed" })
    expect(s).toMatchObject({ step: "write", postcardId: 3 })
    expect(s.letters).toHaveLength(2)
  })

  it("never shows the same letter twice", () => {
    const s = guestbookReducer(sending(), { type: "delivered", letter: { ...saved, id: 9 } })
    expect(s.letters.filter((l) => l.id === 9)).toHaveLength(1)
  })

  it("ignores delivery when nothing is being sent", () => {
    const s = initialState(entries)
    expect(guestbookReducer(s, { type: "delivered", letter: saved })).toBe(s)
  })

  it("stays on the postcard when the letter is invalid", () => {
    const s = guestbookReducer(writing(), { type: "send", name: "", message: "hi" })
    expect(s.step).toBe("write")
  })

  it("ignores a second pick while a postcard is open", () => {
    const s = guestbookReducer(writing(), { type: "pick", postcardId: 1 })
    expect(s.postcardId).toBe(3)
  })

  it("puts the card back on cancel", () => {
    expect(guestbookReducer(writing(), { type: "cancel" })).toMatchObject({ step: "pick", postcardId: null })
  })

  it("opens and closes a letter", () => {
    let s = guestbookReducer(initialState(entries), { type: "read", id: 9 })
    expect(s.readingId).toBe(9)
    s = guestbookReducer(s, { type: "closeReader" })
    expect(s.readingId).toBeNull()
    expect(guestbookReducer(s, { type: "read", id: 123 }).readingId).toBeNull()
  })
})
