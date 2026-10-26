import type { GuestbookEntryDto } from "@/app/actions/guestbook"
import { postcardForEntry } from "./postcards"

export const NAME_MAX = 120
export const MESSAGE_MAX = 2000

export interface Letter {
  id: number
  name: string
  message: string
  postcardId: number
  createdAt: string
}

/** pick (clothesline) → write (postcard) → sending (saving, then flying into the box) → pick */
export type Step = "pick" | "write" | "sending"

export interface GuestbookState {
  step: Step
  postcardId: number | null
  letters: Letter[]
  /** Id of the letter this guest just dropped in, for the thank-you line */
  sentId: number | null
  readingId: number | null
}

export type GuestbookAction =
  | { type: "pick"; postcardId: number }
  | { type: "cancel" }
  | { type: "send"; name: string; message: string }
  | { type: "sendFailed" }
  /** The saved letter has landed in the box */
  | { type: "delivered"; letter: Letter }
  | { type: "read"; id: number }
  | { type: "closeReader" }

export function lettersFromEntries(entries: GuestbookEntryDto[]): Letter[] {
  return entries.map((e) => ({
    id: e.id,
    name: e.name,
    message: e.message,
    postcardId: e.postcardId ?? postcardForEntry(e.id),
    createdAt: e.createdAt,
  }))
}

export function initialState(entries: GuestbookEntryDto[]): GuestbookState {
  return {
    step: "pick",
    postcardId: null,
    letters: lettersFromEntries(entries),
    sentId: null,
    readingId: null,
  }
}

export type LetterErrors = { name?: string; message?: string }

/** Same rule as the API: whitespace and invisible format characters (zero-width spaces etc.) don't count */
const hasVisibleText = (s: string) => /[^\s\p{Cf}]/u.test(s)

export function validateLetter(name: string, message: string): LetterErrors {
  const errors: LetterErrors = {}
  if (!hasVisibleText(name)) errors.name = "ใส่ชื่อของคุณด้วยนะ"
  else if (name.trim().length > NAME_MAX) errors.name = `ชื่อยาวได้ไม่เกิน ${NAME_MAX} ตัวอักษร`
  if (!hasVisibleText(message)) errors.message = "เขียนคำอวยพรสักหน่อยนะ"
  else if (message.trim().length > MESSAGE_MAX) errors.message = `ข้อความยาวได้ไม่เกิน ${MESSAGE_MAX} ตัวอักษร`
  return errors
}

export function guestbookReducer(state: GuestbookState, action: GuestbookAction): GuestbookState {
  switch (action.type) {
    case "pick":
      if (state.step !== "pick") return state
      return { ...state, step: "write", postcardId: action.postcardId, sentId: null }
    case "cancel":
      if (state.step !== "write") return state
      return { ...state, step: "pick", postcardId: null }
    case "send": {
      if (state.step !== "write" || state.postcardId === null) return state
      const errors = validateLetter(action.name, action.message)
      if (errors.name || errors.message) return state
      return { ...state, step: "sending" }
    }
    case "sendFailed":
      return state.step === "sending" ? { ...state, step: "write" } : state
    case "delivered":
      if (state.step !== "sending") return state
      return {
        ...state,
        step: "pick",
        postcardId: null,
        letters: [...state.letters.filter((l) => l.id !== action.letter.id), action.letter],
        sentId: action.letter.id,
      }
    case "read":
      return state.letters.some((l) => l.id === action.id) ? { ...state, readingId: action.id } : state
    case "closeReader":
      return { ...state, readingId: null }
  }
}
