/**
 * lib/image-overlay.ts
 *
 * מוסיף overlay טקסט עברי על תמונה קיימת דרך sharp + SVG.
 * מטרה: הוספת שם הפרשה/מועד ו"הרב רועי אמגר" בזהב מעל תמונת Pollinations.
 *
 * הגופן Heebo-Bold-Hebrew.woff מגיע מ-public/fonts/ (מקוּנן בפרויקט).
 */

import sharp from "sharp";
import fs from "fs";
import path from "path";

let fontBase64Cache: string | null = null;

/**
 * קורא את גופן Heebo Hebrew Bold מ-public/fonts/ ומחזיר base64.
 * מאוחסן ב-memory cache למהירות.
 */
function getHebrewFontBase64(): string {
  if (fontBase64Cache) return fontBase64Cache;
  const fontPath = path.join(process.cwd(), "public", "fonts", "Heebo-Bold-Hebrew.woff");
  fontBase64Cache = fs.readFileSync(fontPath).toString("base64");
  return fontBase64Cache;
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
  const fontB64 = getHebrewFontBase64();

  // קרא ממדי התמונה בפועל (Pollinations לא תמיד מחזיר 1024×1024)
  const meta = await sharp(imageBuffer).metadata();
  const W = meta.width ?? 1024;
  const H = meta.height ?? 1024;

  // scale רספונסיבי לפי גודל התמונה
  const scale = Math.min(W, H) / 1024;
  const titleSize  = Math.round(70 * scale);
  const subSize    = Math.round(42 * scale);
  const topBandH   = Math.round(190 * scale);
  const botBandH   = Math.round(140 * scale);
  const titleY     = Math.round(112 * scale);
  const subY       = H - Math.round(46 * scale);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <defs>
      <style>
        @font-face {
          font-family: 'Heebo';
          src: url('data:font/woff;base64,${fontB64}') format('woff');
          font-weight: 700;
        }
      </style>
      <linearGradient id="tg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   stop-color="#000" stop-opacity="0.82"/>
        <stop offset="100%" stop-color="#000" stop-opacity="0"/>
      </linearGradient>
      <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   stop-color="#000" stop-opacity="0"/>
        <stop offset="100%" stop-color="#000" stop-opacity="0.82"/>
      </linearGradient>
    </defs>

    <!-- פסי גרדיאנט -->
    <rect x="0" y="0"          width="${W}" height="${topBandH}" fill="url(#tg)"/>
    <rect x="0" y="${H - botBandH}" width="${W}" height="${botBandH}" fill="url(#bg)"/>

    <!-- כותרת ראשית -->
    <text x="${W / 2}" y="${titleY}"
      font-family="Heebo" font-weight="700" font-size="${titleSize}"
      fill="#FFD700" text-anchor="middle"
      direction="rtl" dominant-baseline="middle"
    >${title}</text>

    <!-- כותרת משנית -->
    <text x="${W / 2}" y="${subY}"
      font-family="Heebo" font-weight="700" font-size="${subSize}"
      fill="#FFD700" text-anchor="middle"
      direction="rtl" dominant-baseline="middle"
    >${subtitle}</text>
  </svg>`;

  return sharp(imageBuffer)
    .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
    .jpeg({ quality: 92 })
    .toBuffer();
}
