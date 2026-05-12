/**
 * lib/gemini-image.ts
 *
 * יצירת תמונת אירוע 1:1 חינמית לחלוטין.
 *
 * משתמש ב-Pollinations.ai (חינמי, ללא מפתח API).
 * שמורה שם זה נשמר כדי לא לשבור imports במקומות אחרים.
 */

import type { SanityClient } from "@sanity/client";
import { buildEventImagePrompt, buildEventCacheKey, type EventGroup } from "./image-prompts";

const POLLINATIONS_BASE = "https://image.pollinations.ai/prompt";

export interface GenerateImageParams {
  eventName: string;
  eventKey: string;
  group: EventGroup;
  hebrewYear: string;
  sanity: SanityClient;
}

export interface GeneratedImage {
  url: string;
  fromCache: boolean;
}

/**
 * יוצר או מאחזר תמונה לאירוע
 */
export async function generateEventImage(params: GenerateImageParams): Promise<GeneratedImage> {
  const { eventName, eventKey, group, hebrewYear, sanity } = params;
  const cacheKey = buildEventCacheKey(eventKey, hebrewYear);

  // 1. בדיקת cache ב-Sanity
  const cached = await sanity.fetch<{ imageUrl: string } | null>(
    `*[_type == "eventImage" && cacheKey == $key][0]{ "imageUrl": image.asset->url }`,
    { key: cacheKey }
  );

  if (cached?.imageUrl) {
    return { url: cached.imageUrl, fromCache: true };
  }

  // 2. יצירה דרך Pollinations (חינמי, ללא key)
  const prompt = buildEventImagePrompt({ eventName, eventKey, group });
  const seed = hashString(cacheKey); // seed דטרמיניסטי לקבוע - אותה תמונה גם בקריאה חוזרת

  const url = new URL(`${POLLINATIONS_BASE}/${encodeURIComponent(prompt)}`);
  url.searchParams.set("width", "1024");
  url.searchParams.set("height", "1024");
  url.searchParams.set("seed", seed.toString());
  url.searchParams.set("model", "flux"); // המודל החינמי האיכותי ביותר ב-Pollinations
  url.searchParams.set("nologo", "true");
  url.searchParams.set("enhance", "true");

  // הורדת הPNG
  const res = await fetch(url.toString(), {
    method: "GET",
    headers: { "User-Agent": "RoiAmgarSite/1.0" },
  });

  if (!res.ok) {
    throw new Error(`Pollinations error: ${res.status} ${res.statusText}`);
  }

  const contentType = res.headers.get("content-type") || "image/png";
  if (!contentType.startsWith("image/")) {
    const body = await res.text();
    throw new Error(`Unexpected content-type: ${contentType}. Body: ${body.slice(0, 200)}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (buffer.length < 1000) {
    throw new Error(`Image too small (${buffer.length} bytes) - likely an error response`);
  }

  // 3. העלאה ל-Sanity assets
  const ext = contentType.split("/")[1] || "png";
  const asset = await sanity.assets.upload("image", buffer, {
    filename: `event-${cacheKey}.${ext}`,
    contentType,
  });

  // 4. שמירת רשומת cache
  await sanity.create({
    _type: "eventImage",
    cacheKey,
    eventKey,
    eventName,
    hebrewYear,
    image: {
      _type: "image",
      asset: { _type: "reference", _ref: asset._id },
    },
    generatedAt: new Date().toISOString(),
  });

  return { url: asset.url, fromCache: false };
}

/** Hash מחרוזת ל-seed deterministi */
function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h) + s.charCodeAt(i);
    h |= 0; // 32-bit
  }
  return Math.abs(h);
}
