// Full reindex of all indexable docs. Protected by SANITY_WEBHOOK_SECRET (shared with webhook).
// Run after first deploy, or whenever the chunking/embedding strategy changes.
//
// Usage: curl -X POST https://<host>/api/reindex -H "Authorization: Bearer $SECRET"

import { NextRequest, NextResponse } from "next/server";
import { client } from "@/sanity/client";
import { indexDoc } from "@/lib/chat/index-doc";
import type { IndexableDoc } from "@/lib/chat/extract-text";

export const maxDuration = 300; // up to 5 min on Vercel Pro

const QUERY = `*[_type in ["video","divarTora","blogPost","qna"]] {
  _id, _type, title, question, slug, status, hidden, isPublic, publishedAt,
  summary, transcript, teaser, content, body, answer,
  category->{hebrewName, slug}
}`;

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const secret = process.env.SANITY_WEBHOOK_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const docs = await client.fetch<IndexableDoc[]>(QUERY);
  const summary = { total: docs.length, indexed: 0, skipped: 0, errors: [] as string[] };

  for (const doc of docs) {
    try {
      const r = await indexDoc(doc);
      if (r.chunks > 0) summary.indexed++;
      else summary.skipped++;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      summary.errors.push(`${doc._id}: ${message}`);
    }
  }

  return NextResponse.json(summary);
}
