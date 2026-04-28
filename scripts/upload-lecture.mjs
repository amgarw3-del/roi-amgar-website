import { createClient } from "@sanity/client";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env.local") });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2024-01-01",
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
});

const [, , imagePath, ...rest] = process.argv;
if (!imagePath) {
  console.error("Usage: node upload-lecture.mjs <image-path>");
  process.exit(1);
}

const TITLE = "אור בחשיכה 🕯️";
const SUMMARY = `הרצאה מרתקת על צדקת הדרך, אמונה וביטחון במלחמת חרבות ברזל. מדורות קודמים ועד ימינו אנו, בשילוב מצגת, מסרים מחזקים וסיפורים אישיים מהמלחמה.

הרב רועי אמגר, רב צבאי ולוחם ששירת למעלה מ-400 ימי מילואים במלחמת חרבות ברזל, יוצא לספר את הרגעים האישיים, דרך סיפורים על גיבורים, ודרך ההיסטוריה והתורה של עם ישראל.

מתאים לכל השנה ובהתאמה לחגים, מועדים ויום הזיכרון.`;

console.log(`Uploading image from: ${imagePath}`);
const buffer = fs.readFileSync(imagePath);
const asset = await client.assets.upload("image", buffer, {
  filename: path.basename(imagePath),
});
console.log(`✓ Image uploaded: ${asset._id}`);

const doc = await client.create({
  _type: "lecture",
  title: TITLE,
  summary: SUMMARY,
  flyer: {
    _type: "image",
    asset: { _type: "reference", _ref: asset._id },
    alt: TITLE,
  },
  order: 1,
  published: true,
});
console.log(`✓ Lecture created: ${doc._id}`);
console.log(`Visit: https://website-seven-kappa-25.vercel.app/lectures`);
