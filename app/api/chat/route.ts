// RAG chat endpoint — streams Claude Haiku responses with site-content citations.
//
// Protocol (NDJSON, one event per line):
//   {"type":"sources","sources":[{id,title,type,category,url}]}
//   {"type":"delta","text":"..."}
//   {"type":"done"}
//   {"type":"error","message":"..."}

import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { embedQuery } from "@/lib/chat/voyage";
import { queryVectors, type VectorMatch } from "@/lib/chat/upstash-vector";

export const runtime = "nodejs"; // Anthropic SDK + fetch — Node runtime is fine
export const maxDuration = 60;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const RATE_LIMIT = 20;
const RATE_WINDOW_SEC = 60 * 60;
const ipRequests = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Math.floor(Date.now() / 1000);
  const entry = ipRequests.get(ip);
  if (!entry || now > entry.resetAt) {
    ipRequests.set(ip, { count: 1, resetAt: now + RATE_WINDOW_SEC });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

const TYPE_LABELS: Record<string, string> = {
  video: "שיעור מוסרט",
  divarTora: "דבר תורה",
  blogPost: "מאמר",
  qna: "שאלה ותשובה",
};

const SYSTEM_PROMPT = `אתה עוזר ניווט ידידותי באתר התורני של הרב רועי אמגר. תפקידך:

1. **לעזור לגולש למצוא תוכן** — שיעורים, דברי תורה, מאמרים, ושאלות ותשובות שכבר קיימים באתר.
2. **לסכם בקצרה** את מה שהרב כותב/אומר בנושא, על בסיס המקורות המצורפים בלבד.
3. **תמיד לצטט** את המקורות בפורמט [1], [2] וכו' לאחר כל טענה.

חוקים מוחלטים:
- **אסור לפסוק הלכה.** אם השאלה הלכתית מעשית ("מותר/אסור", "האם צריך", "איך עושים הלכתית"), השב: "זו שאלה הלכתית מעשית — מומלץ לפנות ישירות לרב כאן: /shaal" + הצע שיעור/דבר תורה רלוונטי אם יש.
- **אם אין מקורות רלוונטיים** במידע המצורף — אמור בכנות "לא מצאתי על זה תוכן באתר" והפנה ל-/shaal.
- **אל תמציא** עובדות, מקורות, או ציטוטים שלא מופיעים במקורות המצורפים.
- **ענה תמיד בעברית**, גם אם השאלה באנגלית.
- **קצר וברור** — 2-4 פסקאות מקסימום. שפה נעימה, חמה, ענייני.
- אל תכתוב "כפי שמובא במקור 1" — פשוט שים [1] בסוף המשפט.`;

function buildContextBlock(matches: VectorMatch[]): { context: string; sources: SourcePayload[] } {
  // Dedupe by docId — keep best chunk per doc
  const seen = new Map<string, VectorMatch>();
  for (const m of matches) {
    const key = m.metadata.docId;
    if (!seen.has(key) || (seen.get(key)!.score < m.score)) {
      seen.set(key, m);
    }
  }
  const top = [...seen.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  const sources: SourcePayload[] = top.map((m, i) => ({
    id: i + 1,
    title: m.metadata.title,
    type: m.metadata.type,
    typeLabel: TYPE_LABELS[m.metadata.type] ?? m.metadata.type,
    category: m.metadata.category,
    url: m.metadata.url,
  }));

  const context = top
    .map(
      (m, i) =>
        `<source id="${i + 1}" type="${TYPE_LABELS[m.metadata.type] ?? m.metadata.type}" title="${m.metadata.title}">\n${m.metadata.text}\n</source>`
    )
    .join("\n\n");

  return { context, sources };
}

interface SourcePayload {
  id: number;
  title: string;
  type: string;
  typeLabel: string;
  category?: string;
  url: string;
}

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0] ??
    "unknown";
  if (!checkRateLimit(ip)) {
    return new Response(
      JSON.stringify({ error: "שלחת יותר מדי שאלות. נסה שוב בעוד שעה." }),
      { status: 429, headers: { "Content-Type": "application/json" } }
    );
  }

  let messages: ChatMessage[];
  try {
    const body = await req.json();
    messages = body.messages;
    if (!Array.isArray(messages) || messages.length === 0) throw new Error();
  } catch {
    return new Response(JSON.stringify({ error: "bad request" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  if (!lastUser?.content?.trim()) {
    return new Response(JSON.stringify({ error: "no user message" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY missing" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: object) => {
        controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
      };

      try {
        // 1. Embed the last user question (use full conversation context for better retrieval)
        const recentTurns = messages
          .slice(-4)
          .map((m) => m.content)
          .join("\n");
        const queryVec = await embedQuery(recentTurns.slice(0, 1500));

        // 2. Retrieve
        const matches = await queryVectors(queryVec, 12);
        const filtered = matches.filter((m) => m.score >= 0.4);
        const { context, sources } = buildContextBlock(filtered);

        send({ type: "sources", sources });

        if (sources.length === 0) {
          const fallback =
            "לא מצאתי תוכן רלוונטי באתר על השאלה הזו 😕\n\nתוכל לנסח אחרת, או לשלוח את השאלה ישירות לרב [כאן](/shaal).";
          send({ type: "delta", text: fallback });
          send({ type: "done" });
          controller.close();
          return;
        }

        // 3. Stream Claude
        const anthropic = new Anthropic({ apiKey });

        const userBlock = `שאלת המשתמש: ${lastUser.content}\n\nמקורות מהאתר:\n${context}`;

        const claudeMessages: Anthropic.MessageParam[] = messages
          .slice(0, -1)
          .filter((m) => m.role === "user" || m.role === "assistant")
          .map((m) => ({ role: m.role, content: m.content }));
        claudeMessages.push({ role: "user", content: userBlock });

        const claudeStream = anthropic.messages.stream({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 1024,
          system: [
            { type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } },
          ],
          messages: claudeMessages,
        });

        for await (const event of claudeStream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            send({ type: "delta", text: event.delta.text });
          }
        }
        send({ type: "done" });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("[chat] error:", err);
        send({ type: "error", message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
