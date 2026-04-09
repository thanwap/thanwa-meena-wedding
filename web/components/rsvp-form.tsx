"use client"

import { useState, useTransition } from "react"
import { submitRsvp } from "@/app/actions/rsvp"

type FormState = {
  name: string
  guests: string
  hasDietary: boolean
  dietary: string
  message: string
}

const LABEL: React.CSSProperties = {
  fontFamily: "var(--font-josefin)",
  fontSize: "12px",
  letterSpacing: "0.4em",
  textTransform: "uppercase",
  color: "var(--c-muted)",
  display: "block",
  marginBottom: "6px",
}

const TOGGLE_BASE: React.CSSProperties = {
  flex: 1,
  padding: "12px 8px",
  fontFamily: "var(--font-josefin)",
  fontSize: "12px",
  letterSpacing: "0.3em",
  textTransform: "uppercase",
  cursor: "pointer",
  transition: "all 0.2s",
  border: "1px solid var(--c-blush)",
  background: "transparent",
  color: "var(--c-ink-2)",
}

export function RSVPForm() {
  const [attending, setAttending] = useState<boolean | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [form, setForm] = useState<FormState>({
    name: "",
    guests: "1",
    hasDietary: false,
    dietary: "",
    message: "",
  })
  const [formError, setFormError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFormError(null)
    const formData = new FormData(e.currentTarget)
    // Ensure attending value is included (it's managed in state, not a form input)
    formData.set("attending", String(attending))
    // Coerce guests value
    formData.set("guestCount", form.guests)
    // dietary — only include if hasDietary is true
    formData.set("dietary", form.hasDietary ? form.dietary : "")

    startTransition(async () => {
      const result = await submitRsvp(formData)
      if (result.success) {
        setSubmitted(true)
      } else {
        setFormError(result.error)
      }
    })
  }

  if (submitted) {
    return (
      <div className="reveal text-center py-10">
        <p
          className="font-[family-name:var(--font-script)]"
          style={{ fontSize: 52, color: "var(--c-blush-deep)", lineHeight: 1.1 }}
        >
          ขอบคุณมาก!
        </p>
        <p
          className="font-[family-name:var(--font-sarabun)] text-sm mt-4"
          style={{ color: "var(--c-ink-2)" }}
        >
          เราได้รับการตอบรับของท่านแล้ว ✨
        </p>
        <p
          className="font-[family-name:var(--font-sarabun)] text-sm mt-1"
          style={{ color: "var(--c-muted)" }}
        >
          รอพบกันในวันที่ 26 ธันวาคม 2569
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Honeypot field — hidden from real users */}
      <input
        type="text"
        name="hp_website"
        style={{ display: "none" }}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
      />

      {/* ── Attendance toggle ── */}
      <div>
        <label style={LABEL}>จะมาร่วมงานไหม?</label>
        <div className="flex gap-3 mt-3">
          {(
            [
              { v: true, label: "ยืนยันเข้าร่วม ✓" },
              { v: false, label: "ไม่สะดวก" },
            ] as const
          ).map(({ v, label }) => (
            <button
              key={String(v)}
              type="button"
              onClick={() => setAttending(v)}
              style={{
                ...TOGGLE_BASE,
                borderColor:
                  attending === v
                    ? v
                      ? "var(--c-sage)"
                      : "var(--c-blush-deep)"
                    : "var(--c-blush)",
                background:
                  attending === v
                    ? v
                      ? "var(--c-sage)"
                      : "var(--c-blush-deep)"
                    : "transparent",
                color: attending === v ? "#fff" : "var(--c-ink-2)",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Fields shown only if attending ── */}
      {attending === true && (
        <>
          {/* Name */}
          <div>
            <label style={LABEL} htmlFor="rsvp-name">
              ชื่อ-นามสกุล
            </label>
            <input
              id="rsvp-name"
              name="name"
              type="text"
              required
              className="rsvp-input"
              placeholder="กรอกชื่อ-นามสกุล"
              value={form.name}
              onChange={(e) =>
                setForm((f) => ({ ...f, name: e.target.value }))
              }
            />
          </div>

          {/* Guest count */}
          <div>
            <label style={LABEL} htmlFor="rsvp-guests">
              จำนวนผู้เข้าร่วม (รวมท่าน)
            </label>
            <div className="relative">
              <select
                id="rsvp-guests"
                name="guestCount"
                className="rsvp-select"
                value={form.guests}
                onChange={(e) =>
                  setForm((f) => ({ ...f, guests: e.target.value }))
                }
              >
                {["1", "2", "3", "4", "5", "6+"].map((n) => (
                  <option key={n} value={n}>
                    {n} {n === "1" ? "คน" : "คน"}
                  </option>
                ))}
              </select>
              <svg
                className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2"
                width="10"
                height="6"
                viewBox="0 0 10 6"
                fill="none"
                style={{ color: "var(--c-muted)" }}
              >
                <path
                  d="M1 1L5 5L9 1"
                  stroke="currentColor"
                  strokeWidth="1.2"
                />
              </svg>
            </div>
          </div>

          {/* Dietary */}
          <div>
            <label style={LABEL}>การแพ้อาหาร / อาหารพิเศษ</label>
            <div className="flex gap-3 mt-3">
              {(
                [
                  { v: false, label: "ไม่มี" },
                  { v: true, label: "มี" },
                ] as const
              ).map(({ v, label }) => (
                <button
                  key={String(v)}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, hasDietary: v }))}
                  style={{
                    ...TOGGLE_BASE,
                    borderColor:
                      form.hasDietary === v
                        ? "var(--c-blush-deep)"
                        : "var(--c-blush)",
                    background:
                      form.hasDietary === v ? "var(--c-blush)" : "transparent",
                    color: "var(--c-ink-2)",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
            {form.hasDietary && (
              <input
                type="text"
                name="dietary"
                className="rsvp-input mt-3"
                placeholder="ระบุอาหารที่แพ้หรืออาหารพิเศษ"
                value={form.dietary}
                onChange={(e) =>
                  setForm((f) => ({ ...f, dietary: e.target.value }))
                }
              />
            )}
          </div>

          {/* Message */}
          <div>
            <label style={LABEL} htmlFor="rsvp-msg">
              ข้อความถึงบ่าวสาว
            </label>
            <textarea
              id="rsvp-msg"
              name="message"
              rows={3}
              className="rsvp-textarea"
              placeholder="ส่งคำอวยพร หรือข้อความพิเศษถึงบ่าวสาว..."
              value={form.message}
              onChange={(e) =>
                setForm((f) => ({ ...f, message: e.target.value }))
              }
            />
          </div>

          {/* Inline error */}
          {formError && (
            <p
              className="font-[family-name:var(--font-sarabun)] text-sm"
              style={{ color: "var(--c-blush-deep)" }}
              role="alert"
            >
              {formError}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isPending}
            className="w-full py-4 transition-opacity hover:opacity-75 active:opacity-60 disabled:opacity-50"
            style={{
              background: "var(--c-ink)",
              color: "var(--c-ivory)",
              fontFamily: "var(--font-josefin)",
              fontSize: "13px",
              letterSpacing: "0.45em",
              textTransform: "uppercase",
            }}
          >
            {isPending ? "Sending…" : "Confirm Attendance"}
          </button>
        </>
      )}

      {/* ── Decline message ── */}
      {attending === false && (
        <>
          {/* Inline error for declining path */}
          {formError && (
            <p
              className="font-[family-name:var(--font-sarabun)] text-sm"
              style={{ color: "var(--c-blush-deep)" }}
              role="alert"
            >
              {formError}
            </p>
          )}
          <div className="text-center py-6 space-y-2">
            <p
              className="font-[family-name:var(--font-cormorant)] text-2xl italic"
              style={{ color: "var(--c-ink-2)" }}
            >
              เราเข้าใจค่ะ 💗
            </p>
            <p
              className="font-[family-name:var(--font-sarabun)] text-sm leading-relaxed"
              style={{ color: "var(--c-muted)" }}
            >
              ขอบคุณที่แจ้งให้ทราบ
              <br />
              และขอบคุณสำหรับความรักที่มีให้เราเสมอ
            </p>
          </div>
        </>
      )}
    </form>
  )
}
