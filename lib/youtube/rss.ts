import { decodeHTMLEntities } from "../decodeHtml";
import type { YouTubeVideo } from "../youtube";

const CHANNEL_ID = "UCpep2f42VluYwMqZ4kXiQTA";
const RSS_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`;

const SHORTS_INDICATORS = ["#shorts", "#short", "#סרטון_קצר"];

function extract(block: string, tag: string): string | null {
  const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`));
  return m ? m[1].trim() : null;
}

function extractAttr(block: string, tag: string, attr: string): string | null {
  const m = block.match(new RegExp(`<${tag}[^>]*\\s${attr}="([^"]+)"`));
  return m ? m[1] : null;
}

export async function fetchRSSVideos(): Promise<YouTubeVideo[]> {
  const res = await fetch(RSS_URL, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; RoiAmgarWebsite/1.0; +https://harav-roi-amgar.com)",
    },
    next: { revalidate: 0 },
  });
  if (!res.ok) {
    throw new Error(`YouTube RSS ${res.status}`);
  }
  const xml = await res.text();

  const entries = xml.split("<entry>").slice(1).map((e) => "<entry>" + e.split("</entry>")[0] + "</entry>");
  const videos: YouTubeVideo[] = [];

  for (const entry of entries) {
    const videoId = extract(entry, "yt:videoId");
    const title = extract(entry, "title");
    const publishedAt = extract(entry, "published");
    const thumbnail = extractAttr(entry, "media:thumbnail", "url");
    if (!videoId || !title || !publishedAt) continue;

    videos.push({
      videoId,
      title: decodeHTMLEntities(title),
      thumbnail: thumbnail || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      publishedAt,
    });
  }

  return videos;
}

// היוריסטיקה לזיהוי shorts מ-RSS (אין שדה duration ב-RSS):
// 1. כותרת מכילה #shorts/#short
// 2. כותרת קצרה מאוד (מתחת ל-30 תווים) — לעיתים סימן ל-short
export function isLikelyShort(video: YouTubeVideo): boolean {
  const titleLower = video.title.toLowerCase();
  return SHORTS_INDICATORS.some((tag) => titleLower.includes(tag));
}
