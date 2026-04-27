import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@sanity/client";

export const dynamic = "force-dynamic";

function toSlug(text: string): string {
  return text
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^֐-׿\w-]/g, "")
    .toLowerCase()
    .slice(0, 80);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      id,
      title,
      teaser,
      content,
      categoryIds,
      subTopicIds,
      status,
    } = body as {
      id?: string;
      title?: string;
      teaser?: string;
      content?: string;
      categoryIds?: string[];
      subTopicIds?: string[];
      status?: string;
    };

    if (!id) return NextResponse.json({ error: "חסר מזהה" }, { status: 400 });
    if (!title || !content) {
      return NextResponse.json({ error: "כותרת ותוכן הם שדות חובה" }, { status: 400 });
    }

    const allCats = (categoryIds ?? []).filter(Boolean).slice(0, 3);
    const [primary, ...extras] = allCats;

    const sanity = createClient({
      projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
      dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
      token: process.env.SANITY_API_TOKEN,
      apiVersion: "2024-01-01",
      useCdn: false,
    });

    const slug = toSlug(title) || `dvar-${Date.now()}`;

    const patch: Record<string, unknown> = {
      title,
      "slug.current": slug,
      teaser: teaser ?? "",
      content,
      status: status ?? "draft",
    };

    if (status === "published") {
      const existing = await sanity.fetch<{ status?: string }>(
        `*[_id == $id][0]{ status }`,
        { id }
      );
      if (existing?.status !== "published") {
        patch.publishedAt = new Date().toISOString();
      }
    } else {
      patch.publishedAt = null;
    }

    patch.category = primary ? { _type: "reference", _ref: primary } : null;
    patch.extraCategories = extras.length
      ? extras.map((eid) => ({ _type: "reference", _ref: eid, _key: eid }))
      : [];
    patch.subTopics = subTopicIds?.length
      ? subTopicIds.map((sid) => ({ _type: "reference", _ref: sid, _key: sid }))
      : [];

    await sanity.patch(id).set(patch).commit();

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[update-dvar] error:", err);
    return NextResponse.json({ error: `שגיאה בעדכון: ${message}` }, { status: 500 });
  }
}
