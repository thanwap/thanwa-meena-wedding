"use client"

import { FILTER_PRESETS, type FilterName } from "@/lib/image-filters"

interface Props {
  current: FilterName
  onChange: (filter: FilterName) => void
}

export function FilterSelector({ current, onChange }: Props) {
  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        overflowX: "auto",
        padding: "0 16px 4px",
        scrollbarWidth: "none",
      }}
    >
      {FILTER_PRESETS.map((preset) => {
        const active = current === preset.id
        return (
          <button
            key={preset.id}
            onClick={() => onChange(preset.id)}
            style={{
              flexShrink: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "4px 8px",
            }}
          >
            {/* Preview swatch */}
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 8,
                background: "rgba(255,255,255,0.15)",
                border: active
                  ? "2px solid rgba(232,195,190,0.95)"
                  : "2px solid rgba(255,255,255,0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "border-color 0.2s ease",
              }}
            >
              {/* Camera film icon */}
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                style={{
                  color: active
                    ? "rgba(232,195,190,1)"
                    : "rgba(255,255,255,0.7)",
                  filter:
                    preset.id !== "none" && preset.id !== "bw-classic"
                      ? preset.css
                      : preset.id === "bw-classic"
                        ? "grayscale(1)"
                        : undefined,
                }}
              >
                <circle
                  cx="12"
                  cy="12"
                  r="9"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <circle cx="12" cy="12" r="4" fill="currentColor" opacity="0.4" />
                <circle cx="12" cy="12" r="1.5" fill="currentColor" />
              </svg>
            </div>
            <span
              style={{
                fontFamily: "var(--font-josefin)",
                fontSize: 9,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: active ? "rgba(232,195,190,1)" : "rgba(255,255,255,0.65)",
                whiteSpace: "nowrap",
                transition: "color 0.2s ease",
              }}
            >
              {preset.labelTh}
            </span>
          </button>
        )
      })}
    </div>
  )
}
