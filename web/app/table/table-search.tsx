"use client"

import { useState, useEffect, useTransition } from "react"
import { searchTable } from "./actions"

interface TableSearchResult {
  tableName: string
  guests: string[]
}

interface GuestSearchResult {
  guestName: string
  table: TableSearchResult | null
}

export function TableSearch() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<GuestSearchResult[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [hasSearched, setHasSearched] = useState(false)

  useEffect(() => {
    if (query.trim().length < 2) return
    const timer = setTimeout(() => {
      startTransition(async () => {
        setError(null)
        const res = await searchTable(query)
        setHasSearched(true)
        if ("error" in res) {
          setError(res.error)
          setResults(null)
        } else {
          setResults(res.results)
          setError(null)
        }
      })
    }, 400)
    return () => clearTimeout(timer)
  }, [query])

  return (
    <div>
      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            const val = e.target.value
            setQuery(val)
            if (val.trim().length < 2) {
              setResults(null)
              setHasSearched(false)
              setError(null)
            }
          }}
          placeholder="พิมพ์ชื่อของคุณ..."
          className="rsvp-input w-full"
          autoComplete="off"
          autoFocus
        />
        {isPending && (
          <span
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-[family-name:var(--font-josefin)] text-[10px] tracking-[0.2em] uppercase"
            style={{ color: "var(--c-muted)" }}
          >
            กำลังค้นหา...
          </span>
        )}
      </div>

      {/* Error */}
      {error && (
        <p
          className="mt-4 text-center font-[family-name:var(--font-sarabun)] text-sm"
          style={{ color: "var(--c-blush-deep)" }}
        >
          {error}
        </p>
      )}

      {/* No results */}
      {hasSearched && results && results.length === 0 && (
        <p
          className="mt-6 text-center font-[family-name:var(--font-sarabun)] text-sm"
          style={{ color: "var(--c-muted)" }}
        >
          ไม่พบชื่อของคุณในระบบ กรุณาลองใหม่
        </p>
      )}

      {/* Results */}
      {results && results.length > 0 && (
        <div className="mt-6 space-y-4">
          {results.map((result, i) => (
            <div
              key={i}
              className="rounded-sm border p-5"
              style={{
                borderColor: "var(--c-sage-light)",
                background: "rgba(255,255,255,0.6)",
              }}
            >
              {/* Guest name */}
              <p
                className="font-[family-name:var(--font-sarabun)] text-base font-normal"
                style={{ color: "var(--c-ink)" }}
              >
                {result.guestName}
              </p>

              {result.table ? (
                <>
                  {/* Table name */}
                  <p
                    className="mt-3 font-[family-name:var(--font-cormorant)] text-2xl font-bold"
                    style={{ color: "var(--c-blush-deep)" }}
                  >
                    โต๊ะ {result.table.tableName}
                  </p>

                  {/* Divider line */}
                  <div
                    className="my-3"
                    style={{
                      height: 1,
                      background: "var(--c-blush-deep)",
                      opacity: 0.6,
                    }}
                  />

                  {/* Tablemates */}
                  <p
                    className="mb-2 font-[family-name:var(--font-josefin)] text-[10px] tracking-[0.25em] uppercase"
                    style={{ color: "var(--c-muted)" }}
                  >
                    ผู้ร่วมโต๊ะ
                  </p>
                  <ul className="space-y-1">
                    {result.table.guests.map((name, j) => (
                      <li
                        key={j}
                        className="font-[family-name:var(--font-sarabun)] text-sm font-light"
                        style={{
                          color:
                            name === result.guestName
                              ? "var(--c-sage)"
                              : "var(--c-ink-2)",
                        }}
                      >
                        {name === result.guestName ? `● ${name}` : name}
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <p
                  className="mt-2 font-[family-name:var(--font-sarabun)] text-sm font-light"
                  style={{ color: "var(--c-muted)" }}
                >
                  ยังไม่ได้จัดโต๊ะ
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
