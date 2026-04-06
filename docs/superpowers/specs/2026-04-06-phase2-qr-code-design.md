# Phase 2: QR Code Generation — Design Spec

**Date:** 2026-04-06
**Status:** Approved

---

## Overview

Generate a high-res, plain black-and-white QR code pointing to `https://frommeenatothanwaforever.com`. Output as both SVG and PNG for use in physical print invitations and digital sharing.

---

## Script

**Location:** `scripts/generate-qr.mjs` (repo root)
**Run:** `node scripts/generate-qr.mjs` from repo root
**Dependency:** `qrcode` added as a dev dependency in `web/package.json`

---

## QR Configuration

| Parameter | Value | Reason |
|---|---|---|
| Data | `https://frommeenatothanwaforever.com` | Root domain, no trailing path |
| Error correction | `H` (30%) | Max redundancy; survives print damage; allows logo overlay later |
| Color | Black on white | Plain, maximum scan reliability across all lighting |
| Quiet zone | 4 modules | Standard border; required for reliable scanning |

---

## Output Files

| File | Spec | Use case |
|---|---|---|
| `web/public/qr.svg` | Pure SVG vector | Illustrator, Canva, any scalable print workflow |
| `web/public/qr.png` | 2000 × 2000 px | Direct use in invite designs (~300 DPI at ~6.5 cm) |

Both files are committed to the repo so they are always available without re-running the script.

---

## Out of Scope

- No website page or API route for the QR code
- No branded/styled QR (colors, logo center) — plain black & white only
- No print template or invite layout
