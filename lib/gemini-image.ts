/**
 * lib/gemini-image.ts
 *
 * יצירת תמונת אירוע 1:1 דרך Gemini image generation API.
 * הטקסט העברי (שם הפרשה/מועד + "הרב רועי אמגר") מועבר ישירות ב-prompt
 * כדי שGemini יייצר אותם כחלק מהתמונה.
 *
 * Fallback: Pollinations.ai אם Gemini נכשל.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import type { SanityClient } from "@sanity/client";
import { buildEventImagePrompt, buildEventCacheKey, type EventGroup } from "./image-prompts";
import { addHebrewTextOverlay } from "./image-overlay";

const GEMINI_IMAGE_MODEL = "gemini-2.0-flash-preview-image-generation";
const POLLINATIONS_BASE   = "https://image.pollinations.ai/prompt";

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
 * יוצר או מאחזר תמונה לאירוע.
 * 1. cache hit → מחזיר מ-Sanity.
 * 2. Gemini image generation → תמונה עם כיתובים עבריים.
 * 3. fallback: Pollinations (ללא כיתובים) אם Gemini נכשל.
 */
export async function generateEventImage(params: GenerateImageParams): Promise<GeneratedImage> {
  const { eventName, eventKey, group, hebrewYear, sanity } = params;
  const cacheKey = buildEventCacheKey(eventKey, hebrewYear);

  // 1. בדיקת cache
  const cached = await sanity.fetch<{ imageUrl: string } | null>(
    `*[_type == "eventImage" && cacheKey == $key][0]{ "imageUrl": image.asset->url }`,
    { key: cacheKey }
  );
  if (cached?.imageUrl) return { url: cached.imageUrl, fromCache: true };

  // 2. ניסיון ב-Gemini
  let buffer: Buffer | null = null;
  let contentType = "image/png";

  if (process.env.GEMINI_API_KEY) {
    try {
      const result = await generateWithGemini(eventName, eventKey, group);
      buffer = result.buffer;
      contentType = result.mimeType;
    } catch (e) {
      console.warn("Gemini image generation failed, falling back to Pollinations:", e);
    }
  }

  // 3. fallback — Pollinations
  if (!buffer) {
    buffer = await generateWithPollinations(eventName, eventKey, group, cacheKey);
    contentType = "image/png";
  }

  // 4. overlay טקסט עברי (resvg + Heebo TTF)
  try {
    buffer = await addHebrewTextOverlay(buffer, eventName);
    contentType = "image/jpeg";
  } catch (e) {
    console.warn("Hebrew text overlay failed, using raw image:", e);
  }

  // 5. העלאה ל-Sanity assets
  const ext = contentType.split("/")[1]?.split("+")[0] || "jpg";
  const asset = await sanity.assets.upload("image", buffer, {
    filename: `event-${cacheKey}.${ext}`,
    contentType,
  });

  // 6. שמירת cache
  await sanity.create({
    _type: "eventImage",
    cacheKey,
    eventKey,
    eventName,
    hebrewYear,
    image: { _type: "image", asset: { _type: "reference", _ref: asset._id } },
    generatedAt: new Date().toISOString(),
  });

  return { url: asset.url, fromCache: false };
}

// ─── Gemini ─────────────────────────────────────────────────────────────────

async function generateWithGemini(
  eventName: string,
  eventKey: string,
  group: EventGroup
): Promise<{ buffer: Buffer; mimeType: string }> {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

  const model = genAI.getGenerativeModel({
    model: GEMINI_IMAGE_MODEL,
  });

  const prompt = buildEventImagePrompt({ eventName, eventKey, group });

  const result = await (model as any).generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      responseModalities: ["IMAGE", "TEXT"],
    },
  });

  const parts = result?.response?.candidates?.[0]?.content?.parts ?? [];
  for (const part of parts) {
    if (part.inlineData?.data) {
      return {
        buffer:   Buffer.from(part.inlineData.data, "base64"),
        mimeType: part.inlineData.mimeType || "image/png",
      };
    }
  }

  throw new Error("Gemini returned no image data");
}

// ─── Pollinations fallback ────────────────────────────────────────────────────

async function generateWithPollinations(
  eventName: string,
  eventKey: string,
  group: EventGroup,
  cacheKey: string
): Promise<Buffer> {
  const prompt = buildEventImagePrompt({ eventName, eventKey, group });
  const seed   = hashString(cacheKey);

  const url = new URL(`${POLLINATIONS_BASE}/${encodeURIComponent(prompt)}`);
  url.searchParams.set("width",   "1024");
  url.searchParams.set("height",  "1024");
  url.searchParams.set("seed",    seed.toString());
  url.searchParams.set("model",   "flux");
  url.searchParams.set("nologo",  "true");
  url.searchParams.set("enhance", "true");

  const res = await fetch(url.toString(), {
    headers: { "User-Agent": "RoiAmgarSite/1.0" },
  });

  if (!res.ok) throw new Error(`Pollinations error: ${res.status}`);

  const ct = res.headers.get("content-type") || "";
  if (!ct.startsWith("image/")) throw new Error(`Unexpected content-type: ${ct}`);

  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 1000) throw new Error(`Image too small (${buf.length} bytes)`);
  return buf;
}

// ─── Util ─────────────────────────────────────────────────────────────────────

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h) + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}
