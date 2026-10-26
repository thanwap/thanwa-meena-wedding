/** Sounds for posting a letter, synthesised with Web Audio so there are no
    files to fetch: a paper rustle when the card is lifted, a whoosh while it
    flies to the box, and a paper tap plus a soft two-note chime when it lands.
    Create it inside the send click — iOS only lets audio start from a gesture. */
export interface SendSound {
  pickup(): void
  whoosh(ms: number): void
  land(): void
}

export function createSendSound(): SendSound | null {
  const Ctx =
    window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctx) return null
  const ctx = new Ctx()
  ctx.resume().catch(() => {})
  const master = ctx.createGain()
  master.gain.value = 0.7
  master.connect(ctx.destination)

  const noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate)
  const data = noise.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1

  /** Filtered noise with a gain envelope — the basis of every paper sound */
  function burst(start: number, length: number, filter: BiquadFilterNode, peak: number, attack: number) {
    const src = ctx.createBufferSource()
    src.buffer = noise
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0, start)
    gain.gain.linearRampToValueAtTime(peak, start + attack)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + length)
    src.connect(filter).connect(gain).connect(master)
    src.start(start, Math.random())
    src.stop(start + length + 0.05)
  }

  function bell(start: number, freq: number, peak: number) {
    for (const [mult, level] of [
      [1, 1],
      [2.01, 0.25],
    ] as const) {
      const osc = ctx.createOscillator()
      osc.type = "sine"
      osc.frequency.value = freq * mult
      const gain = ctx.createGain()
      gain.gain.setValueAtTime(0, start)
      gain.gain.linearRampToValueAtTime(peak * level, start + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 1.4)
      osc.connect(gain).connect(master)
      osc.start(start)
      osc.stop(start + 1.5)
    }
  }

  return {
    pickup() {
      const t = ctx.currentTime
      const band = ctx.createBiquadFilter()
      band.type = "bandpass"
      band.Q.value = 1.2
      band.frequency.setValueAtTime(1400, t)
      band.frequency.exponentialRampToValueAtTime(3200, t + 0.14)
      burst(t, 0.16, band, 0.22, 0.012)
    },
    whoosh(ms) {
      const t = ctx.currentTime
      const len = ms / 1000
      const band = ctx.createBiquadFilter()
      band.type = "bandpass"
      band.Q.value = 0.8
      band.frequency.setValueAtTime(380, t)
      band.frequency.exponentialRampToValueAtTime(1500, t + len * 0.45)
      band.frequency.exponentialRampToValueAtTime(520, t + len)
      burst(t, len, band, 0.16, len * 0.45)
    },
    land() {
      const t = ctx.currentTime
      const low = ctx.createBiquadFilter()
      low.type = "lowpass"
      low.frequency.value = 1100
      burst(t, 0.12, low, 0.45, 0.004)

      const thump = ctx.createOscillator()
      thump.frequency.setValueAtTime(150, t)
      thump.frequency.exponentialRampToValueAtTime(70, t + 0.14)
      const thumpGain = ctx.createGain()
      thumpGain.gain.setValueAtTime(0.22, t)
      thumpGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.16)
      thump.connect(thumpGain).connect(master)
      thump.start(t)
      thump.stop(t + 0.2)

      // E6 then B6: a small, bright "delivered"
      bell(t + 0.16, 1318.5, 0.07)
      bell(t + 0.27, 1975.5, 0.06)
    },
  }
}
