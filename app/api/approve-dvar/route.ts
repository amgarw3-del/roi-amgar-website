import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@sanity/client";
import { timingSafeEqual, createHash } from "crypto";

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  token: process.env.SANITY_API_TOKEN,
  apiVersion: "2024-01-01",
  useCdn: false,
});

function safeCompare(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const token = searchParams.get("token");
  const approvalSecret = process.env.APPROVAL_SECRET;

  if (!id || !token || !approvalSecret) {
    return new NextResponse("בקשה שגויה", { status: 400 });
  }

  if (!safeCompare(token, approvalSecret)) {
    return new NextResponse("לא מורשה", { status: 401 });
  }

  try {
    await sanity
      .patch(id)
      .set({ status: "published", publishedAt: new Date().toISOString() })
      .commit();

    return NextResponse.redirect(
      `https://bssgoew8.sanity.studio/structure/divarTora;${id}`,
      { status: 302 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new NextResponse(`שגיאה: ${message}`, { status: 500 });
  }
}
