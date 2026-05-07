import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@sanity/client";
import { requireAdmin } from "@/lib/require-admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_BYTES = 10 * 1024 * 1024; // 10MB

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  token: process.env.SANITY_API_TOKEN,
  apiVersion: "2024-01-01",
  useCdn: false,
});

// בודק 4-12 בייטים ראשונים מול חתימת קובץ ידועה. מחזיר contentType או null.
function detectImageType(buf: Buffer): string | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return "image/png";
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38) return "image/gif";
  if (
    buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
    buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50
  ) return "image/webp";
  return null;
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
      return NextResponse.json({ error: "הקובץ גדול מ-10MB" }, { status: 413 });
    }
    const buf = Buffer.from(await fileObj.arrayBuffer());
    const detected = detectImageType(buf);
    if (!detected) {
      return NextResponse.json({ error: "סוג קובץ לא נתמך — רק PNG/JPEG/GIF/WebP" }, { status: 415 });
    }
    const asset = await sanity.assets.upload("image", buf, {
      filename: fileObj.name,
      contentType: detected,
    });
    return NextResponse.json({ ok: true, assetId: asset._id, url: asset.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `שגיאה בהעלאת תמונה: ${message}` }, { status: 500 });
  }
}
