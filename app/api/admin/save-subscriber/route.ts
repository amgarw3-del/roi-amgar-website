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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { _id, email, name, phone } = body as {
      _id?: string;
      email?: string;
      name?: string;
      phone?: string;
    };
    if (!email || !name) {
      return NextResponse.json({ error: "שם ואימייל הם שדות חובה" }, { status: 400 });
    }
    const data = { email: email.trim(), name: name.trim(), phone: phone?.trim() ?? "" };
    if (_id) {
      await sanity.patch(_id).set(data).commit();
      return NextResponse.json({ ok: true, _id });
    }
    const doc = await sanity.create({
      _type: "subscriber",
      ...data,
      createdAt: new Date().toISOString(),
    });
    return NextResponse.json({ ok: true, _id: doc._id });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
