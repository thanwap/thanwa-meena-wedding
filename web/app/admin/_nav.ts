import {
  RiCalendarCheckLine,
  RiLayoutGridLine,
  RiTable2,
  RiChatQuoteLine,
  RiImageLine,
  RiGalleryLine,
  RiUserLine,
  RiGiftLine,
} from "@remixicon/react"
import type { RemixiconComponentType } from "@remixicon/react"

export interface NavItem {
  href: string
  label: string
  icon: RemixiconComponentType
  superAdminOnly?: boolean
}

export interface NavGroup {
  label: string
  items: NavItem[]
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Guests",
    items: [
      {
        href: "/admin/rsvps",
        label: "RSVPs",
        icon: RiCalendarCheckLine,
      },
      {
        href: "/admin/seating",
        label: "Seating Chart",
        icon: RiLayoutGridLine,
      },
      {
        href: "/admin/seating/manage",
        label: "Seating Tables",
        icon: RiTable2,
      },
      {
        href: "/admin/gifts",
        label: "Gifts",
        icon: RiGiftLine,
      },
    ],
  },
  {
    label: "Content",
    items: [
      {
        href: "/admin/guestbook",
        label: "Guestbook",
        icon: RiChatQuoteLine,
      },
      {
        href: "/admin/prewedding",
        label: "Pre-wedding",
        icon: RiGalleryLine,
      },
      {
        href: "/admin/photos",
        label: "Photos",
        icon: RiImageLine,
      },
    ],
  },
  {
    label: "Admin",
    items: [
      {
        href: "/admin/users",
        label: "Users",
        icon: RiUserLine,
        superAdminOnly: true,
      },
    ],
  },
]
