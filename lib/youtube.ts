import { unstable_cache } from "next/cache";
import { decodeHTMLEntities } from "./decodeHtml";
import { fetchRSSVideos, isLikelyShort } from "./youtube/rss";

export interface YouTubeVideo {
  videoId: string;
  title: string;
  thumbnail: string;
  publishedAt: string;
  duration?: string;
}

// סוג פנימי עם סיווג duration מדויק
interface YouTubeVideoWithType extends YouTubeVideo {
  _durationType: "short" | "medium" | "long";
}

const CHANNEL_ID = "UCpep2f42VluYwMqZ4kXiQTA";

type SyncSource = "api" | "rss" | "none";
type SyncStatus = {
  lastSource: SyncSource;
  lastSuccessAt: number;
  lastErrorMessage: string | null;
};
const _syncStatus: SyncStatus = {
  lastSource: "none",
  lastSuccessAt: 0,
  lastErrorMessage: null,
};
export function getYouTubeSyncStatus(): SyncStatus {
  return { ..._syncStatus };
}

// ממיר ISO 8601 duration לשניות
function parseDurationSeconds(iso: string): number {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  return (parseInt(m[1] ?? "0") * 3600) +
    (parseInt(m[2] ?? "0") * 60) +
    parseInt(m[3] ?? "0");
}

// סיווג זהה לפרמטרי YouTube API המקוריים:
// short < 4 דקות | medium 4-20 דקות | long > 20 דקות
function classifyDuration(iso: string): "short" | "medium" | "long" {
  const s = parseDurationSeconds(iso);
  if (s < 240) return "short";
  if (s < 1200) return "medium";
  return "long";
}

// שולף את ה-uploads playlist ID — עולה 1 יחידה, נשמר 24ש
async function _getUploadsPlaylistId(): Promise<string> {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) throw new Error("YOUTUBE_API_KEY missing");
  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${CHANNEL_ID}&key=${key}`
  );
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`YouTube channels API ${res.status}: ${body.slice(0, 200)}`);
  }
  const data = await res.json();
  const uploadsId: string =
    data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads ?? "";
  if (!uploadsId) throw new Error("YouTube: no uploads playlist found");
  return uploadsId;
}

const cachedGetUploadsPlaylistId = unstable_cache(
  _getUploadsPlaylistId,
  ["youtube-uploads-id-v1"],
  { revalidate: 86400 }
);

/**
 * שלב 1: playlistItems → 50 סרטונים אחרונים (1 יחידת quota)
 * שלב 2: videos?part=contentDetails → duration מדויק לכל סרטון (1 יחידה נוספת)
 * סה"כ: 2 יחידות ל-50 סרטונים, במקום 300 יחידות עם search.list.
 * ההפרדה short/medium/long מבוססת על duration אמיתי — לא על ניחוש מהכותרת.
 */
async function _fetchPlaylistWithDurations(): Promise<YouTubeVideoWithType[]> {
  // בסביבת dev — דולגים על API לחיסכון ב-quota
  if (process.env.NODE_ENV === "development") {
    throw new Error("YouTube API skipped in dev (quota conservation)");
  }

  const key = process.env.YOUTUBE_API_KEY;
  if (!key) throw new Error("YOUTUBE_API_KEY missing");

  const uploadsId = await cachedGetUploadsPlaylistId();

  // שלב 1: playlistItems (1 יחידה)
  const plParams = new URLSearchParams({
    part: "snippet,contentDetails",
    playlistId: uploadsId,
    maxResults: "50",
    key,
  });
  const plRes = await fetch(
    `https://www.googleapis.com/youtube/v3/playlistItems?${plParams}`
  );
  if (!plRes.ok) {
    const body = await plRes.text().catch(() => "");
    throw new Error(`YouTube playlistItems ${plRes.status}: ${body.slice(0, 200)}`);
  }
  const plData = await plRes.json();

  const basicItems: { videoId: string; title: string; thumbnail: string; publishedAt: string }[] = [];
  for (const item of plData.items ?? []) {
    const videoId =
      item.contentDetails?.videoId ?? item.snippet?.resourceId?.videoId;
    if (!videoId) continue;
    basicItems.push({
      videoId,
      title: decodeHTMLEntities(item.snippet?.title ?? ""),
      thumbnail:
        item.snippet?.thumbnails?.high?.url ||
        item.snippet?.thumbnails?.medium?.url ||
        `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      publishedAt:
        item.contentDetails?.videoPublishedAt ?? item.snippet?.publishedAt ?? "",
    });
  }

  if (basicItems.length === 0) throw new Error("YouTube playlist returned 0 items");

  // שלב 2: videos?part=contentDetails → duration (1 יחידה נוספת)
  const ids = basicItems.map((v) => v.videoId).join(",");
  const durParams = new URLSearchParams({ part: "contentDetails", id: ids, key });
  const durRes = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?${durParams}`
  );

  const durationMap: Record<string, string> = {};
  if (durRes.ok) {
    const durData = await durRes.json();
    for (const item of durData.items ?? []) {
      if (item.id && item.contentDetails?.duration) {
        durationMap[item.id] = item.contentDetails.duration;
      }
    }
  }

  return basicItems.map((v) => ({
    ...v,
    _durationType: durationMap[v.videoId]
      ? classifyDuration(durationMap[v.videoId])
      : "long", // ברירת מחדל: long אם duration לא ידוע
  }));
}

// cache שעה — קריאות חוזרות ממטמון, ללא quota נוסף
const cachedFetchPlaylistWithDurations = unstable_cache(
  _fetchPlaylistWithDurations,
  ["youtube-playlist-durations-v1"],
  { revalidate: 3600 }
);

// RSS — חינמי, ללא quota. גיבוי אם ה-API נכשל לחלוטין.
const cachedFetchRSS = unstable_cache(
  fetchRSSVideos,
  ["youtube-rss-v1"],
  { revalidate: 3600 }
);

/**
 * שליפת סרטונים בשתי שכבות:
 * 1. playlistItems + videos.list → duration מדויק, הפרדה נכונה (2 יחידות quota)
 * 2. RSS → ללא duration, הפרדה לפי כותרת (חינמי)
 */
export async function fetchYouTubeVideos(
  maxResults: number,
  videoDuration?: "short" | "medium" | "long"
): Promise<YouTubeVideo[]> {
  // שכבה 1: API עם duration מדויק
  try {
    const all = await cachedFetchPlaylistWithDurations();
    _syncStatus.lastSource = "api";
    _syncStatus.lastSuccessAt = Date.now();
    _syncStatus.lastErrorMessage = null;

    const filtered = videoDuration
      ? all.filter((v) => v._durationType === videoDuration)
      : all;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return filtered.slice(0, maxResults).map(({ _durationType, ...v }) => v);
  } catch (e) {
    const msg = (e as Error).message;
    _syncStatus.lastErrorMessage = msg;
    console.error("[youtube] API failed, falling back to RSS:", msg);
  }

  // שכבה 2: RSS — הפרדה לפי כותרת (פחות מדויק אבל עדיף על ריק)
  try {
    const rssItems = await cachedFetchRSS();
    _syncStatus.lastSource = "rss";
    _syncStatus.lastSuccessAt = Date.now();

    if (!videoDuration) return rssItems.slice(0, maxResults);

    if (videoDuration === "short") {
      return rssItems.filter(isLikelyShort).slice(0, maxResults);
    }
    // medium/long: כל מה שאינו short (RSS לא מבחין ביניהם)
    return rssItems.filter((v) => !isLikelyShort(v)).slice(0, maxResults);
  } catch (e) {
    const msg = (e as Error).message;
    _syncStatus.lastErrorMessage = `API+RSS both failed: ${msg}`;
    console.error("[youtube] RSS fallback ALSO failed:", msg);
  }

  return [];
}

/**
 * כל סרטוני הערוץ — לאינדקס הצ'אטבוט.
 * עם pagination עד 1000 סרטונים.
 */
async function _fetchAllChannelVideos(): Promise<YouTubeVideo[]> {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) throw new Error("YOUTUBE_API_KEY missing");

  const uploadsId = await cachedGetUploadsPlaylistId();

  const out: YouTubeVideo[] = [];
  let pageToken: string | undefined;

  for (let i = 0; i < 20 && out.length < 1000; i++) {
    const params = new URLSearchParams({
      part: "snippet,contentDetails",
      playlistId: uploadsId,
      maxResults: "50",
      key,
      ...(pageToken ? { pageToken } : {}),
    });
    try {
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/playlistItems?${params}`
      );
      if (!res.ok) break;
      const data = await res.json();
      for (const item of data.items ?? []) {
        const videoId =
          item.contentDetails?.videoId ?? item.snippet?.resourceId?.videoId;
        if (!videoId) continue;
        out.push({
          videoId,
          title: decodeHTMLEntities(item.snippet?.title ?? ""),
          thumbnail:
            item.snippet?.thumbnails?.high?.url ||
            item.snippet?.thumbnails?.medium?.url ||
            `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
          publishedAt:
            item.contentDetails?.videoPublishedAt ??
            item.snippet?.publishedAt ??
            "",
        });
      }
      pageToken = data.nextPageToken;
      if (!pageToken) break;
    } catch {
      break;
    }
  }

  if (out.length === 0) throw new Error("YouTube uploads playlist returned 0 items");
  return out;
}

const cachedFetchAllChannelVideos = unstable_cache(
  _fetchAllChannelVideos,
  ["youtube-all-channel-v2"],
  { revalidate: 86400 }
);

export async function fetchAllChannelVideos(): Promise<YouTubeVideo[]> {
  try {
    return await cachedFetchAllChannelVideos();
  } catch (e) {
    console.error("[youtube] fetchAllChannelVideos failed:", (e as Error).message);
    return [];
  }
}
