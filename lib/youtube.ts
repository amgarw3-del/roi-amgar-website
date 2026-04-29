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

// שולף את ה-uploads playlist ID של הערוץ — עולה 1 יחידת quota, נשמר 24ש
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

// שולף 50 הסרטונים האחרונים מ-uploads playlist — עולה 1 יחידת quota בלבד (במקום 100)
async function _fetchPlaylistVideos(): Promise<YouTubeVideo[]> {
  // בסביבת dev — דולגים על ה-API כדי לחסוך quota (כל restart מכלה יחידות).
  if (process.env.NODE_ENV === "development") {
    throw new Error("YouTube API skipped in dev (quota conservation)");
  }

  const key = process.env.YOUTUBE_API_KEY;
  if (!key) throw new Error("YOUTUBE_API_KEY missing");

  const uploadsId = await cachedGetUploadsPlaylistId();

  const params = new URLSearchParams({
    part: "snippet,contentDetails",
    playlistId: uploadsId,
    maxResults: "50",
    key,
  });

  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/playlistItems?${params}`
  );
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`YouTube playlistItems ${res.status}: ${body.slice(0, 200)}`);
  }
  const data = await res.json();

  const items: YouTubeVideo[] = [];
  for (const item of data.items ?? []) {
    const videoId =
      item.contentDetails?.videoId ?? item.snippet?.resourceId?.videoId;
    if (!videoId) continue;
    items.push({
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

  if (items.length === 0) throw new Error("YouTube playlist returned 0 items");
  return items;
}

// cache שעה — קריאות חוזרות ממטמון, ללא שחיקת quota
const cachedFetchPlaylistVideos = unstable_cache(
  _fetchPlaylistVideos,
  ["youtube-playlist-v2"],
  { revalidate: 3600 }
);

// RSS — חינמי, ללא מפתח, ללא quota. גיבוי לשכבה הראשונה.
const cachedFetchRSS = unstable_cache(
  fetchRSSVideos,
  ["youtube-rss-v1"],
  { revalidate: 3600 }
);

/**
 * שליפת סרטונים בשתי שכבות:
 * 1. playlistItems API — 1 יחידת quota ל-50 סרטונים (במקום search.list שעלה 100).
 *    אם נכשל →
 * 2. RSS feed — חינמי לחלוטין, 15 סרטונים אחרונים.
 *
 * סינון לפי duration מתבצע לוקאלית לפי כותרת (isLikelyShort).
 * אם הסינון מחזיר ריק — מחזירים את כל הסרטונים (עדיף משהו על פני ריק).
 */
export async function fetchYouTubeVideos(
  maxResults: number,
  videoDuration?: "short" | "medium" | "long"
): Promise<YouTubeVideo[]> {
  let allVideos: YouTubeVideo[] | null = null;

  // שכבה 1: playlist API
  try {
    allVideos = await cachedFetchPlaylistVideos();
    _syncStatus.lastSource = "api";
    _syncStatus.lastSuccessAt = Date.now();
    _syncStatus.lastErrorMessage = null;
  } catch (e) {
    const msg = (e as Error).message;
    _syncStatus.lastErrorMessage = msg;
    console.error("[youtube] playlist API failed, falling back to RSS:", msg);
  }

  // שכבה 2: RSS
  if (!allVideos) {
    try {
      allVideos = await cachedFetchRSS();
      _syncStatus.lastSource = "rss";
      _syncStatus.lastSuccessAt = Date.now();
    } catch (e) {
      const msg = (e as Error).message;
      _syncStatus.lastErrorMessage = `API+RSS both failed: ${msg}`;
      console.error("[youtube] RSS fallback ALSO failed:", msg);
      return [];
    }
  }

  // סינון לפי duration לוקאלי — לפי כותרת
  let filtered = allVideos;
  if (videoDuration === "short") {
    const shorts = allVideos.filter(isLikelyShort);
    filtered = shorts.length > 0 ? shorts : allVideos;
  } else if (videoDuration === "long" || videoDuration === "medium") {
    const longs = allVideos.filter((v) => !isLikelyShort(v));
    filtered = longs.length > 0 ? longs : allVideos;
  }

  return filtered.slice(0, maxResults);
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
