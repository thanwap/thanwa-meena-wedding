// web/scripts/generate-qr.mjs
// Run from web/ directory: node scripts/generate-qr.mjs
import QRCode from 'qrcode'
import { writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PUBLIC = resolve(__dirname, '..', 'public')
const URL = 'https://frommeenatothanwaforever.com'
const OPTS = { errorCorrectionLevel: 'H', margin: 4 }

// SVG — vector, infinitely scalable
const svg = await QRCode.toString(URL, { ...OPTS, type: 'svg' })
writeFileSync(resolve(PUBLIC, 'qr.svg'), svg, 'utf8')
console.log('✓ web/public/qr.svg written')

// PNG — 2000×2000 px raster
await QRCode.toFile(resolve(PUBLIC, 'qr.png'), URL, {
  ...OPTS,
  type: 'png',
  width: 2000,
})
console.log('✓ web/public/qr.png written')
