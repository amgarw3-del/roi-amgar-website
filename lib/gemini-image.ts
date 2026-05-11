/**
 * lib/gemini-image.ts
 *
 * יצירת תמונת אירוע 1:1 דרך Gemini Image Generation API.
 * שמירת cache ב-Sanity לפי eventKey+year.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import type { SanityClient } from "@sanity/client";
import { buildEventImagePrompt, buildEventCacheKey, type EventGroup } from "./image-prompts";

const IMAGE_MODEL = "gemini-2.0-flash-exp"; // תומך ביצירת תמונות

export interface GenerateImageParams {
  eventName: string;
  eventKey: string;
  group: EventGroup;
  hebrewYear: string;
  sanity: SanityClient;
}

export interface GeneratedImage {
  /** URL מ-Sanity asset */
  url: string;
  /** האם הגיע מ-cache */
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

  // 2. יצירה דרך Gemini
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not configured");

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: IMAGE_MODEL,
    // @ts-expect-error - responseModalities זמין במודלים תומכי תמונה
    generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
  });

  const prompt = buildEventImagePrompt({ eventName, eventKey, group });

  const result = await model.generateContent([prompt]);
  const parts = result.response.candidates?.[0]?.content?.parts || [];

  // מציאת חלק התמונה
  const imagePart = parts.find((p: any) => p.inlineData?.data);
  if (!imagePart || !(imagePart as any).inlineData?.data) {
    throw new Error("Gemini did not return an image. Check model availability.");
  }

  const base64 = (imagePart as any).inlineData.data;
  const mimeType = (imagePart as any).inlineData.mimeType || "image/png";
  const buffer = Buffer.from(base64, "base64");

  // 3. העלאה ל-Sanity assets
  const ext = mimeType.split("/")[1] || "png";
  const asset = await sanity.assets.upload("image", buffer, {
    filename: `event-${cacheKey}.${ext}`,
    contentType: mimeType,
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
