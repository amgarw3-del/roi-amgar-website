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

// סטטוס סנכרון אחרון — נקרא ע"י endpoint health-check
type SyncSource = "api" | "rss" | "none";
type SyncStatus = {
  lastSource: SyncSource;
  lastSuccessAt: number; // epoch ms
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

// זורק חריגה במקום להחזיר [] בכשל — Next.js לא מאחסן rejections ב-unstable_cache
// כך אין יותר "הרעלת cache" של 24ש כשהמפתח/קוואטה זמנית נופלים.
async function _fetchYouTubeVideos(
  maxResults: number,
  videoDuration?: "short" | "medium" | "long"
): Promise<YouTubeVideo[]> {
  // בסביבת dev — דולגים על ה-API כדי לחסוך quota (כל restart מכלה 300 יחידות).
  // ה-RSS fallback יטפל בזה חינם.
  if (process.env.NODE_ENV === "development") {
    throw new Error("YouTube API skipped in dev (quota conservation)");
  }

  const key = process.env.YOUTUBE_API_KEY;
  if (!key) throw new Error("YOUTUBE_API_KEY missing");

  const params = new URLSearchParams({
    part: "snippet",
    channelId: CHANNEL_ID,
    type: "video",
    order: "date",
    maxResults: String(maxResults),
    key,
    ...(videoDuration ? { videoDuration } : {}),
  });

  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/search?${params}`
  );
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`YouTube API ${res.status}: ${body.slice(0, 200)}`);
  }
  const data = await res.json();

  const items: YouTubeVideo[] = (data.items ?? []).map(
    (item: {
      id: { videoId: string };
      snippet: {
        title: string;
        thumbnails: { high?: { url: string }; medium?: { url: string } };
        publishedAt: string;
      };
    }) => ({
      videoId: item.id.videoId,
      title: decodeHTMLEntities(item.snippet.title),
      thumbnail:
        item.snippet.thumbnails?.high?.url ||
        item.snippet.thumbnails?.medium?.url ||
        `https://img.youtube.com/vi/${item.id.videoId}/hqdefault.jpg`,
      publishedAt: item.snippet.publishedAt,
    })
  );

  if (items.length === 0) throw new Error("YouTube API returned 0 items");
  return items;
}

// cache ל-שעה — בכשלון API מנסים שוב כל שעה (לא 24)
// כך כשהמפתח חוזר לעבוד, הסנכרון חוזר תוך שעה אוטומטית.
const cachedFetchYouTubeVideos = unstable_cache(
  _fetchYouTubeVideos,
  ["youtube-videos-v3"],
  { revalidate: 3600 }
);

// RSS — חינמי, ללא מפתח, ללא quota. מתרענן כל שעה.
const cachedFetchRSS = unstable_cache(
  fetchRSSVideos,
  ["youtube-rss-v1"],
  { revalidate: 3600 }
);

/**
 * שליפת סרטונים בשתי שכבות הגנה:
 * 1. YouTube Data API (מחזיר 50, מסונן ב-duration). אם נכשל →
 * 2. RSS feed (חינמי, 15 סרטונים אחרונים, ללא duration — סינון לפי כותרת).
 *
 * אם שתיהן נופלות → מערך ריק (האתר ימשיך לעבוד עם שאר התוכן).
 * הסטטוס נשמר ב-_syncStatus וניתן לקריאה דרך /api/cron/youtube-health.
 */
export async function fetchYouTubeVideos(
  maxResults: number,
  videoDuration?: "short" | "medium" | "long"
): Promise<YouTubeVideo[]> {
  // שכבה 1: API
  try {
    const items = await cachedFetchYouTubeVideos(maxResults, videoDuration);
    _syncStatus.lastSource = "api";
    _syncStatus.lastSuccessAt = Date.now();
    _syncStatus.lastErrorMessage = null;
    return items;
  } catch (e) {
    const msg = (e as Error).message;
    _syncStatus.lastErrorMessage = msg;
    console.error("[youtube] API failed, falling back to RSS:", msg);
  }

  // שכבה 2: RSS (כשהשכבה הראשונה נכשלה)
  try {
    const rssItems = await cachedFetchRSS();
    _syncStatus.lastSource = "rss";
    _syncStatus.lastSuccessAt = Date.now();

    // RSS לא מבחין ב-duration. מסננים לפי כותרת, אבל אם הפילטר מחזיר ריק —
    // מחזירים את כל הסרטונים האחרונים כ-fallback (עדיף משהו על פני ריק).
    let filtered = rssItems;
    if (videoDuration === "short") {
      const shorts = rssItems.filter(isLikelyShort);
      filtered = shorts.length > 0 ? shorts : rssItems;
    } else if (videoDuration === "long" || videoDuration === "medium") {
      const longs = rssItems.filter((v) => !isLikelyShort(v));
      filtered = longs.length > 0 ? longs : rssItems;
    }
    return filtered.slice(0, maxResults);
  } catch (e) {
    const msg = (e as Error).message;
    _syncStatus.lastErrorMessage = `API+RSS both failed: ${msg}`;
    console.error("[youtube] RSS fallback ALSO failed:", msg);
  }

  return [];
}

/**
 * Fetch ALL videos from the channel via the uploads playlist.
 * Cheap: 1 quota unit per page of 50 videos (vs 100 units per page for search.list).
 * Used by the chatbot index — no `videoDuration` filter, returns the entire channel.
 */
async function _fetchAllChannelVideos(): Promise<YouTubeVideo[]> {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) throw new Error("YOUTUBE_API_KEY missing");

  // 1. Get the channel's uploads playlist ID
  const chRes = await fetch(
    `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${CHANNEL_ID}&key=${key}`
  );
  if (!chRes.ok) {
    const body = await chRes.text().catch(() => "");
    throw new Error(`YouTube channels API ${chRes.status}: ${body.slice(0, 200)}`);
  }
  const chData = await chRes.json();
  const uploadsId: string =
    chData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads ?? "";
  if (!uploadsId) throw new Error("YouTube: no uploads playlist found");

  // 2. Page through the uploads playlist
  const out: YouTubeVideo[] = [];
  let pageToken: string | undefined;
  const HARD_CAP = 1000; // safety: stop after 1000 videos / 20 pages

  for (let i = 0; i < 20 && out.length < HARD_CAP; i++) {
    const params = new URLSearchParams({
      part: "snippet,contentDetails",
      playlistId: uploadsId,
      maxResults: "50",
      key,
      ...(pageToken ? { pageToken } : {}),
    });
    let data;
    try {
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/playlistItems?${params}`
      );
      if (!res.ok) break;
      data = await res.json();
    } catch {
      break;
    }
    for (const item of data.items ?? []) {
      const videoId = item.contentDetails?.videoId ?? item.snippet?.resourceId?.videoId;
      if (!videoId) continue;
      out.push({
        videoId,
        title: decodeHTMLEntities(item.snippet?.title ?? ""),
        thumbnail:
          item.snippet?.thumbnails?.high?.url ||
          item.snippet?.thumbnails?.medium?.url ||
          `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        publishedAt: item.contentDetails?.videoPublishedAt ?? item.snippet?.publishedAt,
      });
    }
    pageToken = data.nextPageToken;
    if (!pageToken) break;
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
