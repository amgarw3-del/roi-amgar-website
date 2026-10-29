/**
 * app/api/cron/create-draft/route.ts
 *
 * יצירת דבר תורה חדש עם זיהוי אוטומטי של נושא (category) ותת-נושא (subTopic).
 * דרך Bearer CRON_SECRET (ללא session אדמין).
 *
 * זיהוי אוטומטי:
 *  - תתי-נושא: smartTagSubtopics (אם לא סופקו ידנית)
 *  - נושא/קטגוריה: נגזר מקבוצת תת-הנושא, או מסווג ע"י מודל
 *  - תת-נושא חדש: אם מועבר newSubTopic {hebrewName, slug, group} שלא קיים — נוצר
 *
 * POST body: { title, content, teaser?, status?, categorySlug?, subTopicSlugs?, newSubTopic?, sourceType? }
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient, SanityClient } from "@sanity/client";
import { smartTagSubtopics } from "@/lib/smart-tag-subtopics";
import { callGemini } from "@/lib/gemini";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const CATEGORY_SLUGS = ["parasha", "moadim", "emuna", "halacha", "zugiyut"] as const;

function toSlug(text: string): string {
  return text.trim().replace(/\s+/g, "-").replace(/[^֐-׿\w-]/g, "").slice(0, 60);
}

/** מזהה קטגוריה: מקבוצת תת-הנושא, ואם לא ברור — מסווג במודל. */
async function deriveCategory(
  sanity: SanityClient,
  subTopicIds: string[],
  title: string,
  content: string
): Promise<string | null> {
  // 1) גזירה מקבוצת תת-הנושא
  if (subTopicIds.length) {
    const groups = await sanity.fetch<string[]>(
      `*[_type=="subTopic" && _id in $ids].group`,
      { ids: subTopicIds }
    );
    if (groups.includes("parasha")) return "parasha";
    if (groups.some((g) => ["moed", "fast", "national"].includes(g))) return "moadim";
  }
  // 2) סיווג נושאי ע"י מודל (אמונה/הלכה/זוגיות)
  try {
    const sys = `סווג דבר תורה לאחת מהקטגוריות: emuna (אמונה ועבודת ה'), halacha (הלכה ומעשה), zugiyut (זוגיות ומשפחה), parasha (פרשת שבוע), moadim (חגים ומועדים). החזר slug אחד בלבד, בלי הסבר.`;
    const out = (await callGemini(sys, `כותרת: ${title}\n\n${content.slice(0, 1500)}`, { maxOutputTokens: 15 })).trim().toLowerCase();
    const hit = CATEGORY_SLUGS.find((c) => out.includes(c));
    return hit ?? "emuna";
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get("authorization")?.replace("Bearer ", "");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { title, teaser, content, status, categorySlug, subTopicSlugs, newSubTopic, sourceType } =
    body as {
      title?: string; teaser?: string; content?: string; status?: string;
      categorySlug?: string; subTopicSlugs?: string[];
      newSubTopic?: { hebrewName: string; slug: string; group: string };
      sourceType?: string;
    };

  if (!title || !content) {
    return NextResponse.json({ error: "title, content הם חובה" }, { status: 400 });
  }

  const sanity = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
    token: process.env.SANITY_API_TOKEN,
    apiVersion: "2024-01-01",
    useCdn: false,
  });

  try {
    // תת-נושא חדש (אם נדרש)
    if (newSubTopic?.slug && newSubTopic.hebrewName) {
      await sanity.createIfNotExists({
        _id: `subTopic-${newSubTopic.slug}`,
        _type: "subTopic",
        hebrewName: newSubTopic.hebrewName,
        slug: { _type: "slug", current: newSubTopic.slug },
        group: newSubTopic.group || "general",
      });
    }

    // זיהוי תתי-נושא
    const slugs = subTopicSlugs?.length ? subTopicSlugs : await smartTagSubtopics(title, content);
    if (newSubTopic?.slug && !slugs.includes(newSubTopic.slug)) slugs.push(newSubTopic.slug);

    // slug → רפרנס קיים ב-Sanity
    const subTopicIds = slugs.length
      ? await sanity.fetch<string[]>(
          `*[_type=="subTopic" && slug.current in $slugs]._id`,
          { slugs }
        )
      : [];

    // זיהוי קטגוריה
    const catSlug = categorySlug || (await deriveCategory(sanity, subTopicIds, title, content));
    const catId = catSlug
      ? await sanity.fetch<string | null>(`*[_type=="category" && slug.current==$s][0]._id`, { s: catSlug })
      : null;

    const newStatus = status === "published" ? "published" : "draft";
    const doc: Record<string, unknown> = {
      _type: "divarTora",
      title,
      slug: { _type: "slug", current: `${toSlug(title)}-${Date.now()}` },
      teaser: teaser ?? "",
      content,
      status: newStatus,
      sourceType: sourceType || "manual",
      publishedAt: newStatus === "published" ? new Date().toISOString() : null,
      ...(catId ? { category: { _type: "reference", _ref: catId } } : {}),
      ...(subTopicIds.length
        ? { subTopics: subTopicIds.map((id) => ({ _type: "reference", _ref: id, _key: id })) }
        : {}),
    };

    const created = await sanity.create(doc as Parameters<typeof sanity.create>[0]);
    return NextResponse.json({
      ok: true,
      id: created._id,
      status: newStatus,
      category: catSlug,
      subTopicSlugs: slugs,
      subTopicCount: subTopicIds.length,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
