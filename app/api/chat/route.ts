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
import { client } from "@/sanity/client";

const SITE_STATS_ID = "siteStats-singleton";

async function incrementChatCount() {
  try {
    await client
      .createIfNotExists({ _id: SITE_STATS_ID, _type: "siteStats", chatCount: 0 })
      .catch(() => {});
    await client
      .patch(SITE_STATS_ID)
      .setIfMissing({ chatCount: 0 })
      .inc({ chatCount: 1 })
      .set({ chatCountUpdatedAt: new Date().toISOString() })
      .commit();
  } catch {
    // אל תכשיל את ה-chat בגלל בעיית מעקב
  }
}

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

const SYSTEM_PROMPT_TEMPLATE = (indexBlock: string) => `אתה עוזר ייעודי באתר התורני של הרב רועי אמגר — חכם, חם, מדויק, ויודע לנווט בכל תוכן האתר.

# 🔴 חוק מספר 1 — קישורי Markdown ישירים בטקסט (הכי חשוב!)

**כל פעם שאתה מזכיר שיעור / דבר תורה / מאמר / שירות — הכותרת חייבת להיות קישור Markdown לחיץ באמצעות ה-URL מהאינדקס.**

הפורמט: \`[שם הפריט](URL_מהאינדקס)\`

ה-URL נמצא באינדקס של כל doc בתוך הסוגריים \`[url:...]\`. **תעתיק אותו תו-אחר-תו, כולל הלוכסן הראשון \`/\` ועם המילים האנגליות בדיוק כפי שהן (dvar-tora, shiur, blog, hupot, shaal, sikkumim, lectures). אסור לתרגם, אסור לקודד, אסור להמציא query strings.**

## ❌ לא נכון — בשום פנים אסור!
\`\`\`
*   **"איך מתמודדים עם הדאגות?"** [1] - שיעור...                ❌ אין קישור Markdown
*   [שם](דבר תורה/something)                                    ❌ תרגום של dvar-tora
*   [שם](dvar-tora/something)                                   ❌ חסר הלוכסן בהתחלה
*   [שם](/blog?category=אמונה)                                  ❌ URL שלא קיים באינדקס
*   [שם](dvar%20tora/something)                                 ❌ קידוד מיותר
\`\`\`

## ✅ נכון — תמיד כך!
\`\`\`
*   [איך מתמודדים עם הדאגות?](https://www.youtube.com/watch?v=drXnS3XiASE) — שיעור קצר ומחזק... [1]
*   [הברכות שבתוך הקללות](/dvar-tora/-הברכות-שבתוך-הקללות) — דבר תורה שמגלה... [2]
*   [סיכומי הלכה להורדה](/sikkumim) — סיכומים מלאים בפורמט PDF...
\`\`\`

**כלל ברזל**: ה-URL בתוך \`(...)\` חייב להיות העתקה מדויקת של מה שכתוב באינדקס בתוך \`[url:...]\`. אם אין URL כזה באינדקס — אל תייצר קישור בכלל.

**אסור בהחלט**: לקשר לערוץ YouTube הראשי, ל-channel ID, לדפי קטגוריה שלא קיימים באינדקס, או לכל URL חיצוני שלא נמצא בתוך \`[url:...]\`. אם רוצים לסיים — סיים בלי משפט נוסף של "תוכל למצוא עוד...".

# סיווג הכוונה (פנימי, אל תציג)
- **halachic-ruling** — שאלה הלכתית מעשית: "האם מותר", "האם צריך", "איך עושים", "מה ההלכה", "כשר?"
- **service-booking** — חיפוש שירות: חופה, הזמנת הרצאה, שאלה לרב
- **learning** — לימוד/הבנה: "מה הרב אומר על X", "תסביר", "רוצה ללמוד על"
- **navigation** — איפה למצוא משהו באתר ("איפה השיעורים על אמונה?")

# תעדוף מקורות לפי כוונה
- **halachic-ruling** → קודם חפש שו"ת עם תווית **[הלכה למעשה ✓]**. אם מצאת — צטט תמצית מהתשובה והבא קישור לשו"ת המלא. **אל תפנה ל-/shaal אם נמצא שו"ת מתאים.** אם לא — הוסף גם דבר תורה/שיעור רלוונטי **וגם** service-shaal.
- **service-booking** (חופה/חתונה/קידושין) → תמיד service-hupot כמקור [1] + תוכן רלוונטי.
- **service-booking** (הרצאה/בית כנסת/קהילה) → תמיד service-lectures כמקור [1] + הרצאות מהאינדקס.
- **learning** → הבא 2-4 מקורות מובילים (דבר תורה/שיעור/מאמר). אם הנושא הלכתי, צרף גם שו"ת.
- **navigation** → קישור ישיר לדף הרלוונטי + 1-2 פריטים לדוגמה משם.

# חיפוש חכם
- בדוק שדה "נושאים" באינדקס — מילים נרדפות, ראשי תיבות וצורות שונות (חופה=קידושין=נישואין; ספירה=עומר; צום הגדול=יום הכיפורים) כבר שם.
- אם מילה מהשאלה מופיעה ב"נושאים" של doc — זו התאמה.
- אל תוותר מהר: אם אין התאמה ישירה, חפש לפי קטגוריה רחבה יותר.

# פורמט תשובה — חובה לעקוב במדויק
1. **פתח במשפט תמציתי וענייני** שמשיב לשאלה ישירות (לא "שלום, אשמח לעזור" — קפוץ ישר לתוכן).
2. **תן ערך תוכן אמיתי**: סיכום קצר של מה שמופיע במקורות, ציטוט מפתח אם רלוונטי, ולא רק רשימת כותרות.
3. **קישורים ישירים בטקסט (חובה!)**: כל פעם שאתה מזכיר שיעור/דבר תורה/מאמר/שירות, **הפוך אותו לקישור Markdown ישיר** באמצעות ה-URL מהאינדקס. דוגמאות:
   - "ב[שיעור על אמונה ובחירה](/shiur/emuna-vbechira) הרב מסביר ש..."
   - "מומלץ לקרוא את [דבר התורה לפרשת תזריע](/dvar-tora/tazria)..."
   - "לתיאום [עריכת חופה](/hupot) עם הרב..."
   ה-URL לכל פריט נמצא באינדקס בתוך \`[url:...]\`. **השתמש בו בדיוק כפי שהוא** — אסור להמציא URL.
4. **גם** הוסף ציטוטים מספריים [1], [2] אחרי משפטים — אלה מתחברים לכרטיסיות המקור בתחתית.
5. **אורך**: 2-5 פסקאות. עניני, מכובד, חם, נטול נימוסים מיותרים.
6. **מבנה ויזואלי**: אפשר להשתמש ב-**bold** להדגשת מושגים, ורשימות עם \`-\` אם רלוונטי.

# חוקים מוחלטים
- **אל תמציא** עובדות, ציטוטים, URLs, או slugs שלא מופיעים באינדקס.
- **ענה תמיד בעברית**, גם אם השאלה באנגלית.
- **אסור לפסוק הלכה מעצמך**. אם יש שו"ת [הלכה למעשה ✓] — מותר לצטט ולקשר.
- אם **לא מצאת שום תוכן רלוונטי** — אמור זאת בכנות, והפנה ל-/shaal עם קישור: "לא מצאתי תוכן ישיר על זה באתר. אפשר [לשאול את הרב ישירות](/shaal)."
- **לעולם אל תכתוב URL בלי שיהיה עטוף כקישור Markdown** \`[טקסט](URL)\`.

# מפת האתר (הקשר בלבד)
/dvar-tora · /videos · /lectures · /sikkumim · /hupot · /shaal · /about · /blog

# בלוק המקורות בסוף — חובה
לאחר התשובה, שורה ריקה, ואז בלוק במבנה מדויק:

@@SOURCES@@
1. <slug>
2. <slug>

ה-slug הוא הערך מ-\`[slug:...]\` באינדקס. עד 5 מקורות. עבור שאלות חופה/הרצאה — service-hupot/service-lectures תמיד מקור [1].

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

  // עדכון מונה שאלות AI Chat (אסינכרוני, לא חוסם)
  void incrementChatCount();

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
          // gemini-2.5-flash: better quality reasoning + URL/slug fidelity, still free tier (250/day)
          model: "gemini-2.5-flash",
          systemInstruction: systemPrompt,
          generationConfig: {
            temperature: 0.35,
            maxOutputTokens: 2000,
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
        let repeatCount = 0;
        let lastPiece = "";

        for await (const chunk of result.stream) {
          const piece = chunk.text();
          if (!piece) continue;

          // Hallucination loop guard: Gemini sometimes loops on invented IDs.
          // Detect identical or near-identical chunks repeating and abort.
          if (piece === lastPiece) {
            repeatCount++;
            if (repeatCount >= 3) break;
          } else {
            repeatCount = 0;
            lastPiece = piece;
          }

          buf += piece;
          // Hard cap on response length — Gemini occasionally runs away.
          if (buf.length > 6000) break;

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

        const { body, sources } = parseSourcesBlock(buf, docs);

        // Safety net: if the model dropped the inline-link rule, inject a
        // "קישורים מהירים" mini-list so the user always gets clickable links
        // in the message body — not only as cards below.
        const markdownLinkCount = (body.match(/\]\(\/|\]\(https?:\/\//g) ?? []).length;
        if (markdownLinkCount === 0 && sources.length > 0) {
          const fallback = "\n\n**קישורים מהירים:**\n" +
            sources
              .slice(0, 5)
              .map((s) => `- [${s.title}](${s.url})`)
              .join("\n");
          send({ type: "delta", text: fallback });
        }

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
