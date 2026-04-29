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

type Block = { _type?: string; children?: { text?: string }[] };

export async function POST(req: NextRequest) {
  const { _id } = (await req.json().catch(() => ({}))) as { _id?: string };
  if (!_id) return NextResponse.json({ error: "חסר מזהה" }, { status: 400 });
  const post = await sanity.fetch<{
    _id: string; title: string; level?: string;
    category?: { _id: string }; body?: Block[];
  }>(`*[_id == $id][0]{ _id, title, level, category->{_id}, body }`, { id: _id });
  if (!post) return NextResponse.json({ error: "לא נמצא" }, { status: 404 });
  const bodyText = (post.body ?? [])
    .filter((b) => b._type === "block")
    .map((b) => (b.children ?? []).map((c) => c.text ?? "").join(""))
    .join("\n\n");
  return NextResponse.json({
    _id: post._id, title: post.title, level: post.level,
    categoryId: post.category?._id ?? "", bodyText,
  });
}
