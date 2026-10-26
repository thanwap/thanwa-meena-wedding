/** The pre-wedding shots guests pick from on the clothesline. Order is the
    order on the line; ids are what a letter stores, so never renumber them. */
export interface Postcard {
  id: number
  src: string
  caption: string
  alt: string
  /** CSS object-position keeping faces in frame wherever the photo is cropped */
  focus: string
}

export const POSTCARDS: Postcard[] = [
  {
    id: 1,
    src: "/guestbook/postcard-1.webp",
    caption: "หัวเราะด้วยกัน",
    alt: "ธันวากับมีนาใส่แว่นกันแดด หัวเราะกอดกันบนสนามหญ้า",
    focus: "50% 25%",
  },
  {
    id: 6,
    src: "/guestbook/postcard-6.webp",
    caption: "หัวใจชิดกัน",
    alt: "มีนาในชุดเจ้าสาวซบลงบนศีรษะธันวา ทั้งคู่ใส่แว่นกันแดดบนสนามหญ้า",
    focus: "50% 30%",
  },
  {
    id: 2,
    src: "/guestbook/postcard-2.webp",
    caption: "เดินไปด้วยกัน",
    alt: "ทั้งคู่จูงมือเดินบนสะพานไม้ริมทะเล ใต้กิ่งสน",
    focus: "50% 90%",
  },
  {
    id: 3,
    src: "/guestbook/postcard-3.webp",
    caption: "ร่มคันเดียวกัน",
    alt: "ทั้งคู่ยืนพิงกันใต้ร่มใสริมคลื่น",
    focus: "50% 40%",
  },
  {
    id: 4,
    src: "/guestbook/postcard-4.webp",
    caption: "หมุนไปกับคลื่น",
    alt: "ภาพขาวดำ ทั้งคู่จับมือหมุนตัวเล่นน้ำริมชายหาด",
    focus: "50% 60%",
  },
  {
    id: 7,
    src: "/guestbook/postcard-7.webp",
    caption: "วิ่งขึ้นเนินไปด้วยกัน",
    alt: "เจ้าสาวกับเจ้าบ่าวหันมายิ้ม ขณะวิ่งขึ้นเนินหญ้าใต้ฟ้าครึ้ม",
    focus: "50% 62%",
  },
  {
    id: 5,
    src: "/guestbook/postcard-5.webp",
    caption: "แด่ความรักของเรา",
    alt: "ทั้งคู่ยิ้มชนแก้วแชมเปญริมทะเลยามเย็น",
    focus: "50% 0%",
  },
]

export function getPostcard(id: number): Postcard {
  return POSTCARDS.find((p) => p.id === id) ?? POSTCARDS[0]
}

/** Entries saved before guests could choose a card get a stable one by id */
export function postcardForEntry(entryId: number): number {
  const n = POSTCARDS.length
  return POSTCARDS[(((entryId - 1) % n) + n) % n].id
}

/** "50% 30%" → [0.5, 0.3], for cropping on a canvas */
export function focusFractions(focus: string): [number, number] {
  const [x, y] = focus.split(" ").map((v) => parseFloat(v) / 100)
  return [Number.isFinite(x) ? x : 0.5, Number.isFinite(y) ? y : 0.5]
}
