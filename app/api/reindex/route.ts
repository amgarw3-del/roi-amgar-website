// Force-rebuild the in-memory doc index. Useful for manual refresh + diagnostics.
// Protected by SANITY_WEBHOOK_SECRET.

import { NextRequest, NextResponse } from "next/server";
import { getDocIndex, invalidateDocIndex } from "@/lib/chat/doc-index";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const secret = process.env.SANITY_WEBHOOK_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  invalidateDocIndex();
  const docs = await getDocIndex();

  const breakdown: Record<string, number> = {};
  for (const d of docs) breakdown[d.type] = (breakdown[d.type] ?? 0) + 1;

  return NextResponse.json({
    ok: true,
    total: docs.length,
    breakdown,
  });
}

export async function GET(req: NextRequest) {
  return POST(req);
}
