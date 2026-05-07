import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@sanity/client";
import { requireAdmin } from "@/lib/require-admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_BYTES = 25 * 1024 * 1024; // 25MB

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  token: process.env.SANITY_API_TOKEN,
  apiVersion: "2024-01-01",
  useCdn: false,
});

function isPdfMagic(buf: Buffer): boolean {
  // %PDF-
  return buf.length >= 5 && buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46 && buf[4] === 0x2d;
}

export async function POST(req: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "חסר קובץ" }, { status: 400 });
    }
    const fileObj = file as File;
    if (fileObj.size > MAX_BYTES) {
      return NextResponse.json({ error: "הקובץ גדול מ-25MB" }, { status: 413 });
    }
    const buf = Buffer.from(await fileObj.arrayBuffer());
    if (!isPdfMagic(buf)) {
      return NextResponse.json({ error: "הקובץ אינו PDF תקין" }, { status: 415 });
    }
    const asset = await sanity.assets.upload("file", buf, {
      filename: fileObj.name,
      contentType: "application/pdf",
    });
    return NextResponse.json({ ok: true, assetId: asset._id, url: asset.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `שגיאה בהעלאת PDF: ${message}` }, { status: 500 });
  }
}
