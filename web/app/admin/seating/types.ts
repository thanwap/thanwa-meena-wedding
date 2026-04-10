export interface GuestDto {
  id: number
  rsvpId: number
  tableId: number | null
  name: string
  sortOrder: number
  rsvpName: string
}

export interface WeddingTableDto {
  id: number
  name: string
  capacity: number
  shape: "circle" | "rectangle"
  positionX: number
  positionY: number
  guests: GuestDto[]
}

export interface SeatingOverviewDto {
  tables: WeddingTableDto[]
  unassignedGuests: GuestDto[]
}
