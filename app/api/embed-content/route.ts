// Sanity webhook → invalidates the in-memory doc index so the next chat rebuilds it.
// Auth: shared secret in `Authorization: Bearer ${SANITY_WEBHOOK_SECRET}`.

import { NextRequest, NextResponse } from "next/server";
import { invalidateDocIndex } from "@/lib/chat/doc-index";

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const secret = process.env.SANITY_WEBHOOK_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  invalidateDocIndex();
  return NextResponse.json({ ok: true, invalidated: true });
}
