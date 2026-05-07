import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@sanity/client";
import { requireAdmin } from "@/lib/require-admin";

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
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const body = await req.json().catch(() => ({}));
    const {
      title, teaser, content,
      status = "draft",
      categoryId,
      categoryIds,
      subTopicIds,
      sourceType = "manual",
    } = body as {
      title?: string;
      teaser?: string;
      content?: string;
      status?: string;
      categoryId?: string;
      categoryIds?: string[];
      subTopicIds?: string[];
      sourceType?: string;
    };

    if (!title || !content) {
      return NextResponse.json({ error: "כותרת ותוכן הם שדות חובה" }, { status: 400 });
    }

    // נורמליזציה: categoryIds עדיף, אחרת categoryId יחיד, אחרת ריק
    const allCats = (categoryIds?.length ? categoryIds : categoryId ? [categoryId] : [])
      .filter(Boolean)
      .slice(0, 3);
    const [primary, ...extras] = allCats;

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
      sourceType,
      publishedAt: status === "published" ? new Date().toISOString() : undefined,
      ...(primary ? { category: { _type: "reference", _ref: primary } } : {}),
      ...(extras.length
        ? {
            extraCategories: extras.map((id) => ({
              _type: "reference",
              _ref: id,
              _key: id,
            })),
          }
        : {}),
      ...(subTopicIds?.length
        ? {
            subTopics: subTopicIds.map((id) => ({
              _type: "reference",
              _ref: id,
              _key: id,
            })),
          }
        : {}),
    });

    return NextResponse.json({ ok: true, _id: doc._id });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[create-dvar] error:", err);
    return NextResponse.json({ error: `שגיאה ביצירת דבר תורה: ${message}` }, { status: 500 });
  }
}
