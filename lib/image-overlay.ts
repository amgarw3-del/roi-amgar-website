/**
 * lib/image-overlay.ts
 *
 * מוסיף overlay טקסט עברי על תמונה קיימת.
 * גישה: opentype.js → SVG paths (pure-JS, ללא native binaries) → sharp composite.
 * יתרון: עובד על כל סביבה (Vercel, Edge, Windows, Linux) ללא תלות ב-librsvg/resvg.
 */

import sharp from "sharp";
import fs from "fs";
import path from "path";
// @ts-ignore — opentype.js has no TS declarations bundled
import opentype from "opentype.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let fontCache: any | null = null;

function getFont() {
  if (fontCache) return fontCache;
  const fontPath = path.join(process.cwd(), "public", "fonts", "Heebo-Bold.ttf");
  if (!fs.existsSync(fontPath)) throw new Error(`Font not found: ${fontPath}`);
  const buf = fs.readFileSync(fontPath);
  fontCache = opentype.parse(buf.buffer);
  return fontCache;
}

/**
 * ממיר מחרוזת RTL ל-SVG path string.
 * opentype.js מרנדר LTR — אנחנו הופכים את הסדר לפני כן כדי לקבל RTL.
 * cy = baseline (bottom of glyphs).
 */
function rtlToSvgPath(
  font: any,
  text: string,
  cx: number,
  cy: number,
  fontSize: number,
  color: string
): string {
  const reversed = [...text].reverse().join("");
  const glyphs: any[] = font.stringToGlyphs(reversed);
  const scale = fontSize / font.unitsPerEm;
  const totalW = glyphs.reduce((s: number, g: any) => s + (g.advanceWidth || 0) * scale, 0);
  let x = cx - totalW / 2;

  const parts: string[] = glyphs.map((g: any) => {
    const p = g.getPath(x, cy, fontSize);
    x += (g.advanceWidth || 0) * scale;
    return p.toSVG(2);
  });

  return `<g fill="${color}">${parts.join("")}</g>`;
}

/**
 * מוסיף overlay טקסט עברי (כותרת למעלה + subtitle למטה) על תמונה.
 *
 * @param imageBuffer - תמונת המקור (PNG/JPEG)
 * @param title       - שם הפרשה / מועד בעברית
 * @param subtitle    - טקסט תחתון, ברירת מחדל "הרב רועי אמגר"
 * @returns JPEG buffer עם הטקסט מוטמע
 */
export async function addHebrewTextOverlay(
  imageBuffer: Buffer,
  title: string,
  subtitle = "הרב רועי אמגר"
): Promise<Buffer> {
  const font = getFont();

  const meta = await sharp(imageBuffer).metadata();
  const W = meta.width ?? 1024;
  const H = meta.height ?? 1024;

  const scale = Math.min(W, H) / 1024;
  const titleSize  = Math.round(70 * scale);
  const subSize    = Math.round(42 * scale);
  const topBandH   = Math.round(170 * scale);
  const botBandH   = Math.round(120 * scale);
  const titleY     = Math.round(105 * scale);   // baseline
  const subY       = H - Math.round(42 * scale); // baseline

  const titlePath = rtlToSvgPath(font, title,    W / 2, titleY, titleSize, "#FFD700");
  const subPath   = rtlToSvgPath(font, subtitle, W / 2, subY,   subSize,   "#FFD700");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <defs>
      <linearGradient id="tg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   stop-color="#000" stop-opacity="0.78"/>
        <stop offset="100%" stop-color="#000" stop-opacity="0"/>
      </linearGradient>
      <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   stop-color="#000" stop-opacity="0"/>
        <stop offset="100%" stop-color="#000" stop-opacity="0.78"/>
      </linearGradient>
    </defs>
    <rect x="0" y="0"              width="${W}" height="${topBandH}" fill="url(#tg)"/>
    <rect x="0" y="${H - botBandH}" width="${W}" height="${botBandH}" fill="url(#bg)"/>
    ${titlePath}
    ${subPath}
  </svg>`;

  return sharp(imageBuffer)
    .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
    .jpeg({ quality: 92 })
    .toBuffer();
}
