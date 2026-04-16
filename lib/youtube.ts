export interface YouTubeVideo {
  videoId: string;
  title: string;
  thumbnail: string;
  publishedAt: string;
  duration?: string;
}

const CHANNEL_ID = "UCpep2f42VluYwMqZ4kXiQTA";

export async function fetchYouTubeVideos(
  maxResults = 16,
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
      `https://www.googleapis.com/youtube/v3/search?${params}`,
      { next: { revalidate: 3600 } }
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
        title: item.snippet.title,
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
