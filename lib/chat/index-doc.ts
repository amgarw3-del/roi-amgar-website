// Orchestrates: extract → chunk → embed → upsert for a single Sanity document.

import { extract, type IndexableDoc } from "./extract-text";
import { chunk } from "./chunk-content";
import { embed } from "./voyage";
import { upsertVectors, deleteByDocId, type VectorMetadata } from "./upstash-vector";

export async function indexDoc(doc: IndexableDoc): Promise<{ chunks: number; skipped?: string }> {
  const extracted = extract(doc);
  if (!extracted) {
    // Doc no longer indexable (unpublished/hidden/private/deleted) — remove from index.
    await deleteByDocId(doc._id);
    return { chunks: 0, skipped: "not-indexable" };
  }

  const chunks = chunk(extracted.text);
  if (!chunks.length) return { chunks: 0, skipped: "no-chunks" };

  // Prepend title to each chunk to boost retrieval
  const chunkTexts = chunks.map((c) => `${extracted.title}\n\n${c}`);
  const vectors = await embed(chunkTexts, "document");

  // Replace any existing vectors for this doc first
  await deleteByDocId(doc._id);

  const items = vectors.map((vec, idx) => {
    const metadata: VectorMetadata = {
      docId: extracted.docId,
      type: extracted.type,
      title: extracted.title,
      slug: extracted.slug,
      category: extracted.category,
      url: extracted.url,
      publishedAt: extracted.publishedAt,
      chunkIdx: idx,
      text: chunks[idx], // store the un-prefixed chunk for context
    };
    return {
      id: `${extracted.docId}__${idx}`,
      vector: vec,
      metadata,
    };
  });

  await upsertVectors(items);
  return { chunks: items.length };
}

export async function deleteDocFromIndex(docId: string): Promise<void> {
  await deleteByDocId(docId);
}
