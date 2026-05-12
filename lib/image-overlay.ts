/**
 * lib/image-overlay.ts
 *
 * מוסיף overlay טקסט עברי על תמונה קיימת.
 * משתמש ב-@resvg/resvg-js (Rust/WASM) שתומך ב-@font-face + TTF natively —
 * בניגוד ל-librsvg של sharp שלא תומך בכך על Vercel.
 */

import { Resvg } from "@resvg/resvg-js";
import sharp from "sharp";
import fs from "fs";
import path from "path";

let fontBufferCache: Buffer | null = null;

function getHeeboFontBuffer(): Buffer {
  if (fontBufferCache) return fontBufferCache;
  const p = path.join(process.cwd(), "public", "fonts", "Heebo-Bold.ttf");
  if (!fs.existsSync(p)) throw new Error(`Font not found: ${p}`);
  fontBufferCache = fs.readFileSync(p);
  return fontBufferCache;
}

/**
 * מוסיף overlay טקסט עברי (כותרת למעלה + subtitle למטה) על תמונה.
 *
 * @param imageBuffer - תמונת המקור (PNG/JPEG)
 * @param title       - שם הפרשה / מועד בעברית (למשל "פרשת במדבר")
 * @param subtitle    - טקסט תחתון, ברירת מחדל "הרב רועי אמגר"
 * @returns JPEG buffer עם הטקסט מוטמע
 */
export async function addHebrewTextOverlay(
  imageBuffer: Buffer,
  title: string,
  subtitle = "הרב רועי אמגר"
): Promise<Buffer> {
  const fontBuffer = getHeeboFontBuffer();

  // קרא ממדי התמונה בפועל
  const meta = await sharp(imageBuffer).metadata();
  const W = meta.width ?? 1024;
  const H = meta.height ?? 1024;

  const scale = Math.min(W, H) / 1024;
  const titleSize  = Math.round(72 * scale);
  const subSize    = Math.round(44 * scale);
  const topBandH   = Math.round(200 * scale);
  const botBandH   = Math.round(140 * scale);
  const titleY     = Math.round(118 * scale);
  const subY       = H - Math.round(52 * scale);

  // SVG עם גרדיאנטים ו-text — ללא @font-face (resvg טוען דרך fontFiles)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <defs>
      <linearGradient id="tg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   stop-color="#000" stop-opacity="0.80"/>
        <stop offset="100%" stop-color="#000" stop-opacity="0"/>
      </linearGradient>
      <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   stop-color="#000" stop-opacity="0"/>
        <stop offset="100%" stop-color="#000" stop-opacity="0.80"/>
      </linearGradient>
    </defs>

    <!-- פסי גרדיאנט -->
    <rect x="0" y="0"              width="${W}" height="${topBandH}" fill="url(#tg)"/>
    <rect x="0" y="${H - botBandH}" width="${W}" height="${botBandH}" fill="url(#bg)"/>

    <!-- כותרת ראשית -->
    <text
      x="${W / 2}" y="${titleY}"
      font-family="Heebo" font-weight="700" font-size="${titleSize}"
      fill="#FFD700" text-anchor="middle"
      direction="rtl" unicode-bidi="bidi-override"
      dominant-baseline="middle"
    >${title}</text>

    <!-- כותרת משנית -->
    <text
      x="${W / 2}" y="${subY}"
      font-family="Heebo" font-weight="700" font-size="${subSize}"
      fill="#FFD700" text-anchor="middle"
      direction="rtl" unicode-bidi="bidi-override"
      dominant-baseline="middle"
    >${subtitle}</text>
  </svg>`;

  // רנדור SVG ל-PNG דרך resvg (תומך TTF natively)
  const resvg = new Resvg(svg, {
    font: {
      fontBuffers: [fontBuffer],
      loadSystemFonts: false,
      defaultFontFamily: "Heebo",
    },
  });

  const overlayPng = Buffer.from(resvg.render().asPng());

  // הדבקת ה-overlay על תמונת המקור
  return sharp(imageBuffer)
    .composite([{ input: overlayPng, top: 0, left: 0 }])
    .jpeg({ quality: 92 })
    .toBuffer();
}
