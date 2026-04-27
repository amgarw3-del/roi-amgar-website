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
  const { id, answer, publish } = await req.json() as {
    id: string;
    answer?: string;
    publish?: boolean;
  };
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const patch = sanity.patch(id);
  if (answer !== undefined) patch.set({ answer });
  if (publish !== undefined) {
    patch.set({
      isPublic: publish,
      publishedAt: publish ? new Date().toISOString() : undefined,
    });
  }
  await patch.commit();
  return NextResponse.json({ ok: true });
}
