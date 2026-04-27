/**
 * retag-existing-divrei-tora.ts
 * משייך תת-נושאים לדברי תורה קיימים שאין להם subTopics
 * הרצה: npx tsx scripts/retag-existing-divrei-tora.ts
 * משתני סביבה: NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET, SANITY_API_TOKEN, ANTHROPIC_API_KEY
 */

import { createClient } from "@sanity/client";
import Anthropic from "@anthropic-ai/sdk";
import { ALL_SLUGS_FLAT, validateAndBuildRefs } from "../lib/parasha-map";

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "bssgoew8",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2024-01-01",
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
});

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SLUG_LIST = ALL_SLUGS_FLAT.join(", ");

async function classifySubTopics(title: string, content: string): Promise<string[]> {
  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 200,
    messages: [
      {
        role: "user",
        content: `בחן את דבר התורה הבא וקבע לאיזה תת-נושאים הוא שייך.

כותרת: ${title}
תוכן: ${content.slice(0, 800)}

רשימת slugs חוקיים: ${SLUG_LIST}

החזר JSON בלבד — מערך slugs מהרשימה לעיל (לא יותר מ-3). אם אין שיוך ברור — החזר [].
דוגמה: ["purim"] או ["tazria","metzora"] או ["emuna"] או []`,
      },
    ],
  });

  const text = (response.content[0] as { type: string; text: string }).text.trim();
  const match = text.match(/\[[\s\S]*?\]/);
  if (!match) return [];
  try {
    const parsed = JSON.parse(match[0]) as string[];
    return parsed.filter((s) => ALL_SLUGS_FLAT.includes(s));
  } catch {
    return [];
  }
}

async function main() {
  console.log("\n🔍 מחפש דברי תורה ללא שיוך תת-נושאים...\n");

  const untagged = await sanity.fetch<Array<{ _id: string; title: string; content: string }>>(
    `*[_type == "divarTora" && status == "published" && (
      !defined(subTopics) || count(subTopics) == 0
    )] { _id, title, content }`
  );

  console.log(`נמצאו ${untagged.length} דברי תורה לשיוך\n`);

  let updated = 0;
  let skipped = 0;

  for (const doc of untagged) {
    const slugs = await classifySubTopics(doc.title, doc.content || "");

    if (slugs.length === 0) {
      console.log(`  ⚪ "${doc.title}" — לא נמצא שיוך`);
      skipped++;
      continue;
    }

    const refs = validateAndBuildRefs(slugs);
    await sanity
      .patch(doc._id)
      .set({ subTopics: refs })
      .commit();

    console.log(`  ✅ "${doc.title}" → [${slugs.join(", ")}]`);
    updated++;

    // rate limiting — 1 req/sec for haiku
    await new Promise((r) => setTimeout(r, 1000));
  }

  console.log(`\n✅ סיום: ${updated} עודכנו, ${skipped} ללא שיוך`);
}

main().catch((err) => {
  console.error("שגיאה:", err);
  process.exit(1);
});
