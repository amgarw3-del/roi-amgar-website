/**
 * app/api/cron/update-draft/route.ts
 *
 * עדכון תוכן של דבר תורה קיים (title/teaser/content) דרך Bearer CRON_SECRET.
 * משמש לעריכת טיוטות אוטומטית בלי הזדהות אדמין (session).
 *
 * שומר על status (ברירת מחדל draft), ולא נוגע ב-subTopics/category —
 * כדי לא למחוק תיוגים קיימים. פועל רק על מסמכי divarTora.
 *
 * POST body: { id, title, content, teaser?, status? }
 * Auth: header `authorization: Bearer ${CRON_SECRET}`
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@sanity/client";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("authorization")?.replace("Bearer ", "");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { id, title, teaser, content, status } = body as {
    id?: string;
    title?: string;
    teaser?: string;
    content?: string;
    status?: string;
  };

  if (!id || !title || !content) {
    return NextResponse.json({ error: "id, title, content הם חובה" }, { status: 400 });
  }

  const sanity = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
    token: process.env.SANITY_API_TOKEN,
    apiVersion: "2024-01-01",
    useCdn: false,
  });

  try {
    // מוודאים שהמסמך הוא divarTora לפני עדכון
    const existing = await sanity.fetch<{ _type: string } | null>(
      `*[_id == $id][0]{ _type }`,
      { id }
    );
    if (!existing) {
      return NextResponse.json({ error: "מסמך לא נמצא" }, { status: 404 });
    }
    if (existing._type !== "divarTora") {
      return NextResponse.json({ error: "המסמך אינו divarTora" }, { status: 400 });
    }

    const newStatus = status === "published" ? "published" : "draft";
    const patch: Record<string, unknown> = {
      title,
      teaser: teaser ?? "",
      content,
      status: newStatus,
    };
    // טיוטה = לא מפורסם; פרסום = חותמת זמן
    patch.publishedAt = newStatus === "published" ? new Date().toISOString() : null;

    await sanity.patch(id).set(patch).commit();

    return NextResponse.json({ ok: true, id, status: newStatus });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
