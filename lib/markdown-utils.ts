// Lightweight markdown utilities for inline (**bold**, *italic*) + line-level (> quote).
// Used by DOCX generator and email sender. Not a full markdown parser — only the
// subset supported by the dvar tora editor.

export type InlineRun = { text: string; bold?: boolean; italic?: boolean };

export type MdParagraph = {
  kind: "paragraph" | "quote";
  runs: InlineRun[];
};

export function parseInlineRuns(line: string): InlineRun[] {
  // Tokenize **bold** first, then *italic*, leaving plain text in between.
  // We process non-greedy and avoid breaking standalone asterisks.
  const runs: InlineRun[] = [];
  let i = 0;
  let buffer = "";
  const flush = (extra?: Partial<InlineRun>) => {
    if (buffer.length === 0) return;
    runs.push({ text: buffer, ...extra });
    buffer = "";
  };

  while (i < line.length) {
    if (line[i] === "*" && line[i + 1] === "*") {
      const end = line.indexOf("**", i + 2);
      if (end > i + 2) {
        flush();
        runs.push({ text: line.slice(i + 2, end), bold: true });
        i = end + 2;
        continue;
      }
    }
    if (line[i] === "*") {
      const end = line.indexOf("*", i + 1);
      if (end > i + 1 && line[end - 1] !== "*" && line[end + 1] !== "*") {
        flush();
        runs.push({ text: line.slice(i + 1, end), italic: true });
        i = end + 1;
        continue;
      }
    }
    buffer += line[i];
    i++;
  }
  flush();
  return runs.length ? runs : [{ text: line }];
}

export function parseMarkdownContent(content: string): MdParagraph[] {
  const paragraphs: MdParagraph[] = [];
  const lines = content.split(/\n/);
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i++;
      continue;
    }
    if (line.trimStart().startsWith("> ")) {
      // Collect consecutive quote lines into one quote paragraph (joined with spaces).
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trimStart().startsWith("> ")) {
        quoteLines.push(lines[i].trimStart().slice(2));
        i++;
      }
      const joined = quoteLines.join(" ");
      paragraphs.push({ kind: "quote", runs: parseInlineRuns(joined) });
      continue;
    }
    paragraphs.push({ kind: "paragraph", runs: parseInlineRuns(line) });
    i++;
  }
  return paragraphs;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function markdownToHtml(content: string): string {
  const paragraphs = parseMarkdownContent(content);
  return paragraphs
    .map((p) => {
      const runsHtml = p.runs
        .map((r) => {
          let txt = escapeHtml(r.text);
          if (r.bold) txt = `<strong style="color:#1a3a52">${txt}</strong>`;
          if (r.italic) txt = `<em>${txt}</em>`;
          return txt;
        })
        .join("");
      if (p.kind === "quote") {
        return `<blockquote style="font-family:'Frank Ruhl Libre',Georgia,serif;border-right:4px solid #a86a2c;padding:8px 16px;margin:16px 0;background:rgba(245,236,217,0.4);font-size:1.1em;font-weight:500;color:#1a3a52">${runsHtml}</blockquote>`;
      }
      return `<p style="margin:0 0 12px;line-height:1.8">${runsHtml}</p>`;
    })
    .join("");
}
