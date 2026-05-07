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

export async function POST(req: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const body = await req.json();
    const { _id, question, answer, order, published } = body as {
      _id?: string;
      question?: string;
      answer?: string;
      order?: number;
      published?: boolean;
    };

    if (!question || !answer) {
      return NextResponse.json({ error: "שאלה ותשובה הם שדות חובה" }, { status: 400 });
    }

    const data = {
      question,
      answer,
      order: order ?? 0,
      published: published ?? true,
    };

    if (_id) {
      await sanity.patch(_id).set(data).commit();
      return NextResponse.json({ ok: true, _id });
    } else {
      const doc = await sanity.create({ _type: "lectureFaq", ...data });
      return NextResponse.json({ ok: true, _id: doc._id });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
