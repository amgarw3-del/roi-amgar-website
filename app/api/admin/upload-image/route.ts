import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@sanity/client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  token: process.env.SANITY_API_TOKEN,
  apiVersion: "2024-01-01",
  useCdn: false,
});

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "חסר קובץ" }, { status: 400 });
    }
    const buf = Buffer.from(await (file as File).arrayBuffer());
    const asset = await sanity.assets.upload("image", buf, {
      filename: (file as File).name,
      contentType: (file as File).type || "image/jpeg",
    });
    return NextResponse.json({ ok: true, assetId: asset._id, url: asset.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `שגיאה בהעלאת תמונה: ${message}` }, { status: 500 });
  }
}
