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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { _id, title, summary, flyerAssetId, order, published } = body as {
      _id?: string;
      title?: string;
      summary?: string;
      flyerAssetId?: string;
      order?: number;
      published?: boolean;
    };

    if (!title || !summary) {
      return NextResponse.json({ error: "כותרת ותקציר הם שדות חובה" }, { status: 400 });
    }

    const data: Record<string, unknown> = {
      title,
      summary,
      order: order ?? 0,
      published: published ?? true,
    };
    if (flyerAssetId) {
      data.flyer = { _type: "image", asset: { _type: "reference", _ref: flyerAssetId } };
    }

    if (_id) {
      const patch = { ...data };
      if (!flyerAssetId) delete patch.flyer;
      await sanity.patch(_id).set(patch).commit();
      return NextResponse.json({ ok: true, _id });
    } else {
      if (!flyerAssetId) {
        return NextResponse.json({ error: "פלאייר הוא שדה חובה ביצירה" }, { status: 400 });
      }
      const doc = await sanity.create({ _type: "lecture", ...data });
      return NextResponse.json({ ok: true, _id: doc._id });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
