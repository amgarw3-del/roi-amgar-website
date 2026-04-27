// Sanity webhook → re-index a single doc.
// Configure in Sanity manage: trigger on create/update/delete for video|divarTora|blogPost|qna.
// Auth: shared secret in `Authorization: Bearer ${SANITY_WEBHOOK_SECRET}`.

import { NextRequest, NextResponse } from "next/server";
import { client } from "@/sanity/client";
import { indexDoc, deleteDocFromIndex } from "@/lib/chat/index-doc";
import type { IndexableDoc } from "@/lib/chat/extract-text";

const PROJECTION = `{
  _id, _type, title, question, slug, status, hidden, isPublic, publishedAt,
  summary, transcript, teaser, content, body, answer,
  category->{hebrewName, slug}
}`;

const ALLOWED = new Set(["video", "divarTora", "blogPost", "qna"]);

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const secret = process.env.SANITY_WEBHOOK_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: { _id?: string; _type?: string; operation?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  const { _id, _type, operation } = body;
  if (!_id) return NextResponse.json({ error: "missing _id" }, { status: 400 });
  if (_type && !ALLOWED.has(_type)) {
    return NextResponse.json({ ok: true, skipped: "type not indexable" });
  }

  try {
    if (operation === "delete") {
      await deleteDocFromIndex(_id);
      return NextResponse.json({ ok: true, deleted: _id });
    }

    const doc = await client.fetch<IndexableDoc | null>(
      `*[_id == $id][0]${PROJECTION}`,
      { id: _id }
    );
    if (!doc) {
      // doc was deleted between webhook and fetch — remove it from index
      await deleteDocFromIndex(_id);
      return NextResponse.json({ ok: true, deleted: _id, reason: "not found" });
    }

    const result = await indexDoc(doc);
    return NextResponse.json({ ok: true, ...result, id: _id, type: _type });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[embed-content] error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
