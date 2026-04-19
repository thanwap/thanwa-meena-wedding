"use client"

import { useState, useTransition } from "react"
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

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (query.trim().length < 2) return

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
  }

  return (
    <div>
      {/* Search Form */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="พิมพ์ชื่อของคุณ..."
          className="rsvp-input flex-1"
          autoComplete="off"
          autoFocus
        />
        <button
          type="submit"
          disabled={isPending || query.trim().length < 2}
          className="shrink-0 rounded-none border px-5 py-2 font-[family-name:var(--font-josefin)] text-xs tracking-[0.15em] uppercase transition-colors disabled:opacity-40"
          style={{
            borderColor: "var(--c-sage)",
            color: isPending ? "var(--c-muted)" : "var(--c-sage)",
            background: "transparent",
          }}
        >
          {isPending ? "กำลังค้นหา..." : "ค้นหา"}
        </button>
      </form>

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
