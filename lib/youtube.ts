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

async function _fetchYouTubeVideos(
  maxResults: number,
  videoDuration?: "short" | "medium" | "long"
): Promise<YouTubeVideo[]> {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) return [];

  const params = new URLSearchParams({
    part: "snippet",
    channelId: CHANNEL_ID,
    type: "video",
    order: "date",
    maxResults: String(maxResults),
    key,
    ...(videoDuration ? { videoDuration } : {}),
  });

  try {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/search?${params}`
    );
    if (!res.ok) return [];
    const data = await res.json();

    return (data.items ?? []).map(
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
  } catch {
    return [];
  }
}

// cache ל-24 שעות — קריאה אחת ביום לYouTube API
export const fetchYouTubeVideos = unstable_cache(
  _fetchYouTubeVideos,
  ["youtube-videos"],
  { revalidate: 86400 }
);

/**
 * Fetch ALL videos from the channel via the uploads playlist.
 * Cheap: 1 quota unit per page of 50 videos (vs 100 units per page for search.list).
 * Used by the chatbot index — no `videoDuration` filter, returns the entire channel.
 */
async function _fetchAllChannelVideos(): Promise<YouTubeVideo[]> {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) return [];

  // 1. Get the channel's uploads playlist ID
  let uploadsId: string;
  try {
    const chRes = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${CHANNEL_ID}&key=${key}`
    );
    if (!chRes.ok) return [];
    const chData = await chRes.json();
    uploadsId =
      chData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads ?? "";
    if (!uploadsId) return [];
  } catch {
    return [];
  }

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

  return out;
}

export const fetchAllChannelVideos = unstable_cache(
  _fetchAllChannelVideos,
  ["youtube-all-channel"],
  { revalidate: 86400 }
);
