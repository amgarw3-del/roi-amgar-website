/**
 * app/d/[id]/route.ts
 *
 * Short link resolver — קישור קצר וקבוע לכל דבר תורה.
 * /d/abc123 → 301 redirect → /divrei-tora/[slug]
 *
 * היתרון: קישור קצר, פנימי, חינמי, לעולם לא נשבר.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@sanity/client";
import { findBySlugOrShortId } from "@/lib/divrei-matcher";

export const dynamic = "force-dynamic";

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  apiVersion: "2024-01-01",
  useCdn: true,
});

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;

  if (!id || id.length > 60) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const result = await findBySlugOrShortId(sanity, id);

  if (!result?.slug) {
    return NextResponse.redirect(new URL("/divrei-tora", req.url), 302);
  }

  const target = new URL(`/divrei-tora/${result.slug}`, req.url);
  return NextResponse.redirect(target, 301);
}
