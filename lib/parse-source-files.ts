import fs from "fs/promises";
import path from "path";

export async function extractText(filePath: string): Promise<string> {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === ".txt") {
    const buf = await fs.readFile(filePath);
    return buf.toString("utf-8");
  }

  if (ext === ".docx") {
    // mammoth must be installed: npm install mammoth
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mammoth = require("mammoth");
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value as string;
  }

  throw new Error(`Unsupported file type: ${ext}`);
}

export function chunkText(
  text: string,
  maxChars = 5000,
  overlap = 500
): string[] {
  const paragraphs = text.split(/\n{2,}/);
  const chunks: string[] = [];
  let current = "";

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;

    if ((current + "\n\n" + trimmed).length > maxChars && current.length > 0) {
      chunks.push(current.trim());
      // keep last ~overlap chars as context for next chunk
      const words = current.split(/\s+/);
      let tail = "";
      for (let i = words.length - 1; i >= 0; i--) {
        tail = words[i] + " " + tail;
        if (tail.length >= overlap) break;
      }
      current = tail.trim() + "\n\n" + trimmed;
    } else {
      current = current ? current + "\n\n" + trimmed : trimmed;
    }
  }

  if (current.trim()) chunks.push(current.trim());
  return chunks;
}
