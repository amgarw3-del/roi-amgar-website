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

const args = process.argv.slice(2);
const get = (flag) => {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : null;
};

const imagePath = get("--image");
const title = get("--title");
const summary = get("--summary");
const order = parseInt(get("--order") || "0", 10);

if (!imagePath || !title || !summary) {
  console.error(
    'Usage: node upload-lecture.mjs --image <path> --title "<title>" --summary "<summary>" [--order N]'
  );
  process.exit(1);
}

console.log(`Uploading: ${path.basename(imagePath)}`);
const buffer = fs.readFileSync(imagePath);
const asset = await client.assets.upload("image", buffer, {
  filename: path.basename(imagePath),
});
console.log(`✓ Image: ${asset._id}`);

const doc = await client.create({
  _type: "lecture",
  title,
  summary,
  flyer: {
    _type: "image",
    asset: { _type: "reference", _ref: asset._id },
    alt: title,
  },
  order,
  published: true,
});
console.log(`✓ Lecture: ${doc._id} ("${title}")`);
