import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@sanity/client";
import { requireAdmin } from "@/lib/require-admin";

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

  try {
    const body = await req.json();
    const { _id, title, bodyText, categoryId, level } = body as {
      _id?: string;
      title?: string;
      bodyText?: string;
      categoryId?: string;
      level?: string;
    };
    if (!_id) return NextResponse.json({ error: "חסר מזהה" }, { status: 400 });
    if (!title || !bodyText) {
      return NextResponse.json({ error: "כותרת ותוכן הם שדות חובה" }, { status: 400 });
    }

    const patch: Record<string, unknown> = {
      title,
      "slug.current": toSlug(title) || `post-${Date.now()}`,
      body: textToBlocks(bodyText),
      level: level ?? "beginner",
    };
    patch.category = categoryId ? { _type: "reference", _ref: categoryId } : null;

    await sanity.patch(_id).set(patch).commit();
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
