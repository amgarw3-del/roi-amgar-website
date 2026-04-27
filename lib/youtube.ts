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
