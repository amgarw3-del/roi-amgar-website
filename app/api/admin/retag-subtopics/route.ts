import { NextResponse } from "next/server";
import { createClient } from "@sanity/client";
import { smartTagSubtopics } from "@/lib/smart-tag-subtopics";
import { slugToRef } from "@/lib/parasha-map";

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  token: process.env.SANITY_API_TOKEN,
  apiVersion: "2024-01-01",
  useCdn: false,
});

// POST — מוגן על ידי middleware (admin session cookie)
// שיוך חכם בעזרת Claude AI במקום keyword matching
export async function POST() {
  const docs = await sanity.fetch<Array<{ _id: string; title: string; content: string }>>(
    `*[_type == "divarTora" && (!defined(subTopics) || count(subTopics) == 0)] { _id, title, content }`
  );

  const results: string[] = [];
  let updated = 0;

  for (const doc of docs) {
    const slugs = await smartTagSubtopics(doc.title, doc.content ?? "");
    if (slugs.length === 0) {
      results.push(`⚪ ${doc.title} — ללא שיוך`);
      continue;
    }
    await sanity
      .patch(doc._id)
      .set({ subTopics: slugs.map(slugToRef) })
      .commit();
    results.push(`✅ ${doc.title} → [${slugs.join(", ")}]`);
    updated++;
  }

  return NextResponse.json({ total: docs.length, updated, results });
}
