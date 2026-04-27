// Upstash Vector — REST API wrapper.
// Docs: https://upstash.com/docs/vector/api/endpoints

export interface VectorMetadata {
  docId: string;       // Sanity _id (parent doc)
  type: string;        // video | divarTora | blogPost | qna
  title: string;
  slug: string;
  category?: string;
  url: string;         // path on the site (e.g. /shiur/foo)
  publishedAt?: string;
  chunkIdx: number;
  text: string;        // the chunk itself, for use as RAG context
}

export interface VectorMatch {
  id: string;
  score: number;
  metadata: VectorMetadata;
}

interface UpstashConfig {
  url: string;
  token: string;
}

function config(): UpstashConfig {
  const url = process.env.UPSTASH_VECTOR_REST_URL;
  const token = process.env.UPSTASH_VECTOR_REST_TOKEN;
  if (!url || !token) {
    throw new Error("UPSTASH_VECTOR_REST_URL / UPSTASH_VECTOR_REST_TOKEN not set");
  }
  return { url, token };
}

async function call<T>(path: string, body: unknown): Promise<T> {
  const { url, token } = config();
  const res = await fetch(`${url}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Upstash ${path} ${res.status}: ${text.slice(0, 300)}`);
  }
  const json = (await res.json()) as { result: T };
  return json.result;
}

export async function upsertVectors(
  vectors: Array<{ id: string; vector: number[]; metadata: VectorMetadata }>
): Promise<void> {
  if (!vectors.length) return;
  // Upstash supports batch upsert by sending an array
  await call("/upsert", vectors);
}

export async function queryVectors(
  vector: number[],
  topK = 8
): Promise<VectorMatch[]> {
  const res = await call<VectorMatch[]>("/query", {
    vector,
    topK,
    includeMetadata: true,
  });
  return res ?? [];
}

/** Delete all chunks belonging to a doc (matched via metadata.docId in id prefix). */
export async function deleteByDocId(docId: string): Promise<void> {
  // Vector ids follow pattern `${docId}__${chunkIdx}` so we list and delete by prefix.
  // Upstash supports `delete` with array of ids; we can't query by prefix directly,
  // so we keep a generous upper bound (50 chunks per doc).
  const ids: string[] = [];
  for (let i = 0; i < 50; i++) ids.push(`${docId}__${i}`);
  await call("/delete", { ids });
}
