import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@sanity/client";

export const dynamic = "force-dynamic";

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  token: process.env.SANITY_API_TOKEN,
  apiVersion: "2024-01-01",
  useCdn: false,
});

const HEBREW_TO_LATIN: Record<string, string> = {
  א: "a", ב: "b", ג: "g", ד: "d", ה: "h", ו: "v", ז: "z", ח: "ch",
  ט: "t", י: "y", כ: "k", ך: "k", ל: "l", מ: "m", ם: "m", נ: "n", ן: "n",
  ס: "s", ע: "a", פ: "p", ף: "p", צ: "ts", ץ: "ts", ק: "q", ר: "r",
  ש: "sh", ת: "t",
};

function toSlug(text: string): string {
  const transliterated = text
    .trim()
    .split("")
    .map((c) => HEBREW_TO_LATIN[c] ?? c)
    .join("");
  return transliterated
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9-]/g, "")
    .toLowerCase()
    .slice(0, 60);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { _id, action, hebrewName, group, order, aliases, slug } = body as {
      _id?: string;
      action?: "delete";
      hebrewName?: string;
      group?: string;
      order?: number;
      aliases?: string[];
      slug?: string;
    };

    if (action === "delete" && _id) {
      await sanity.delete(_id);
      return NextResponse.json({ ok: true });
    }

    if (!hebrewName) {
      return NextResponse.json({ error: "שם עברי חובה" }, { status: 400 });
    }

    const slugCurrent = slug || toSlug(hebrewName) || `sub-${Date.now()}`;

    const data: Record<string, unknown> = {
      hebrewName,
      slug: { _type: "slug", current: slugCurrent },
      group: group ?? "general",
      order: order ?? 0,
      aliases: aliases ?? [],
    };

    if (_id) {
      await sanity.patch(_id).set(data).commit();
      return NextResponse.json({ ok: true, _id });
    }

    const doc = await sanity.create({ _type: "subTopic", ...data });
    return NextResponse.json({
      ok: true,
      _id: doc._id,
      hebrewName,
      slug: { current: slugCurrent },
      group: group ?? "general",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
