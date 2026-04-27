/**
 * ingest-source-files.ts
 * מעבד קבצי מקור (docx/txt) ויוצר טיוטות דברי תורה ב-Sanity
 * הרצה: npx tsx scripts/ingest-source-files.ts [--dry-run]
 * הנח קבצים ב: website/source-files/
 * משתני סביבה: NEXT_PUBLIC_SANITY_PROJECT_ID, SANITY_API_TOKEN, ANTHROPIC_API_KEY
 */

import fs from "fs/promises";
import path from "path";
import { createClient } from "@sanity/client";
import { generateDvarTora } from "../lib/generate-dvar-tora";
import { extractText, chunkText } from "../lib/parse-source-files";
import { validateAndBuildRefs } from "../lib/parasha-map";

const DRY_RUN = process.argv.includes("--dry-run");
const SOURCE_DIR = path.join(__dirname, "..", "source-files");

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "bssgoew8",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2024-01-01",
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
});

async function getCategoryRef(slug: string): Promise<{ _type: "reference"; _ref: string } | null> {
  const cat = await sanity
    .fetch<{ _id: string } | null>(
      `*[_type == "category" && slug.current == $slug][0]{ _id }`,
      { slug }
    )
    .catch(() => null);
  return cat ? { _type: "reference", _ref: cat._id } : null;
}

async function saveDraftToSanity(
  dvar: { title: string; teaser: string; content: string; category: string; subTopics?: string[] },
  sourceFile: string
) {
  const slug = dvar.title
    .replace(/[^\u0590-\u05FF\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 60);

  const uniqueSlug = `${slug}-${Date.now()}`;
  const categoryRef = await getCategoryRef(dvar.category);
  const subTopicRefs = dvar.subTopics ? validateAndBuildRefs(dvar.subTopics) : [];

  await sanity.create({
    _type: "divarTora",
    title: dvar.title,
    slug: { _type: "slug", current: uniqueSlug },
    teaser: dvar.teaser,
    content: dvar.content,
    sourceType: "uploaded",
    status: "draft",
    publishedAt: new Date().toISOString(),
    ...(categoryRef ? { category: categoryRef } : {}),
    ...(subTopicRefs.length > 0 ? { subTopics: subTopicRefs } : {}),
  });
}

async function main() {
  console.log(`\n📂 ${DRY_RUN ? "[DRY RUN] " : ""}מעבד קבצים מ: ${SOURCE_DIR}\n`);

  let files: string[];
  try {
    const entries = await fs.readdir(SOURCE_DIR);
    files = entries.filter((f) => /\.(docx|txt)$/i.test(f));
  } catch {
    console.error(`❌ תיקיית source-files לא נמצאה: ${SOURCE_DIR}`);
    console.error("צור את התיקייה והנח בה קבצי .docx או .txt");
    process.exit(1);
  }

  if (files.length === 0) {
    console.log("⚠️  לא נמצאו קבצי .docx או .txt");
    process.exit(0);
  }

  console.log(`נמצאו ${files.length} קבצים:\n`);

  let totalChunks = 0;
  let totalDrafts = 0;

  for (const file of files) {
    const filePath = path.join(SOURCE_DIR, file);
    console.log(`📄 ${file}`);

    try {
      const text = await extractText(filePath);
      const chunks = chunkText(text);
      totalChunks += chunks.length;
      console.log(`   ${chunks.length} חלקים, ${text.length} תווים`);

      if (DRY_RUN) continue;

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        console.log(`   ⏳ מעבד חלק ${i + 1}/${chunks.length}...`);

        const divrei = await generateDvarTora(chunk, file.replace(/\.[^.]+$/, "")).catch(
          (e) => {
            console.error(`   ⚠️  שגיאת Claude: ${e.message}`);
            return [];
          }
        );

        for (const dvar of divrei) {
          await saveDraftToSanity(dvar, file);
          console.log(`   ✅ נשמר: "${dvar.title}" [${(dvar.subTopics || []).join(", ") || "ללא שיוך"}]`);
          totalDrafts++;
        }

        // pause between chunks to avoid rate limiting
        if (i < chunks.length - 1) await new Promise((r) => setTimeout(r, 2000));
      }
    } catch (err) {
      console.error(`   ❌ שגיאה: ${(err as Error).message}`);
    }

    console.log();
  }

  if (DRY_RUN) {
    console.log(`\n📊 [DRY RUN] סה"כ: ${files.length} קבצים, ${totalChunks} חלקים`);
    console.log("הרץ ללא --dry-run ליצירת הטיוטות ב-Sanity");
  } else {
    console.log(`\n✅ סיום! ${totalDrafts} טיוטות נשמרו ב-Sanity`);
    console.log("הטיוטות יישלחו ב-3 ליום דרך ה-cron היומי");
  }
}

main().catch((err) => {
  console.error("שגיאה:", err);
  process.exit(1);
});
