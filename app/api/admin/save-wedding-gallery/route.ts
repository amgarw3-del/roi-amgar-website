import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
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

export async function POST(req: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const body = await req.json();
    const { _id, imageAssetId, caption, order } = body as {
      _id?: string;
      imageAssetId?: string;
      caption?: string;
      order?: number;
    };

    const data: Record<string, unknown> = {
      caption: caption ?? "",
      order: order ?? 0,
    };
    if (imageAssetId) {
      data.image = { _type: "image", asset: { _type: "reference", _ref: imageAssetId } };
    }

    if (_id) {
      const patch = { ...data };
      if (!imageAssetId) delete patch.image;
      await sanity.patch(_id).set(patch).commit();
      revalidatePath("/hupot");
      return NextResponse.json({ ok: true, _id });
    } else {
      if (!imageAssetId) {
        return NextResponse.json({ error: "תמונה היא שדה חובה" }, { status: 400 });
      }
      const doc = await sanity.create({ _type: "weddingGalleryImage", ...data });
      revalidatePath("/hupot");
      return NextResponse.json({ ok: true, _id: doc._id });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
