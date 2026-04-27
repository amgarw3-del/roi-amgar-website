// In-memory index of all indexable docs. Cached at module level with a TTL,
// invalidated by the Sanity webhook. Fed wholesale to Gemini Flash on each chat.

import { client } from "@/sanity/client";
import { extract, type IndexableDoc, type ExtractedDoc } from "./extract-text";

export interface IndexedDoc {
  docId: string;
  type: string;
  typeLabel: string;
  title: string;
  slug: string;
  url: string;
  category?: string;
  publishedAt?: string;
  /** Compact preview — first 600 chars of the body. Enough for routing decisions. */
  preview: string;
}

const TYPE_LABELS: Record<string, string> = {
  video: "שיעור מוסרט",
  divarTora: "דבר תורה",
  blogPost: "מאמר",
  qna: "שאלה ותשובה",
};

const TTL_MS = 10 * 60 * 1000; // 10 minutes

interface Cache {
  builtAt: number;
  docs: IndexedDoc[];
}

let cache: Cache | null = null;
let inflight: Promise<IndexedDoc[]> | null = null;

const QUERY = `*[_type in ["video","divarTora","blogPost","qna"]] {
  _id, _type, title, question, slug, status, hidden, isPublic, publishedAt,
  summary, transcript, teaser, content, body, answer,
  category->{hebrewName, slug}
}`;

function toIndexed(extracted: ExtractedDoc): IndexedDoc {
  return {
    docId: extracted.docId,
    type: extracted.type,
    typeLabel: TYPE_LABELS[extracted.type] ?? extracted.type,
    title: extracted.title,
    slug: extracted.slug,
    url: extracted.url,
    category: extracted.category,
    publishedAt: extracted.publishedAt,
    preview: extracted.text.slice(0, 600),
  };
}

async function fetchAll(): Promise<IndexedDoc[]> {
  const docs = await client.fetch<IndexableDoc[]>(QUERY);
  const out: IndexedDoc[] = [];
  for (const d of docs) {
    const ex = extract(d);
    if (ex) out.push(toIndexed(ex));
  }
  // Newest first
  out.sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""));
  return out;
}

export async function getDocIndex(): Promise<IndexedDoc[]> {
  const now = Date.now();
  if (cache && now - cache.builtAt < TTL_MS) return cache.docs;
  if (inflight) return inflight;

  inflight = (async () => {
    const docs = await fetchAll();
    cache = { builtAt: Date.now(), docs };
    inflight = null;
    return docs;
  })();
  return inflight;
}

export function invalidateDocIndex(): void {
  cache = null;
}

/** Build the compact textual block fed to the LLM. ~150 chars per doc. */
export function buildIndexBlock(docs: IndexedDoc[]): string {
  return docs
    .map((d) => {
      const cat = d.category ? ` | קטגוריה: ${d.category}` : "";
      return `[slug:${d.slug}] (${d.typeLabel}${cat}) ${d.title}\n  ${d.preview.slice(0, 220)}`;
    })
    .join("\n\n");
}

export function lookupBySlug(docs: IndexedDoc[], slug: string): IndexedDoc | undefined {
  return docs.find((d) => d.slug === slug);
}
