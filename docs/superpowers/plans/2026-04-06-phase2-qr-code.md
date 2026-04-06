# Phase 2: QR Code Generation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generate a high-res black-and-white QR code (SVG + 2000×2000 PNG) pointing to `https://frommeenatothanwaforever.com`, committed to the repo for use in print invitations and digital sharing.

**Architecture:** A single Node.js ESM script (`web/scripts/generate-qr.mjs`) uses the `qrcode` package to write two output files into `web/public/`. Run once manually; outputs are committed. No application code or routes are added.

**Tech Stack:** Node.js (ESM), `qrcode` npm package

---

### Task 1: Install the `qrcode` dependency

**Files:**
- Modify: `web/package.json`
- Modify: `web/package-lock.json` (auto-updated by npm)

- [ ] **Step 1: Install as dev dependency**

Run from the `web/` directory:

```bash
cd web && npm install --save-dev qrcode @types/qrcode
```

Expected output: `added N packages` with no errors.

- [ ] **Step 2: Verify it appears in package.json**

Check that `web/package.json` now contains:

```json
"devDependencies": {
  "qrcode": "...",
  "@types/qrcode": "..."
}
```

- [ ] **Step 3: Commit**

```bash
git add web/package.json web/package-lock.json
git commit -m "chore: add qrcode dev dependency"
```

---

### Task 2: Write the generation script

**Files:**
- Create: `web/scripts/generate-qr.mjs`

- [ ] **Step 1: Create the scripts directory and file**

Create `web/scripts/generate-qr.mjs` with this exact content:

```js
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
```

- [ ] **Step 2: Commit the script**

```bash
git add web/scripts/generate-qr.mjs
git commit -m "feat: add QR code generation script"
```

---

### Task 3: Run the script and verify outputs

**Files:**
- Output: `web/public/qr.svg`
- Output: `web/public/qr.png`

- [ ] **Step 1: Run the script from the `web/` directory**

```bash
cd web && node scripts/generate-qr.mjs
```

Expected output:
```
✓ web/public/qr.svg written
✓ web/public/qr.png written
```

If you see an error like `Cannot find package 'qrcode'`, make sure you ran `npm install` in `web/` (Task 1).

- [ ] **Step 2: Verify the SVG file**

```bash
head -3 web/public/qr.svg
```

Expected: starts with `<?xml` or `<svg` — a valid XML/SVG document.

- [ ] **Step 3: Verify the PNG dimensions**

```bash
file web/public/qr.png
```

Expected output includes: `PNG image data, 2000 x 2000`

- [ ] **Step 4: Scan the QR code**

Open `web/public/qr.png` in any image viewer and scan with your phone camera. Confirm it navigates to `https://frommeenatothanwaforever.com`.

- [ ] **Step 5: Commit the generated files**

```bash
git add web/public/qr.svg web/public/qr.png
git commit -m "feat: add generated QR code (SVG + PNG) for print invitations"
```

---

### Task 4: Mark Phase 2 complete

**Files:**
- Modify: `PHASES.md`

- [ ] **Step 1: Check off Phase 2 tasks in PHASES.md**

Update `PHASES.md` — change:

```markdown
### Phase 2: QR Code & Print
- [ ] Generate high-res QR Code (SVG/PNG) pointing to root domain
- [ ] Test scan in various lighting conditions
```

to:

```markdown
### Phase 2: QR Code & Print
- [x] Generate high-res QR Code (SVG/PNG) pointing to root domain
- [x] Test scan in various lighting conditions
```

- [ ] **Step 2: Commit**

```bash
git add PHASES.md
git commit -m "chore: mark Phase 2 complete in PHASES.md"
```

---

## Done

`web/public/qr.svg` and `web/public/qr.png` are committed and ready to drop into Canva, Illustrator, or any invite design workflow.
