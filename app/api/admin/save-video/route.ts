import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@sanity/client";

export const dynamic = "force-dynamic";

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  token: process.env.SANITY_API_TOKEN,
  apiVersion: "2024-01-01",
  useCdn: false,
});

function toSlug(text: string) {
  return text.trim().replace(/\s+/g, "-").replace(/[^֐-׿\w-]/g, "").toLowerCase().slice(0, 80);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      _id, title, youtubeId, categoryId, level, platform, summary, status,
    } = body as {
      _id?: string;
      title?: string;
      youtubeId?: string;
      categoryId?: string;
      level?: string;
      platform?: string;
      summary?: string;
      status?: string;
    };

    if (!title) {
      return NextResponse.json({ error: "כותרת חובה" }, { status: 400 });
    }

    const data: Record<string, unknown> = {
      title,
      youtubeId: youtubeId ?? "",
      level: level ?? "beginner",
      platform: platform ?? "youtube",
      summary: summary ?? "",
      status: status ?? "draft",
    };
    data.category = categoryId
      ? { _type: "reference", _ref: categoryId }
      : null;

    if (_id) {
      await sanity.patch(_id).set(data).commit();
      return NextResponse.json({ ok: true, _id });
    } else {
      const doc = await sanity.create({
        _type: "video",
        ...data,
        slug: { _type: "slug", current: toSlug(title) || `video-${Date.now()}` },
        publishedAt: status === "published" ? new Date().toISOString() : null,
      });
      return NextResponse.json({ ok: true, _id: doc._id });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
