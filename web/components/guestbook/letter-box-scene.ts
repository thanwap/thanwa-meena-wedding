import * as THREE from "three"
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js"
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js"
import type { DropPoint } from "./postcard-composer"

export interface SceneLetter {
  id: number
  name: string
  message: string
  photoSrc: string
  /** Crop focal point as fractions, matching the DOM postcard's object-position */
  photoFocus: [number, number]
}

export interface LetterBoxScene {
  /** Sync the pile; `dropId` falls in through the slot instead of appearing in place */
  setLetters(letters: SceneLetter[], dropId?: number | null): void
  /** Screen point and width the composer should fly the postcard to */
  getDropPoint(): DropPoint | null
  /** Pause rendering while offscreen */
  setActive(active: boolean): void
  dispose(): void
}

// World units. The box sits on a plinth whose top is y = 0.
const BOX_W = 3.0
const BOX_D = 1.9
const BOX_H = 1.45
const WALL = 0.035
const EDGE = 0.03
const SLOT_W = 1.0
const SLOT_D = 0.12
const SLOT_Z = 0.3
const CARD_W = 0.78
const CARD_H = 0.54
const CARD_T = 0.012
/** Where a dropped letter appears, upright above the slot */
const DROP_START = new THREE.Vector3(0, BOX_H + 0.75, SLOT_Z)
const DROP_MS = 1500
/** Older letters beyond this stay out of the box to keep texture memory sane on phones */
export const MAX_LETTERS = 28

const TEX_W = 512
const TEX_H = Math.round((TEX_W * CARD_H) / CARD_W)
const PAPER = "#FBF8F1"
const INK = "#34436A"
const BLUSH = "#E8C3BE"
const BLUSH_DEEP = "#B8847E"

/* ── Texture painting ───────────────────────────── */

const photoCache = new Map<string, Promise<HTMLImageElement>>()
function loadPhoto(src: string) {
  let p = photoCache.get(src)
  if (!p) {
    p = new Promise((resolve, reject) => {
      const img = new Image()
      img.decoding = "async"
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = src
    })
    photoCache.set(src, p)
  }
  return p
}

/** Thai has no spaces between words, so wrap on dictionary word boundaries */
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number) {
  const words =
    typeof Intl.Segmenter === "function"
      ? Array.from(new Intl.Segmenter("th", { granularity: "word" }).segment(text.replace(/\s+/g, " ")), (s) => s.segment)
      : Array.from(text)
  const lines: string[] = []
  let line = ""
  for (const word of words) {
    if (ctx.measureText(line + word).width > maxWidth && line) {
      lines.push(line.trimEnd())
      line = word.trimStart()
      if (lines.length === maxLines) break
    } else {
      line += word
    }
  }
  if (lines.length < maxLines && line) lines.push(line.trimEnd())
  if (lines.length === maxLines && lines.join("").length < text.replace(/\s+/g, " ").trim().length) {
    lines[maxLines - 1] = lines[maxLines - 1].replace(/.{0,2}$/u, "") + "…"
  }
  return lines
}

/** The hero logo recoloured in stamp ink, ready to stamp onto letter textures */
let stampLogo: Promise<HTMLCanvasElement> | null = null
function loadStampLogo() {
  stampLogo ??= loadPhoto("/wedding-logo-transparent.png").then((logo) => {
    const c = document.createElement("canvas")
    c.width = logo.width
    c.height = logo.height
    const ctx = c.getContext("2d")!
    ctx.drawImage(logo, 0, 0)
    ctx.globalCompositeOperation = "source-in"
    ctx.fillStyle = BLUSH_DEEP
    ctx.fillRect(0, 0, c.width, c.height)
    return c
  })
  return stampLogo
}

function paintLetter(
  canvas: HTMLCanvasElement,
  letter: SceneLetter,
  photo: HTMLImageElement | null,
  logo: HTMLCanvasElement | null,
  font: string,
) {
  const ctx = canvas.getContext("2d")!
  const w = canvas.width
  const h = canvas.height
  ctx.fillStyle = PAPER
  ctx.fillRect(0, 0, w, h)

  // Photo half, cropped around the same focal point as the DOM postcard
  const pw = Math.round(w * 0.43)
  if (photo) {
    const scale = Math.max(pw / photo.width, h / photo.height)
    const sw = pw / scale
    const sh = h / scale
    const [fx, fy] = letter.photoFocus
    ctx.drawImage(photo, (photo.width - sw) * fx, (photo.height - sh) * fy, sw, sh, 0, 0, pw, h)
  } else {
    ctx.fillStyle = "#E9E0D2"
    ctx.fillRect(0, 0, pw, h)
  }

  const x = pw + 26
  const right = w - 22
  ctx.fillStyle = INK
  ctx.textBaseline = "alphabetic"
  ctx.font = `26px ${font}`
  ctx.fillText("ถึง ธันวา & มีนา", x, 56)

  // Stamp
  // Stamp: landscape, carrying the hero logo like the DOM postcard
  ctx.fillStyle = BLUSH
  ctx.fillRect(right - 62, 20, 62, 44)
  ctx.fillStyle = "#FBF3EF"
  ctx.fillRect(right - 57, 25, 52, 34)
  if (logo) {
    const lw = 44
    const lh = (lw * logo.height) / logo.width
    ctx.drawImage(logo, right - 31 - lw / 2, 42 - lh / 2, lw, lh)
  }

  // Ruled lines + message
  const lineGap = 42
  ctx.strokeStyle = "rgba(232,195,190,0.75)"
  ctx.lineWidth = 2
  for (let y = 112; y < h - 70; y += lineGap) {
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(right, y)
    ctx.stroke()
  }
  ctx.fillStyle = INK
  ctx.font = `24px ${font}`
  wrapText(ctx, letter.message, right - x, 4).forEach((line, i) => ctx.fillText(line, x + 2, 106 + i * lineGap))

  ctx.font = `26px ${font}`
  const from = wrapText(ctx, `จาก ${letter.name}`, right - x, 1)[0] ?? ""
  ctx.fillText(from, x, h - 28)
}

/** Paper cut-out cake topper of the couple, with a white sticker outline */
function paintTopper(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d")!
  const ink = "#2F3A2B"
  const skin = "#EBC9AE"
  const shapes: { path: Path2D; fill: string; line?: string }[] = []
  const add = (fill: string, build: (p: Path2D) => void, line?: string) => {
    const path = new Path2D()
    build(path)
    shapes.push({ path, fill, line })
  }

  // Groom
  add(ink, (p) => p.rect(166, 336, 48, 150))
  add(ink, (p) => {
    p.moveTo(140, 226)
    p.quadraticCurveTo(190, 206, 240, 226)
    p.lineTo(226, 350)
    p.lineTo(154, 350)
    p.closePath()
  })
  add("#FFFFFF", (p) => {
    p.moveTo(178, 216)
    p.lineTo(202, 216)
    p.lineTo(190, 268)
    p.closePath()
  })
  add(BLUSH_DEEP, (p) => {
    p.moveTo(180, 222)
    p.lineTo(190, 228)
    p.lineTo(200, 222)
    p.lineTo(200, 234)
    p.lineTo(190, 228)
    p.lineTo(180, 234)
    p.closePath()
  })
  add(skin, (p) => p.arc(190, 170, 36, 0, Math.PI * 2))
  add(ink, (p) => {
    p.moveTo(154, 166)
    p.quadraticCurveTo(160, 124, 196, 128)
    p.quadraticCurveTo(230, 134, 226, 166)
    p.quadraticCurveTo(206, 146, 154, 166)
  })

  // Bride — veil first so the dress overlaps it
  add("rgba(255,255,255,0.92)", (p) => {
    p.moveTo(336, 150)
    p.quadraticCurveTo(392, 210, 410, 440)
    p.lineTo(350, 440)
    p.quadraticCurveTo(352, 260, 330, 190)
    p.closePath()
  }, BLUSH)
  add("#FFFDF8", (p) => {
    p.moveTo(300, 246)
    p.lineTo(342, 246)
    p.quadraticCurveTo(372, 380, 398, 486)
    p.quadraticCurveTo(322, 498, 246, 486)
    p.quadraticCurveTo(274, 380, 300, 246)
    p.closePath()
  }, BLUSH_DEEP)
  add("#FFFDF8", (p) => p.rect(300, 204, 42, 48), BLUSH_DEEP)
  add(skin, (p) => p.arc(321, 166, 33, 0, Math.PI * 2))
  add(ink, (p) => {
    p.moveTo(287, 168)
    p.quadraticCurveTo(290, 126, 324, 128)
    p.quadraticCurveTo(358, 132, 354, 170)
    p.quadraticCurveTo(334, 146, 287, 168)
    p.moveTo(356, 150)
    p.arc(344, 140, 14, 0, Math.PI * 2)
  })
  // Bouquet + joined hands
  add("#8AA882", (p) => p.arc(270, 300, 20, 0, Math.PI * 2))
  for (const [cx, cy, c] of [
    [262, 292, BLUSH],
    [278, 296, "#F2C4CE"],
    [268, 308, BLUSH_DEEP],
    [282, 310, BLUSH],
  ] as const) {
    add(c, (p) => p.arc(cx, cy, 8, 0, Math.PI * 2))
  }
  add(ink, (p) => {
    p.moveTo(226, 250)
    p.quadraticCurveTo(250, 286, 262, 300)
    p.lineTo(254, 306)
    p.quadraticCurveTo(236, 284, 218, 262)
    p.closePath()
  })

  // Heart above them
  add(BLUSH_DEEP, (p) => {
    p.moveTo(255, 104)
    p.bezierCurveTo(222, 82, 226, 50, 247, 50)
    p.bezierCurveTo(253, 50, 255, 56, 255, 60)
    p.bezierCurveTo(255, 56, 257, 50, 263, 50)
    p.bezierCurveTo(284, 50, 288, 82, 255, 104)
  })

  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.lineJoin = "round"
  ctx.lineCap = "round"
  ctx.strokeStyle = "#FFFFFF"
  ctx.lineWidth = 22
  for (const s of shapes) ctx.stroke(s.path)
  for (const s of shapes) {
    ctx.fillStyle = s.fill
    ctx.fill(s.path)
    if (s.line) {
      ctx.strokeStyle = s.line
      ctx.lineWidth = 3
      ctx.stroke(s.path)
    }
  }
}

function softShadowTexture() {
  const c = document.createElement("canvas")
  c.width = c.height = 128
  const ctx = c.getContext("2d")!
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
  g.addColorStop(0, "rgba(92,72,48,0.35)")
  g.addColorStop(1, "rgba(92,72,48,0)")
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 128, 128)
  return new THREE.CanvasTexture(c)
}

/* ── Helpers ────────────────────────────────────── */

function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const easeIn = (t: number) => t * t
const easeOutCubic = (t: number) => 1 - (1 - t) ** 3
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)
/** A single soft bounce as the letter lands on the pile */
const easeOutSettle = (t: number) => {
  if (t < 0.7) return easeIn(t / 0.7)
  const u = (t - 0.7) / 0.3
  return 1 - Math.sin(u * Math.PI) * 0.06
}

interface LetterMesh {
  mesh: THREE.Mesh
  texture: THREE.CanvasTexture
  material: THREE.MeshStandardMaterial
  rest: THREE.Vector3
  restQuat: THREE.Quaternion
  lift: number
  drop: { start: number; from: THREE.Vector3 } | null
}

/* ── Scene ──────────────────────────────────────── */

export function createLetterBoxScene(
  container: HTMLElement,
  opts: { onPick: (id: number) => void; onLand: (id: number) => void; reducedMotion: boolean; handFont: string },
): LetterBoxScene {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.NeutralToneMapping
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  const canvas = renderer.domElement
  canvas.style.cssText = "display:block;width:100%;height:100%;touch-action:pan-y;outline:none"
  canvas.setAttribute("aria-hidden", "true")
  container.appendChild(canvas)

  // Loop state — declared up front because setup (resize) already requests a frame
  let active = false
  let frame = 0
  let disposed = false
  let rotTarget = 0
  /** Pitch: tipping the lid toward or away from the viewer */
  let tiltTarget = 0

  const scene = new THREE.Scene()
  const pmrem = new THREE.PMREMGenerator(renderer)
  const envTarget = pmrem.fromScene(new RoomEnvironment(), 0.04)
  scene.environment = envTarget.texture
  scene.environmentIntensity = 0.55

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50)
  const lookAt = new THREE.Vector3(0, 0.95, 0)
  const viewDir = new THREE.Vector3(0, 0.55, 1).normalize()

  scene.add(new THREE.HemisphereLight(0xfff8ee, 0xc5d8c0, 1.1))
  const sun = new THREE.DirectionalLight(0xfff1dc, 1.9)
  sun.position.set(-2.6, 6, 3.6)
  sun.castShadow = true
  sun.shadow.mapSize.set(1024, 1024)
  sun.shadow.camera.left = sun.shadow.camera.bottom = -2.6
  sun.shadow.camera.right = sun.shadow.camera.top = 2.6
  sun.shadow.normalBias = 0.02
  sun.shadow.radius = 4
  scene.add(sun)

  // Tilt pivots at the box's middle; the box itself spins on its own vertical axis
  const pivot = new THREE.Group()
  pivot.position.y = BOX_H / 2
  scene.add(pivot)
  const group = new THREE.Group()
  group.position.y = -BOX_H / 2
  pivot.add(group)
  const disposables: { dispose(): void }[] = [envTarget, pmrem]
  const track = <T extends { dispose(): void }>(d: T) => (disposables.push(d), d)

  // Plinth + soft floor shadow
  const plinth = new THREE.Mesh(
    track(new RoundedBoxGeometry(BOX_W + 0.4, 0.14, BOX_D + 0.4, 3, 0.04)),
    track(new THREE.MeshStandardMaterial({ color: 0xefe4d2, roughness: 0.75 })),
  )
  plinth.position.y = -0.07
  plinth.receiveShadow = true
  group.add(plinth)
  const floor = new THREE.Mesh(
    track(new THREE.PlaneGeometry(BOX_W + 2.4, BOX_D + 2.2)),
    track(new THREE.MeshBasicMaterial({ map: track(softShadowTexture()), transparent: true, depthWrite: false })),
  )
  floor.rotation.x = -Math.PI / 2
  floor.position.y = -0.15
  group.add(floor)

  // Clear acrylic: faint panels, brighter polished edges carry the shape
  const acrylic = track(
    new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      roughness: 0.04,
      metalness: 0,
      clearcoat: 1,
      clearcoatRoughness: 0.04,
      transparent: true,
      opacity: 0.14,
      envMapIntensity: 1.6,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  )
  const edgeMat = track(
    new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      roughness: 0.1,
      clearcoat: 1,
      transparent: true,
      opacity: 0.55,
      envMapIntensity: 1.4,
      depthWrite: false,
    }),
  )
  const slab = (w: number, h: number, d: number, x: number, y: number, z: number, mat = acrylic) => {
    const m = new THREE.Mesh(track(new THREE.BoxGeometry(w, h, d)), mat)
    m.position.set(x, y, z)
    m.renderOrder = mat === edgeMat ? 2 : 1
    group.add(m)
    return m
  }
  slab(BOX_W, BOX_H, WALL, 0, BOX_H / 2, BOX_D / 2)
  slab(BOX_W, BOX_H, WALL, 0, BOX_H / 2, -BOX_D / 2)
  slab(WALL, BOX_H, BOX_D, BOX_W / 2, BOX_H / 2, 0)
  slab(WALL, BOX_H, BOX_D, -BOX_W / 2, BOX_H / 2, 0)
  // Lid, built around the slot
  const sideW = (BOX_W - SLOT_W) / 2
  slab(sideW, WALL, BOX_D, -(SLOT_W + sideW) / 2, BOX_H, 0)
  slab(sideW, WALL, BOX_D, (SLOT_W + sideW) / 2, BOX_H, 0)
  const frontD = BOX_D / 2 - (SLOT_Z + SLOT_D / 2)
  const backD = SLOT_Z - SLOT_D / 2 + BOX_D / 2
  slab(SLOT_W, WALL, frontD, 0, BOX_H, BOX_D / 2 - frontD / 2)
  slab(SLOT_W, WALL, backD, 0, BOX_H, -BOX_D / 2 + backD / 2)
  // Edges: 4 uprights, top and bottom rims, slot rim
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) slab(EDGE, BOX_H, EDGE, (sx * BOX_W) / 2, BOX_H / 2, (sz * BOX_D) / 2, edgeMat)
  for (const y of [0.01, BOX_H]) {
    for (const sz of [-1, 1]) slab(BOX_W, EDGE, EDGE, 0, y, (sz * BOX_D) / 2, edgeMat)
    for (const sx of [-1, 1]) slab(EDGE, EDGE, BOX_D, (sx * BOX_W) / 2, y, 0, edgeMat)
  }
  for (const sz of [-1, 1]) slab(SLOT_W, EDGE, EDGE, 0, BOX_H + 0.005, SLOT_Z + (sz * SLOT_D) / 2, edgeMat)
  for (const sx of [-1, 1]) slab(EDGE, EDGE, SLOT_D, (sx * SLOT_W) / 2, BOX_H + 0.005, SLOT_Z, edgeMat)

  // Couple topper standing on the lid behind the slot
  const topperCanvas = document.createElement("canvas")
  topperCanvas.width = topperCanvas.height = 512
  paintTopper(topperCanvas)
  const topperTex = track(new THREE.CanvasTexture(topperCanvas))
  topperTex.colorSpace = THREE.SRGBColorSpace
  topperTex.anisotropy = renderer.capabilities.getMaxAnisotropy()
  const topper = new THREE.Mesh(
    track(new THREE.PlaneGeometry(1.15, 1.15)),
    track(new THREE.MeshStandardMaterial({ map: topperTex, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.9 })),
  )
  // Pivot at the feet so the sway rocks from the lid
  const topperPivot = new THREE.Group()
  topperPivot.position.set(0, BOX_H + WALL / 2 - 0.05, SLOT_Z - 0.42)
  topper.position.y = 0.575
  topper.castShadow = true
  topperPivot.add(topper)
  group.add(topperPivot)

  /* ── Letters ── */
  const lettersGroup = new THREE.Group()
  group.add(lettersGroup)
  const cardGeo = track(new THREE.BoxGeometry(CARD_W, CARD_H, CARD_T))
  const paperMat = track(new THREE.MeshStandardMaterial({ color: 0xf6f0e4, roughness: 0.9 }))
  const letters = new Map<number, LetterMesh>()

  function restFor(id: number, index: number) {
    const rand = mulberry32(id * 7919 + 17)
    const mx = BOX_W / 2 - CARD_W / 2 - 0.12
    const mz = BOX_D / 2 - CARD_H / 2 - 0.12
    const pos = new THREE.Vector3((rand() * 2 - 1) * mx, 0.012 + index * 0.017, (rand() * 2 - 1) * mz)
    const quat = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(-Math.PI / 2 + (rand() - 0.5) * 0.08, (rand() - 0.5) * 1.6, (rand() - 0.5) * 0.06, "YXZ"),
    )
    return { pos, quat }
  }

  function makeLetter(letter: SceneLetter): LetterMesh {
    const c = document.createElement("canvas")
    c.width = TEX_W
    c.height = TEX_H
    paintLetter(c, letter, null, null, opts.handFont)
    const texture = new THREE.CanvasTexture(c)
    texture.colorSpace = THREE.SRGBColorSpace
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy()
    const material = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.85 })
    // BoxGeometry groups: +x, -x, +y, -y, +z (front), -z (back)
    const mesh = new THREE.Mesh(cardGeo, [paperMat, paperMat, paperMat, paperMat, material, paperMat])
    mesh.castShadow = true
    mesh.receiveShadow = true
    mesh.userData.id = letter.id

    // Repaint once the photo and the handwriting font are both ready
    Promise.all([
      loadPhoto(letter.photoSrc),
      loadStampLogo().catch(() => null),
      document.fonts?.load(`24px ${opts.handFont}`, "ถึง").catch(() => {}),
    ])
      .then(([photo, logo]) => {
        if (disposed) return
        paintLetter(c, letter, photo, logo, opts.handFont)
        texture.needsUpdate = true
      })
      .catch(() => {})
    return { mesh, texture, material, rest: new THREE.Vector3(), restQuat: new THREE.Quaternion(), lift: 0, drop: null }
  }

  function setLetters(list: SceneLetter[], dropId?: number | null) {
    const shown = list.slice(-MAX_LETTERS)
    const keep = new Set(shown.map((l) => l.id))
    for (const [id, l] of letters) {
      if (keep.has(id)) continue
      lettersGroup.remove(l.mesh)
      l.texture.dispose()
      l.material.dispose()
      letters.delete(id)
    }
    shown.forEach((letter, index) => {
      let l = letters.get(letter.id)
      const isNew = !l
      if (!l) {
        l = makeLetter(letter)
        letters.set(letter.id, l)
        lettersGroup.add(l.mesh)
      }
      const { pos, quat } = restFor(letter.id, index)
      l.rest.copy(pos)
      l.restQuat.copy(quat)
      if (isNew && letter.id === dropId && !opts.reducedMotion) {
        l.drop = { start: performance.now(), from: DROP_START.clone() }
        l.mesh.position.copy(DROP_START)
        l.mesh.quaternion.identity()
        rotTarget = 0
        tiltTarget = 0
      } else if (!l.drop) {
        l.mesh.position.copy(pos)
        l.mesh.quaternion.copy(quat)
        if (isNew && letter.id === dropId) opts.onLand(letter.id)
      }
    })
    requestRender()
  }

  /* ── Sizing ── */
  function resize() {
    const w = container.clientWidth
    const h = container.clientHeight
    if (!w || !h) return
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    // Fit the box (with plinth) horizontally and the topper vertically
    const vHalf = THREE.MathUtils.degToRad(camera.fov / 2)
    const hHalf = Math.atan(Math.tan(vHalf) * camera.aspect)
    const dist = Math.max(2.0 / Math.tan(hHalf), 1.7 / Math.tan(vHalf))
    camera.position.copy(lookAt).addScaledVector(viewDir, dist)
    camera.lookAt(lookAt)
    camera.updateProjectionMatrix()
    requestRender()
  }
  const resizeObserver = new ResizeObserver(resize)
  resizeObserver.observe(container)
  resize()

  /* ── Pointer: drag to turn and tilt the box, tap a letter to read it ── */
  const raycaster = new THREE.Raycaster()
  const ndc = new THREE.Vector2()
  let pointer: { id: number; x: number; y: number; rot: number; tilt: number; dragging: boolean } | null = null
  let hovered: number | null = null

  function letterAt(clientX: number, clientY: number): number | null {
    const r = canvas.getBoundingClientRect()
    ndc.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1)
    raycaster.setFromCamera(ndc, camera)
    const hit = raycaster.intersectObjects(lettersGroup.children, false)[0]
    return hit ? (hit.object.userData.id as number) : null
  }
  function onDown(e: PointerEvent) {
    pointer = { id: e.pointerId, x: e.clientX, y: e.clientY, rot: rotTarget, tilt: tiltTarget, dragging: false }
  }
  function onMove(e: PointerEvent) {
    if (pointer && pointer.id === e.pointerId) {
      const dx = e.clientX - pointer.x
      const dy = e.clientY - pointer.y
      // A mouse may start in any direction. A finger must start sideways: a vertical
      // start is the page scrolling (touch-action: pan-y); once a sideways drag owns
      // the gesture, its vertical part tilts the box as well.
      const sideways = Math.abs(dx) > Math.abs(dy)
      if (!pointer.dragging && Math.hypot(dx, dy) > 6 && (e.pointerType === "mouse" || sideways)) {
        pointer.dragging = true
        canvas.setPointerCapture(e.pointerId)
        canvas.style.cursor = "grabbing"
      }
      if (pointer.dragging) {
        rotTarget = THREE.MathUtils.clamp(pointer.rot + dx * 0.006, -0.75, 0.75)
        tiltTarget = THREE.MathUtils.clamp(pointer.tilt + dy * 0.005, -0.3, 0.4)
        requestRender()
      }
      return
    }
    if (e.pointerType === "mouse") {
      const id = letterAt(e.clientX, e.clientY)
      if (id !== hovered) {
        hovered = id
        canvas.style.cursor = id === null ? "grab" : "pointer"
        requestRender()
      }
    }
  }
  function onUp(e: PointerEvent) {
    if (!pointer || pointer.id !== e.pointerId) return
    const wasDrag = pointer.dragging
    pointer = null
    if (wasDrag) {
      canvas.style.cursor = "grab"
      return
    }
    const id = letterAt(e.clientX, e.clientY)
    if (id !== null) opts.onPick(id)
  }
  function onLeave() {
    hovered = null
    canvas.style.cursor = ""
  }
  canvas.style.cursor = "grab"
  canvas.addEventListener("pointerdown", onDown)
  canvas.addEventListener("pointermove", onMove)
  canvas.addEventListener("pointerup", onUp)
  canvas.addEventListener("pointercancel", onUp)
  canvas.addEventListener("pointerleave", onLeave)

  /* ── Loop ── */
  const clock = new THREE.Clock()
  const tmpQuat = new THREE.Quaternion()

  function requestRender() {
    if (!frame && !disposed) frame = requestAnimationFrame(tick)
  }

  function tick() {
    frame = 0
    const t = clock.getElapsedTime()
    const now = performance.now()
    let busy = false

    // Let go and the box drifts back to its resting angle; tilt returns sooner
    if (!pointer?.dragging) {
      rotTarget *= 0.996
      tiltTarget *= 0.985
    }
    const idle = opts.reducedMotion ? 0 : Math.sin(t * 0.45) * 0.1
    const goal = rotTarget + idle
    group.rotation.y += (goal - group.rotation.y) * 0.08
    pivot.rotation.x += (tiltTarget - pivot.rotation.x) * 0.08
    if (Math.abs(goal - group.rotation.y) > 0.0005 || Math.abs(tiltTarget - pivot.rotation.x) > 0.0005) busy = true
    if (!opts.reducedMotion) topperPivot.rotation.z = Math.sin(t * 1.3) * 0.025

    for (const [id, l] of letters) {
      if (l.drop) {
        const p = Math.min(1, (now - l.drop.start) / DROP_MS)
        const split = 0.4
        if (p < split) {
          // Straight down through the slot, still upright
          const a = easeIn(p / split)
          l.mesh.position.set(l.drop.from.x, THREE.MathUtils.lerp(l.drop.from.y, BOX_H - 0.3, a), l.drop.from.z)
          l.mesh.quaternion.setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.sin(p * 18) * 0.03)
        } else {
          // Tumble flat onto the pile
          const b = (p - split) / (1 - split)
          l.mesh.position.set(
            THREE.MathUtils.lerp(l.drop.from.x, l.rest.x, easeOutCubic(b)),
            THREE.MathUtils.lerp(BOX_H - 0.3, l.rest.y, easeOutSettle(b)),
            THREE.MathUtils.lerp(l.drop.from.z, l.rest.z, easeOutCubic(b)),
          )
          l.mesh.quaternion.copy(tmpQuat.identity()).slerp(l.restQuat, easeInOutCubic(b))
        }
        if (p >= 1) {
          l.drop = null
          opts.onLand(id)
          l.mesh.position.copy(l.rest)
          l.mesh.quaternion.copy(l.restQuat)
        }
        busy = true
        continue
      }
      const liftGoal = id === hovered ? 0.07 : 0
      l.lift += (liftGoal - l.lift) * 0.2
      if (Math.abs(liftGoal - l.lift) > 0.001) busy = true
      l.mesh.position.y = l.rest.y + l.lift
    }

    renderer.render(scene, camera)
    // Keep animating while visible (idle sway); otherwise only until motion settles
    if (active && (busy || !opts.reducedMotion)) requestRender()
  }

  function getDropPoint(): DropPoint | null {
    const r = canvas.getBoundingClientRect()
    if (!r.width) return null
    // The box is turning back to face front, so project with no rotation
    const toScreen = (v: THREE.Vector3) => {
      const p = v.clone().project(camera)
      return { x: r.left + ((p.x + 1) / 2) * r.width, y: r.top + ((1 - p.y) / 2) * r.height }
    }
    rotTarget = 0
    tiltTarget = 0
    const c = toScreen(DROP_START)
    const left = toScreen(DROP_START.clone().setX(-CARD_W / 2))
    const right = toScreen(DROP_START.clone().setX(CARD_W / 2))
    requestRender()
    return { x: c.x, y: c.y, width: right.x - left.x }
  }

  return {
    setLetters,
    getDropPoint,
    setActive(next) {
      active = next
      if (next) requestRender()
    },
    dispose() {
      disposed = true
      cancelAnimationFrame(frame)
      resizeObserver.disconnect()
      canvas.removeEventListener("pointerdown", onDown)
      canvas.removeEventListener("pointermove", onMove)
      canvas.removeEventListener("pointerup", onUp)
      canvas.removeEventListener("pointercancel", onUp)
      canvas.removeEventListener("pointerleave", onLeave)
      for (const l of letters.values()) {
        l.texture.dispose()
        l.material.dispose()
      }
      disposables.forEach((d) => d.dispose())
      renderer.dispose()
      canvas.remove()
    },
  }
}
