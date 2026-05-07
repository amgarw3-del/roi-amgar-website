import { NextRequest, NextResponse } from "next/server";
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

const SINGLETON_ID = "homepage-singleton";

export async function POST(req: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const body = await req.json();
    const {
      heroTitle, heroSubtitle, heroImageAssetId, heroCtaLabel, heroCtaHref, blocks,
    } = body as {
      heroTitle?: string;
      heroSubtitle?: string;
      heroImageAssetId?: string | null;
      heroCtaLabel?: string;
      heroCtaHref?: string;
      blocks?: { type: string; enabled: boolean }[];
    };

    const data: Record<string, unknown> = {
      heroTitle: heroTitle ?? "",
      heroSubtitle: heroSubtitle ?? "",
      heroCtaLabel: heroCtaLabel ?? "",
      heroCtaHref: heroCtaHref ?? "",
      blocks: (blocks ?? []).map((b, i) => ({
        _type: "homeBlock",
        _key: `block-${b.type}-${i}`,
        type: b.type,
        enabled: b.enabled !== false,
      })),
    };
    if (heroImageAssetId) {
      data.heroImage = { _type: "image", asset: { _type: "reference", _ref: heroImageAssetId } };
    } else if (heroImageAssetId === null) {
      data.heroImage = null;
    }

    await sanity.createOrReplace({ _id: SINGLETON_ID, _type: "homepage", ...data });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
