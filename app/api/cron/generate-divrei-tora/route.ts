import { NextRequest, NextResponse } from "next/server";
import { YoutubeTranscript } from "youtube-transcript";
import { createClient } from "@sanity/client";
import { fetchYouTubeVideos } from "@/lib/youtube";
import { generateDvarTora } from "@/lib/generate-dvar-tora";
import { sendDvarToraForApproval } from "@/lib/send-email";

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  token: process.env.SANITY_API_TOKEN,
  apiVersion: "2024-01-01",
  useCdn: false,
});

async function getProcessedVideoIds(): Promise<Set<string>> {
  const ids = await sanity.fetch<string[]>(
    `*[_type == "divarTora" && defined(sourceVideoId)].sourceVideoId`
  );
  return new Set(ids);
}

async function fetchTranscript(videoId: string): Promise<string | null> {
  try {
    const items = await YoutubeTranscript.fetchTranscript(videoId, { lang: "iw" });
    return items.map((i) => i.text).join(" ");
  } catch {
    try {
      const items = await YoutubeTranscript.fetchTranscript(videoId);
      return items.map((i) => i.text).join(" ");
    } catch {
      return null;
    }
  }
}

async function saveDraftToSanity(
  dvar: { title: string; teaser: string; content: string; category: string },
  videoId: string,
  publishedAt: string
) {
  const slug = dvar.title
    .replace(/[^\u0590-\u05FF\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 60);

  const uniqueSlug = `${slug}-${Date.now()}`;

  const categoryRef = await sanity
    .fetch<{ _id: string } | null>(
      `*[_type == "category" && slug.current == $slug][0]{ _id }`,
      { slug: dvar.category }
    )
    .catch(() => null);

  await sanity.create({
    _type: "divarTora",
    title: dvar.title,
    slug: { _type: "slug", current: uniqueSlug },
    teaser: dvar.teaser,
    content: dvar.content,
    sourceVideoId: videoId,
    sourceType: "shiur",
    status: "draft",
    publishedAt,
    ...(categoryRef ? { category: { _type: "reference", _ref: categoryRef._id } } : {}),
  });
}

export async function GET(req: NextRequest) {
  const secret = req.headers.get("authorization")?.replace("Bearer ", "");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [videos, processedIds] = await Promise.all([
      fetchYouTubeVideos(10),
      getProcessedVideoIds(),
    ]);

    const newVideos = videos.filter((v) => !processedIds.has(v.videoId)).slice(0, 3);

    if (newVideos.length === 0) {
      return NextResponse.json({ message: "No new videos to process", processed: 0 });
    }

    let totalCreated = 0;
    const errors: string[] = [];
    const allGenerated: Array<{ title: string; teaser: string; content: string; category: string; sourceVideoTitle?: string }> = [];

    for (const video of newVideos) {
      const transcript = await fetchTranscript(video.videoId);
      if (!transcript || transcript.length < 200) {
        errors.push(`${video.videoId}: no transcript`);
        continue;
      }

      const divarToras = await generateDvarTora(transcript, video.title).catch((e) => {
        errors.push(`${video.videoId}: Claude error - ${e.message}`);
        return [];
      });

      for (const dvar of divarToras) {
        await saveDraftToSanity(dvar, video.videoId, video.publishedAt);
        allGenerated.push({ ...dvar, sourceVideoTitle: video.title });
        totalCreated++;
      }
    }

    if (allGenerated.length > 0) {
      await sendDvarToraForApproval(allGenerated).catch((e) =>
        errors.push(`email error: ${e.message}`)
      );
    }

    return NextResponse.json({
      processed: newVideos.length,
      created: totalCreated,
      emailSent: allGenerated.length > 0,
      errors,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
