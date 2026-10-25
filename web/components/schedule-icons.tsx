/* Hand-drawn illustrations matching the printed invitation card timeline. */

const OUTLINE = "#8B6B4E"

type IconProps = { className?: string }

/* 13.00 — Khan Mak: banana/sugarcane plant on a pedestal tray */
export function KhanMakIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 80 80" className={className} aria-hidden>
      {/* stalks */}
      <path d="M40 54 C39 44 40 32 41 18" stroke="#6E8F5E" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <path d="M37 54 C35 46 33 38 30 30" stroke="#6E8F5E" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      {/* leaves */}
      <path d="M41 22 C47 14 54 12 60 13 C54 17 48 21 41 24 Z" fill="#9CBF7E" stroke="#5F7F4F" strokeWidth="0.6" />
      <path d="M40 26 C33 18 26 16 20 18 C26 21 33 25 40 28 Z" fill="#8DB46F" stroke="#5F7F4F" strokeWidth="0.6" />
      <path d="M41 33 C49 29 56 30 62 34 C55 35 48 35 41 36 Z" fill="#A9C98C" stroke="#5F7F4F" strokeWidth="0.6" />
      <path d="M39 38 C31 34 24 35 18 39 C25 40 32 40 39 41 Z" fill="#9CBF7E" stroke="#5F7F4F" strokeWidth="0.6" />
      <path d="M41 16 C42 10 44 6 47 4 C46 9 44 13 42 18 Z" fill="#B5D199" stroke="#5F7F4F" strokeWidth="0.6" />
      <path d="M31 31 C26 26 22 25 18 26 C22 29 26 31 31 33 Z" fill="#B5D199" stroke="#5F7F4F" strokeWidth="0.6" />
      <path d="M40 46 C46 43 51 44 55 47 C50 48 45 48 40 49 Z" fill="#8DB46F" stroke="#5F7F4F" strokeWidth="0.6" />
      {/* pedestal tray */}
      <path d="M22 54 H58 C57 61 50 65 40 65 C30 65 23 61 22 54 Z" fill="#E3CDA6" stroke={OUTLINE} strokeWidth="0.8" />
      <path d="M24 58 H56" stroke="#C9A57A" strokeWidth="1.4" />
      <path d="M35 65 L36 71 H44 L45 65" fill="#D9BE94" stroke={OUTLINE} strokeWidth="0.8" />
      <path d="M30 71 H50 L52 75 H28 Z" fill="#E3CDA6" stroke={OUTLINE} strokeWidth="0.8" />
      <ellipse cx="40" cy="54" rx="18" ry="2.2" fill="#EAD9B9" stroke={OUTLINE} strokeWidth="0.8" />
    </svg>
  )
}

/* 14.45 — Water blessing: conch shell resting on a bronze bowl */
export function ConchIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 80 80" className={className} aria-hidden>
      {/* bowl */}
      <path d="M14 46 H66 C64 58 54 64 40 64 C26 64 16 58 14 46 Z" fill="#D2B184" stroke={OUTLINE} strokeWidth="0.8" />
      <path d="M17 52 H63" stroke="#A9825A" strokeWidth="2.4" strokeDasharray="2 2" />
      <path d="M33 64 L35 70 H45 L47 64" fill="#C9A57A" stroke={OUTLINE} strokeWidth="0.8" />
      <path d="M28 70 H52 L54 74 H26 Z" fill="#D2B184" stroke={OUTLINE} strokeWidth="0.8" />
      <ellipse cx="40" cy="46" rx="26" ry="3" fill="#E3CDA6" stroke={OUTLINE} strokeWidth="0.8" />
      {/* conch: gold-capped spire (left), pink aperture opening upward, gold-tipped spout (right) */}
      <path
        d="M10 26 L16 22.5 L20 19.5 L25 16.5 C29 13.5 37 12 45 13 C53 14 59 19 63 25 C66 29 69 33 73 36.5 C69 38 64 38.5 60 38.5 C54 41 46 44 38 44.5 C30 45 24 41.5 21 36.5 L16 31.5 Z"
        fill="#F7EDE0"
        stroke={OUTLINE}
        strokeWidth="0.8"
        strokeLinejoin="round"
      />
      {/* body banding */}
      <path d="M28 16 C32 23 32 34 28 41.5" stroke="#D3B48F" strokeWidth="1.4" fill="none" strokeLinecap="round" />
      <path d="M36 15 C40 23 40 34 37 44" stroke="#D3B48F" strokeWidth="1.4" fill="none" strokeLinecap="round" />
      <path d="M45 23 C48 29 48 36 46 42" stroke="#D3B48F" strokeWidth="1.4" fill="none" strokeLinecap="round" />
      {/* aperture opening upward along the top edge */}
      <path d="M39 13.2 C50 13.2 58 18 63 25 C66 29 69 33 73 36.5 C66 34.5 58 30 51 25 C46 21.5 42 17.5 39 13.2 Z" fill="#F2C3B8" stroke={OUTLINE} strokeWidth="0.7" strokeLinejoin="round" />
      <path d="M44 16 C51 20 59 27 68 34" stroke="#DE9E92" strokeWidth="0.9" fill="none" strokeLinecap="round" />
      {/* spire whorls + gold cap and band */}
      <path d="M17 21.8 C18.6 25 18.6 29 17.5 32.3" stroke="#B88A64" strokeWidth="0.9" fill="none" />
      <path d="M8 26 L16.5 22 C17.8 25 17.8 28 16.8 31.6 Z" fill="#E2B65C" stroke={OUTLINE} strokeWidth="0.7" strokeLinejoin="round" />
      <path d="M21.5 19 C23.5 23.5 23.5 31 21.5 36.5" stroke="#E2B65C" strokeWidth="2.6" fill="none" />
      <path d="M21.5 19 C23.5 23.5 23.5 31 21.5 36.5" stroke="#B98A2E" strokeWidth="0.6" strokeDasharray="1 1.2" fill="none" />
      {/* gold spout tip */}
      <path d="M68 34.5 L76 37 L69 39 Z" fill="#E2B65C" stroke={OUTLINE} strokeWidth="0.6" strokeLinejoin="round" />    </svg>
  )
}

/* 17.30 — Vows: two interlocking gold rings */
export function RingsIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 80 80" className={className} aria-hidden>
      <circle cx="32" cy="46" r="15" fill="none" stroke="#C9963F" strokeWidth="4.5" />
      <circle cx="32" cy="46" r="15" fill="none" stroke="#E8BE6A" strokeWidth="2" />
      <circle cx="50" cy="46" r="15" fill="none" stroke="#C9963F" strokeWidth="4.5" />
      <circle cx="50" cy="46" r="15" fill="none" stroke="#E8BE6A" strokeWidth="2" />
      {/* redraw overlap so the rings interlock */}
      <path d="M36.5 31.7 A15 15 0 0 1 45.9 31.6" fill="none" stroke="#C9963F" strokeWidth="4.5" />
      <path d="M36.5 31.7 A15 15 0 0 1 45.9 31.6" fill="none" stroke="#E8BE6A" strokeWidth="2" />
      {/* diamond setting */}
      <path d="M50 31 L46 27 L48 22 H52 L54 27 Z" fill="#EAF4F8" stroke="#8FAFC0" strokeWidth="0.8" />
      <path d="M46 27 H54 M48 22 L50 27 L52 22" stroke="#8FAFC0" strokeWidth="0.6" fill="none" />
      <path d="M57 19 L58 21 L60 22 L58 23 L57 25 L56 23 L54 22 L56 21 Z" fill="#E8BE6A" />
    </svg>
  )
}

/* 18.00 — Dinner: wooden table with cross-back chairs and flowers */
export function DinnerIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 80 80" className={className} aria-hidden>
      {/* chairs (behind table) */}
      {[22, 48].map((x) => (
        <g key={x} stroke={OUTLINE} strokeWidth="0.8">
          <rect x={x} y="22" width="12" height="24" rx="1.5" fill="none" stroke="#B98A5E" strokeWidth="2.2" />
          <path d={`M${x + 1} 23 L${x + 11} 45 M${x + 11} 23 L${x + 1} 45`} stroke="#B98A5E" strokeWidth="1.6" />
        </g>
      ))}
      {/* table top */}
      <path d="M8 44 H72 L70 50 H10 Z" fill="#C99A6B" stroke={OUTLINE} strokeWidth="0.8" />
      <path d="M10 50 H70 V53 H10 Z" fill="#B0814F" stroke={OUTLINE} strokeWidth="0.8" />
      {/* legs */}
      <path d="M14 53 V74 M66 53 V74" stroke="#A0744A" strokeWidth="3" strokeLinecap="round" />
      <path d="M22 53 V70 M58 53 V70" stroke="#B0814F" strokeWidth="2" strokeLinecap="round" />
      {/* flowers */}
      <path d="M10 44 C9 39 12 36 15 38 C13 40 12 42 12 44 Z" fill="#9CBF7E" />
      <path d="M22 44 C24 40 27 39 29 41 C26 42 24 43 23 44 Z" fill="#8DB46F" />
      <circle cx="14" cy="40" r="3.2" fill="#F6F1EA" stroke="#D9C9B6" strokeWidth="0.6" />
      <circle cx="19" cy="38" r="3.6" fill="#F2C6C2" stroke="#D9A39D" strokeWidth="0.6" />
      <circle cx="24" cy="41" r="2.8" fill="#F6F1EA" stroke="#D9C9B6" strokeWidth="0.6" />
      <circle cx="18" cy="42.5" r="2.2" fill="#E8B4AE" />
      <circle cx="19" cy="38" r="1.1" fill="#D9A39D" />
      <circle cx="62" cy="41.5" r="2.4" fill="#F6F1EA" stroke="#D9C9B6" strokeWidth="0.6" />
      <circle cx="66" cy="42" r="2" fill="#F2C6C2" />
    </svg>
  )
}

/* 21.00 — After party: bride & groom */
export function CoupleIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 80 80" className={className} aria-hidden>
      {/* bride dress + veil (behind groom) */}
      <path d="M44 14 C50 18 56 34 66 58 C70 66 74 72 76 76 H58 Z" fill="#F4F1EC" stroke="#CFC6BA" strokeWidth="0.6" opacity="0.9" />
      <path d="M41 28 C45 28 47 32 47 38 L54 76 H34 L38 38 C38 32 38 28 41 28 Z" fill="#FFFFFF" stroke="#CFC6BA" strokeWidth="0.8" />
      <path d="M38 76 C42 70 48 70 54 76" stroke="#E2DBD0" strokeWidth="0.8" fill="none" />
      {/* bride head */}
      <circle cx="42" cy="20" r="4.2" fill="#F1D3BC" stroke={OUTLINE} strokeWidth="0.6" />
      <path d="M38 19 C38 14 46 14 46.5 19 C45 17 40 17 38 19 Z" fill="#4A3A30" />
      <circle cx="45.5" cy="16" r="1.4" fill="#F2C6C2" />
      {/* bouquet */}
      <circle cx="40" cy="40" r="2.6" fill="#F2C6C2" />
      <circle cx="43" cy="41" r="2" fill="#C5D8C0" />
      {/* groom */}
      <path d="M26 30 C27 27 35 27 36 30 L37 52 H25 Z" fill="#2D2A28" stroke="#1C1A19" strokeWidth="0.6" />
      <path d="M29 29 L31 35 L33 29 Z" fill="#FFFFFF" />
      <path d="M26 52 H30 L30.5 75 H27 Z M32 52 H36 L35.5 75 H32 Z" fill="#2D2A28" />
      <path d="M26 75 H31 M31.5 75 H36.5" stroke="#1C1A19" strokeWidth="1.6" strokeLinecap="round" />
      {/* groom head, leaning toward bride */}
      <circle cx="34" cy="22" r="4.4" fill="#E9C3A6" stroke={OUTLINE} strokeWidth="0.6" />
      <path d="M29.6 21 C29.6 16 37 15 38.4 20 C36 18 32 18 29.6 21 Z" fill="#2A211C" />
    </svg>
  )
}
