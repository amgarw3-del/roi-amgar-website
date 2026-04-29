// RAG-lite chat endpoint — Gemini 2.5 Flash with the entire site index in context.
// No vector DB, no embeddings — fits hundreds of docs in Gemini's 1M context.
//
// Protocol (NDJSON):
//   {"type":"sources","sources":[...]}
//   {"type":"delta","text":"..."}
//   {"type":"done"}
//   {"type":"error","message":"..."}

import { NextRequest } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  getDocIndex,
  buildIndexBlock,
  lookupBySlug,
  type IndexedDoc,
} from "@/lib/chat/doc-index";

export const runtime = "nodejs";
export const maxDuration = 60;

interface ClientMessage {
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

const SYSTEM_PROMPT_TEMPLATE = (indexBlock: string) => `אתה עוזר ניווט ידידותי באתר התורני של הרב רועי אמגר. תפקידך:

1. **לעזור לגולש למצוא תוכן** — שיעורים, דברי תורה, מאמרים, שאלות ותשובות, הרצאות וסיכומי רבנות שכבר קיימים באתר.
2. **לסכם בקצרה** את מה שהרב מדבר עליו בנושא, על בסיס הרשימה שלמטה בלבד.
3. **תמיד לצטט** את המקורות בפורמט [1], [2] וכו' לאחר משפט/טענה.

חוקים מוחלטים:
- **אסור לפסוק הלכה.** אם השאלה הלכתית מעשית ("מותר/אסור", "האם צריך", "איך עושים הלכתית"), השב: "זו שאלה הלכתית מעשית — מומלץ לפנות ישירות לרב כאן: /shaal" + הצע שיעור/דבר תורה רלוונטי אם יש ברשימה.
- **אם אין ברשימה תוכן רלוונטי** — אמור בכנות "לא מצאתי על זה תוכן באתר" והפנה ל-/shaal.
- **אל תמציא** עובדות, מקורות, או ציטוטים שלא מופיעים ברשימה.
- **ענה תמיד בעברית**, גם אם השאלה באנגלית.
- **קצר וברור** — 2-4 פסקאות מקסימום. שפה נעימה, חמה, ענייני.
- **אם שאלה קשורה לחופה/קידושין/נישואין** — הפנה ל-/hupot בנוסף לכל תוכן רלוונטי ברשימה.

מפת האתר (השתמש בה כשמפנה לדפים):
- /dvar-tora    — דברי תורה (רשימה כוללת)
- /videos       — שיעורים מוסרטים (רואים תורה)
- /lectures     — הרצאות (שבת, יום הולדת, ברית מילה, אירוסין ועוד)
- /sikkumim     — סיכומי רבנות ב-PDF (שבת, כשרות, נידה, אבלות, יורה דעה)
- /hupot        — עריכת חופות (הרב כמסדר קידושין)
- /shaal        — שאל את הרב (שאלה הלכתית מעשית)
- /about        — אודות הרב

פורמט תגובה — חובה:
- כתוב את התשובה בעברית, עם ציטוטים [1], [2] וכו' אחרי משפטים רלוונטיים.
- בסוף התשובה (בשורה נפרדת) הוסף בלוק במבנה הזה בדיוק:

@@SOURCES@@
1. <slug-של-מקור-מספר-1>
2. <slug-של-מקור-מספר-2>

כאשר ה-slug הוא הערך שמופיע באינדקס בתוך [slug:...]. השתמש רק ב-slugs מהרשימה. אל תמציא slugs.

=========================================
האינדקס של תוכן האתר (השתמש רק במה שכאן):
=========================================

${indexBlock}

=========================================`;

interface SourcePayload {
  id: number;
  title: string;
  type: string;
  typeLabel: string;
  category?: string;
  url: string;
  external?: boolean;
}

function parseSourcesBlock(text: string, docs: IndexedDoc[]): {
  body: string;
  sources: SourcePayload[];
} {
  const marker = "@@SOURCES@@";
  const idx = text.indexOf(marker);
  if (idx === -1) return { body: text.trim(), sources: [] };

  const body = text.slice(0, idx).trim();
  const after = text.slice(idx + marker.length);
  const sources: SourcePayload[] = [];
  const seen = new Set<string>();

  for (const line of after.split("\n")) {
    const m = line.match(/^\s*(\d+)\.\s*(.+?)\s*$/);
    if (!m) continue;
    const slug = m[2].replace(/^[`'"\[\(]+|[`'"\]\)]+$/g, "").trim();
    if (!slug || seen.has(slug)) continue;
    const doc = lookupBySlug(docs, slug);
    if (!doc) continue;
    seen.add(slug);
    sources.push({
      id: sources.length + 1,
      title: doc.title,
      type: doc.type,
      typeLabel: doc.typeLabel,
      category: doc.category,
      url: doc.url,
      external: doc.external,
    });
  }

  return { body, sources };
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

  let messages: ClientMessage[];
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

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "GEMINI_API_KEY missing" }), {
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
        const docs = await getDocIndex();
        if (docs.length === 0) {
          send({ type: "sources", sources: [] });
          send({
            type: "delta",
            text: "אין עדיין תוכן זמין באתר. נסה שוב בקרוב 🙏",
          });
          send({ type: "done" });
          controller.close();
          return;
        }

        const indexBlock = buildIndexBlock(docs);
        const systemPrompt = SYSTEM_PROMPT_TEMPLATE(indexBlock);

        const genai = new GoogleGenerativeAI(apiKey);
        const model = genai.getGenerativeModel({
          // gemini-2.5-flash-lite: 1000 req/day free tier — best fit for personal site
          model: "gemini-2.5-flash-lite",
          systemInstruction: systemPrompt,
          generationConfig: {
            temperature: 0.5,
            maxOutputTokens: 1500,
          },
        });

        const history = messages.slice(0, -1).map((m) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        }));

        const chat = model.startChat({ history });
        const result = await chat.sendMessageStream(lastUser.content);

        const marker = "@@SOURCES@@";
        let buf = "";
        let emittedUpTo = 0;
        let inSources = false;

        for await (const chunk of result.stream) {
          const piece = chunk.text();
          if (!piece) continue;
          buf += piece;

          if (!inSources) {
            const markerIdx = buf.indexOf(marker);
            if (markerIdx !== -1) {
              if (markerIdx > emittedUpTo) {
                send({ type: "delta", text: buf.slice(emittedUpTo, markerIdx) });
              }
              emittedUpTo = markerIdx;
              inSources = true;
            } else {
              const safeUpTo = Math.max(emittedUpTo, buf.length - marker.length);
              if (safeUpTo > emittedUpTo) {
                send({ type: "delta", text: buf.slice(emittedUpTo, safeUpTo) });
                emittedUpTo = safeUpTo;
              }
            }
          }
        }

        if (!inSources && emittedUpTo < buf.length) {
          send({ type: "delta", text: buf.slice(emittedUpTo) });
        }

        const { sources } = parseSourcesBlock(buf, docs);
        send({ type: "sources", sources });
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
