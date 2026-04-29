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
    const { _id, quote, name, role, photoAssetId, order } = body as {
      _id?: string;
      quote?: string;
      name?: string;
      role?: string;
      photoAssetId?: string;
      order?: number;
    };

    if (!quote || !name) {
      return NextResponse.json({ error: "ציטוט ושם הם שדות חובה" }, { status: 400 });
    }

    const data: Record<string, unknown> = {
      quote,
      name,
      role: role ?? "",
      order: order ?? 0,
    };
    if (photoAssetId) {
      data.photo = { _type: "image", asset: { _type: "reference", _ref: photoAssetId } };
    }

    if (_id) {
      const patch = { ...data };
      if (!photoAssetId) delete patch.photo;
      await sanity.patch(_id).set(patch).commit();
      revalidatePath("/hupot");
      return NextResponse.json({ ok: true, _id });
    } else {
      const doc = await sanity.create({ _type: "weddingTestimonial", ...data });
      revalidatePath("/hupot");
      return NextResponse.json({ ok: true, _id: doc._id });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
