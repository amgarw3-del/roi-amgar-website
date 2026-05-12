/**
 * lib/image-overlay.ts
 *
 * מוסיף overlay טקסט עברי על תמונה קיימת דרך sharp + SVG.
 * מטרה: הוספת שם הפרשה/מועד ו"הרב רועי אמגר" בזהב מעל תמונת Pollinations.
 *
 * הגופן Heebo Bold נטען מ-Google Fonts פעם אחת ונשמר ב-memory cache.
 */

import sharp from "sharp";

let fontBase64Cache: string | null = null;

/**
 * טוען גופן Heebo Bold מ-Google Fonts ומחזיר כ-base64.
 * מגיש User-Agent ישן כדי לקבל TTF (ולא woff2 שאינו נתמך ב-SVG של librsvg).
 */
async function getHebrewFontBase64(): Promise<string> {
  if (fontBase64Cache) return fontBase64Cache;

  // בקשת CSS מ-Google Fonts עם UA ישן → מחזיר TTF URL
  const css = await fetch(
    "https://fonts.googleapis.com/css2?family=Heebo:wght@700",
    {
      headers: {
        "User-Agent":
          "Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1)",
      },
    }
  ).then((r) => r.text());

  // חיפוש URL הגופן ב-CSS
  const match = css.match(/url\((https?:\/\/[^)]+)\)/);
  if (!match) {
    throw new Error(`Could not extract font URL from Google Fonts CSS:\n${css.slice(0, 500)}`);
  }

  const fontBuf = await fetch(match[1]).then((r) => r.arrayBuffer());
  fontBase64Cache = Buffer.from(fontBuf).toString("base64");
  return fontBase64Cache;
}

/**
 * מוסיף overlay טקסט עברי (כותרת למעלה + subtitle למטה) על תמונה.
 *
 * @param imageBuffer - תמונת המקור (PNG/JPEG)
 * @param title - שם הפרשה / מועד בעברית (למשל "פרשת במדבר")
 * @param subtitle - טקסט תחתון, ברירת מחדל "הרב רועי אמגר"
 * @returns JPEG buffer עם הטקסט מוטמע
 */
export async function addHebrewTextOverlay(
  imageBuffer: Buffer,
  title: string,
  subtitle = "הרב רועי אמגר"
): Promise<Buffer> {
  const fontB64 = await getHebrewFontBase64();
  const W = 1024;
  const H = 1024;

  // SVG overlay: גרדיאנט כהה למעלה ולמטה + טקסט זהב
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <defs>
      <style>
        @font-face {
          font-family: 'Heebo';
          src: url('data:font/truetype;base64,${fontB64}') format('truetype');
          font-weight: 700;
        }
      </style>
      <linearGradient id="topGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   stop-color="#000000" stop-opacity="0.80"/>
        <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
      </linearGradient>
      <linearGradient id="botGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   stop-color="#000000" stop-opacity="0"/>
        <stop offset="100%" stop-color="#000000" stop-opacity="0.80"/>
      </linearGradient>
    </defs>

    <!-- פס כהה עליון לקריאות הכותרת -->
    <rect x="0" y="0" width="${W}" height="190" fill="url(#topGrad)"/>

    <!-- פס כהה תחתון לקריאות ה-subtitle -->
    <rect x="0" y="${H - 140}" width="${W}" height="140" fill="url(#botGrad)"/>

    <!-- כותרת ראשית — שם הפרשה / מועד -->
    <text
      x="${W / 2}" y="112"
      font-family="Heebo" font-weight="700" font-size="70"
      fill="#FFD700"
      text-anchor="middle"
      direction="rtl"
      dominant-baseline="middle"
    >${title}</text>

    <!-- כותרת משנית — שם הרב -->
    <text
      x="${W / 2}" y="${H - 46}"
      font-family="Heebo" font-weight="700" font-size="42"
      fill="#FFD700"
      text-anchor="middle"
      direction="rtl"
      dominant-baseline="middle"
    >${subtitle}</text>
  </svg>`;

  return sharp(imageBuffer)
    .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
    .jpeg({ quality: 92 })
    .toBuffer();
}
