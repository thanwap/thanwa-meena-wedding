import type { Metadata } from "next"
import Link from "next/link"
import { TableSearch } from "./table-search"

export const metadata: Metadata = {
  title: "ค้นหาโต๊ะ — Meena & Thanwa",
  description: "ค้นหาชื่อของคุณเพื่อดูโต๊ะที่นั่งในงานแต่งงาน",
}

function Diamond() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      className="shrink-0"
      style={{ color: "var(--c-blush)" }}
    >
      <path
        d="M7 1L13 7L7 13L1 7Z"
        stroke="currentColor"
        strokeWidth="0.8"
        fill="none"
      />
      <path
        d="M7 4L10 7L7 10L4 7Z"
        stroke="currentColor"
        strokeWidth="0.5"
        fill="none"
        opacity="0.4"
      />
    </svg>
  )
}

function Divider() {
  return (
    <div
      className="flex items-center gap-4 py-2"
      style={{ color: "var(--c-blush)" }}
    >
      <div
        className="flex-1"
        style={{ height: 1, background: "var(--c-blush)", opacity: 0.4 }}
      />
      <Diamond />
      <div
        className="flex-1"
        style={{ height: 1, background: "var(--c-blush)", opacity: 0.4 }}
      />
    </div>
  )
}

export default function TablePage() {
  return (
    <main
      className="flex min-h-svh flex-col items-center px-5 py-10"
      style={{ background: "var(--c-ivory)", color: "var(--c-ink)" }}
    >
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <p
            className="font-[family-name:var(--font-josefin)] text-[11px] tracking-[0.35em] uppercase"
            style={{ color: "var(--c-sage)" }}
          >
            Meena & Thanwa
          </p>
          <h1
            className="mt-2 font-[family-name:var(--font-cormorant)] text-2xl font-light italic"
            style={{ color: "var(--c-ink)" }}
          >
            ค้นหาโต๊ะของคุณ
          </h1>
          <Divider />
          <p
            className="mt-1 font-[family-name:var(--font-sarabun)] text-sm font-light"
            style={{ color: "var(--c-muted)" }}
          >
            พิมพ์ชื่อของคุณเพื่อค้นหาโต๊ะที่นั่ง
          </p>
        </div>

        {/* Search */}
        <TableSearch />

        {/* Back link */}
        <div className="mt-10 text-center">
          <Link
            href="/"
            className="font-[family-name:var(--font-josefin)] inline-flex items-center gap-2 text-[11px] tracking-[0.25em] uppercase"
            style={{ color: "var(--c-muted)" }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M9 2L4 7L9 12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            กลับหน้าหลัก
          </Link>
        </div>
      </div>
    </main>
  )
}
