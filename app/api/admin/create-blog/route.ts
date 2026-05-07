import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@sanity/client";
import { requireAdmin } from "@/lib/require-admin";

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

function textToBlocks(text: string) {
  return text.split("\n\n").filter(Boolean).map((para) => ({
    _type: "block",
    _key: Math.random().toString(36).slice(2),
    style: "normal",
    markDefs: [],
    children: [{ _type: "span", _key: Math.random().toString(36).slice(2), text: para.trim(), marks: [] }],
  }));
}

export async function POST(req: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { title, bodyText, categoryId, level } = await req.json() as {
    title?: string;
    bodyText?: string;
    categoryId?: string;
    level?: string;
  };

  if (!title || !bodyText) {
    return NextResponse.json({ error: "כותרת ותוכן הם שדות חובה" }, { status: 400 });
  }

  const doc = await sanity.create({
    _type: "blogPost",
    title,
    slug: { _type: "slug", current: toSlug(title) || `post-${Date.now()}` },
    body: textToBlocks(bodyText),
    level: level ?? "beginner",
    source: "manual",
    publishedAt: new Date().toISOString(),
    ...(categoryId ? { category: { _type: "reference", _ref: categoryId } } : {}),
  });

  return NextResponse.json({ ok: true, _id: doc._id });
}
