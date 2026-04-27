import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@sanity/client";

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  token: process.env.SANITY_API_TOKEN,
  apiVersion: "2024-01-01",
  useCdn: false,
});

export async function POST(req: NextRequest) {
  const { id, hidden } = await req.json() as { id: string; hidden: boolean };
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  await sanity.patch(id).set({ hidden: Boolean(hidden) }).commit();
  return NextResponse.json({ ok: true });
}
