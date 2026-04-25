import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@sanity/client";

export const dynamic = "force-dynamic";

function toSlug(text: string): string {
  return text
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\u0590-\u05FF\w-]/g, "")
    .toLowerCase()
    .slice(0, 80);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { title, teaser, content, status = "draft" } = body as {
    title?: string;
    teaser?: string;
    content?: string;
    status?: string;
  };

  if (!title || !content) {
    return NextResponse.json({ error: "כותרת ותוכן הם שדות חובה" }, { status: 400 });
  }

  const sanity = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
    token: process.env.SANITY_API_TOKEN,
    apiVersion: "2024-01-01",
    useCdn: false,
  });

  const slug = toSlug(title) || `dvar-${Date.now()}`;

  const doc = await sanity.create({
    _type: "divarTora",
    title,
    slug: { _type: "slug", current: slug },
    teaser: teaser ?? "",
    content,
    status,
    sourceType: "manual",
    publishedAt: status === "published" ? new Date().toISOString() : undefined,
  });

  return NextResponse.json({ ok: true, _id: doc._id });
}
