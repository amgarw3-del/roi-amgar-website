import { NextRequest, NextResponse } from "next/server";
import { client } from "@/sanity/client";

export async function POST(req: NextRequest) {
  try {
    const { _id } = await req.json();
    if (!_id || typeof _id !== "string") {
      return NextResponse.json({ error: "חסר _id" }, { status: 400 });
    }
    await client.patch(_id).inc({ viewCount: 1 }).commit();
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "שגיאה" }, { status: 500 });
  }
}
