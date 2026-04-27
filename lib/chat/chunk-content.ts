// Simple Hebrew-aware chunker. Targets ~700 chars per chunk with ~120 char overlap.
// Voyage handles up to 32K tokens so this is conservative; smaller chunks improve retrieval precision.

const TARGET = 700;
const OVERLAP = 120;
const MAX_CHUNKS_PER_DOC = 50; // safety cap, also bounds deleteByDocId

export function chunk(text: string): string[] {
  const cleaned = text.trim();
  if (cleaned.length <= TARGET) return [cleaned];

  // Split first by paragraphs, then merge greedily up to TARGET.
  const paragraphs = cleaned.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const chunks: string[] = [];
  let buf = "";

  for (const p of paragraphs) {
    if (!buf) {
      buf = p;
      continue;
    }
    if (buf.length + p.length + 2 <= TARGET) {
      buf += "\n\n" + p;
    } else {
      chunks.push(buf);
      // overlap from end of previous chunk
      const tail = buf.slice(Math.max(0, buf.length - OVERLAP));
      buf = tail + "\n\n" + p;
    }
  }
  if (buf) chunks.push(buf);

  // If a single paragraph is huge, hard-split it
  const final: string[] = [];
  for (const c of chunks) {
    if (c.length <= TARGET * 1.4) {
      final.push(c);
    } else {
      for (let i = 0; i < c.length; i += TARGET - OVERLAP) {
        final.push(c.slice(i, i + TARGET));
      }
    }
  }

  return final.slice(0, MAX_CHUNKS_PER_DOC);
}
