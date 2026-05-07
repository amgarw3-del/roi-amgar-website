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

function toSlug(text: string) {
  return text.trim().replace(/\s+/g, "-").replace(/[^a-zA-Z0-9-]/g, "").toLowerCase().slice(0, 60);
}

export async function POST(req: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const body = await req.json();
    const { _id, name, hebrewName, slug, description } = body as {
      _id?: string;
      name?: string;
      hebrewName?: string;
      slug?: string;
      description?: string;
    };
    if (!hebrewName) {
      return NextResponse.json({ error: "שם עברי חובה" }, { status: 400 });
    }
    const englishName = name || toSlug(hebrewName);
    const slugCurrent = slug || toSlug(name ?? hebrewName);
    if (!slugCurrent) {
      return NextResponse.json({ error: "כתובת URL חובה" }, { status: 400 });
    }

    const data: Record<string, unknown> = {
      name: englishName,
      hebrewName,
      slug: { _type: "slug", current: slugCurrent },
      description: description ?? "",
    };

    if (_id) {
      await sanity.patch(_id).set(data).commit();
      return NextResponse.json({ ok: true, _id });
    } else {
      const doc = await sanity.create({ _type: "category", ...data });
      return NextResponse.json({ ok: true, _id: doc._id });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
