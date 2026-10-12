# Portable Desk 🛸📄

> **pdfs are so goated.**  
> A bizarre, surreal, and genuinely useful PDF playground built 100% in your browser.

---

## 🌟 Overview

**Portable Desk** is a personal passion project designed as an imaginative digital playground. Instead of sterile corporate SaaS dashboards with paywalls, daily document quotas, and tracking scripts, Portable Desk delivers full-fledged PDF utilities inside a neon dark-fantasy workshop featuring:
- A floating grassy island with glowing streams and interactive pedestals.
- An organic pulsing purple goo upload portal (*"YES. FEED THE PORTAL."*).
- An animated CRT monitor contraption (*Scantron-9000*) with expressive digital faces.
- An industrial reactor machine with hazard stripes and a giant tactile coral `PROCESS!` button.
- A mischievous mascot cat peeking from the portal with quirky remarks.
- A synthesized Web Audio engine delivering retro pops, clicks, and celebratory fanfares (silent by default, toggleable).

---

## 🛠️ The 8 Functional PDF Tools

| Tool | Route / Pedestal | What It Does |
| :--- | :--- | :--- |
| **1. Merge PDF** | `/merge` | Combines multiple PDFs in custom order with optional **interactive PDF Bookmarks / Table of Contents** generation. |
| **2. Split PDF** | `/split` | Extracts page ranges (`1-3, 5, 8-12`), bursts all pages into individual PDFs, or chunks documents, downloading as a `.zip`. |
| **3. Organize PDF** | `/organize` | Visual page desk with drag-and-drop reordering, 90° rotation, page duplication, deletion, and undo/redo history. |
| **4. Compress PDF** | `/compress` | Honest compression featuring lossless structure repacking or canvas DPI downsampling (72/100/150 DPI) with exact byte diff reporting. |
| **5. PDF to Images** | `/pdf-to-images` | Converts PDF pages into crisp JPEG or PNG images with customizable resolution scale (1x, 1.5x, 2x) and ZIP packaging. |
| **6. Images to PDF** | `/images-to-pdf` | Stitches photos into a formatted PDF with A4/Letter/Fit sizing, portrait/landscape orientation, and margin offsets. |
| **7. Rotate PDF** | `/rotate` | Bulk or selective page rotation (90°, 180°, 270°) with live thumbnail preview. |
| **8. Add Page Numbers**| `/page-numbers` | Imprints sequential page numbering with 6 position anchors, format templates (`Page {n}`, `{n} / {total}`), colors, and cover-skip options. |

---

## 🔒 Absolute Privacy Architecture

- **100% Client-Side**: All document parsing and modifications happen strictly inside your device's memory using `pdf-lib` and Mozilla `pdfjs-dist`.
- **Zero Cloud Storage**: There is no backend, no database, no Firebase, and no cloud processing. Files are never uploaded across the internet.
- **Zero Tracking**: No Google Analytics, telemetry, cookies, or third-party ad pixels.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18.x or later)
- npm or yarn / pnpm

### Installation
```bash
git clone https://github.com/your-username/portable-desk.git
cd portable-desk
npm install
```

### Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### Production Build
```bash
npm run build
```
The compiled static website will be created in the `dist/` directory.

---

## ☁️ Deployment to Cloudflare Pages

1. Push your repository to **GitHub**.
2. Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com) and navigate to **Workers & Pages** ➔ **Create Application** ➔ **Pages** ➔ **Connect to Git**.
3. Select your repository and configure the build settings:
   - **Framework preset**: `Vite` (or `None`)
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
4. The repository already contains `public/_redirects` (`/* /index.html 200`), ensuring all client-side routes fallback cleanly without 404 errors.
5. Click **Save and Deploy**.

### Custom Domain Setup
In your Cloudflare Pages project:
1. Navigate to **Custom Domains** ➔ **Set up a custom domain**.
2. Enter your domain or subdomain (e.g., `portabledesk.yourdomain.com`).
3. Cloudflare will automatically provision SSL/TLS and activate the domain.

---

## 📝 Known PDF Library Limitations & Notes

- **Password Protected / Encrypted PDFs**: `pdf-lib` will attempt to parse standard PDFs; heavily encrypted or DRM-restricted files will trigger a friendly error alert.
- **Advanced Dynamic XFA Forms**: `pdf-lib` preserves standard static AcroForms; complex dynamic Adobe LiveCycle XFA XML structures may not retain script bindings.
- **Lossless vs. Raster Compression**: Text-only and vector PDFs are already compressed with FlateDecode. Compressing them losslessly cleans metadata; downsample mode rasterizes pages to JPEG, which will convert selectable text into images.

---

## 🧠 Made with strong mentality

Built with love, unreasonable curiosity, strong mentality, and care for privacy.
