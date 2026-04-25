import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@sanity/client";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { _id } = body as { _id?: string };

  if (!_id) {
    return NextResponse.json({ error: "חסר מזהה" }, { status: 400 });
  }

  const sanity = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
    token: process.env.SANITY_API_TOKEN,
    apiVersion: "2024-01-01",
    useCdn: false,
  });

  await sanity
    .patch(_id)
    .set({ status: "published", publishedAt: new Date().toISOString() })
    .commit();

  return NextResponse.json({ ok: true });
}
