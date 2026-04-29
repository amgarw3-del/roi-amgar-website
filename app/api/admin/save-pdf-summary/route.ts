import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
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
    const { _id, title, description, category, pdfAssetId, order, published } = body as {
      _id?: string;
      title?: string;
      description?: string;
      category?: string;
      pdfAssetId?: string;
      order?: number;
      published?: boolean;
    };

    if (!title) {
      return NextResponse.json({ error: "כותרת היא שדה חובה" }, { status: 400 });
    }

    const data: Record<string, unknown> = {
      title,
      description: description ?? "",
      category: category ?? "general",
      order: order ?? 0,
      published: published ?? true,
    };
    if (pdfAssetId) {
      data.pdfFile = { _type: "file", asset: { _type: "reference", _ref: pdfAssetId } };
    }

    if (_id) {
      const patch = { ...data };
      if (!pdfAssetId) delete patch.pdfFile;
      await sanity.patch(_id).set(patch).commit();
      revalidatePath("/sikkumim");
      return NextResponse.json({ ok: true, _id });
    } else {
      if (!pdfAssetId) {
        return NextResponse.json({ error: "קובץ PDF הוא שדה חובה ביצירה" }, { status: 400 });
      }
      const doc = await sanity.create({ _type: "pdfSummary", ...data });
      revalidatePath("/sikkumim");
      return NextResponse.json({ ok: true, _id: doc._id });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
