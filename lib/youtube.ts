import { unstable_cache } from "next/cache";
import { decodeHTMLEntities } from "./decodeHtml";

export interface YouTubeVideo {
  videoId: string;
  title: string;
  thumbnail: string;
  publishedAt: string;
  duration?: string;
}

const CHANNEL_ID = "UCpep2f42VluYwMqZ4kXiQTA";

// זורק חריגה במקום להחזיר [] בכשל — Next.js לא מאחסן rejections ב-unstable_cache
// כך אין יותר "הרעלת cache" של 24ש כשהמפתח/קוואטה זמנית נופלים.
async function _fetchYouTubeVideos(
  maxResults: number,
  videoDuration?: "short" | "medium" | "long"
): Promise<YouTubeVideo[]> {
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

// cache ל-24 שעות — קריאה אחת ביום ל-YouTube API.
// שם המפתח שונה ל-v2 כדי לבטל cache מורעל קיים.
const cachedFetchYouTubeVideos = unstable_cache(
  _fetchYouTubeVideos,
  ["youtube-videos-v2"],
  { revalidate: 86400 }
);

export async function fetchYouTubeVideos(
  maxResults: number,
  videoDuration?: "short" | "medium" | "long"
): Promise<YouTubeVideo[]> {
  try {
    return await cachedFetchYouTubeVideos(maxResults, videoDuration);
  } catch (e) {
    console.error("[youtube] fetch failed:", (e as Error).message);
    return [];
  }
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
