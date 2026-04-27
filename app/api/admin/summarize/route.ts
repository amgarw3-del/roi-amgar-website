import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@sanity/client";
import { STYLE_NOTES, STYLE_EXAMPLES } from "@/lib/dvar-tora-examples";

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  apiVersion: "2024-01-01",
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
});

async function fetchLiveExamples(): Promise<string> {
  try {
    const items = await sanity.fetch<Array<{ title: string; content: string }>>(
      `*[_type == "divarTora" && status == "published" && defined(content)] | order(publishedAt desc) [0...3] {
        title, content
      }`
    );
    if (!items?.length) return "";
    return items.map((it) => `📌 ${it.title}\n\n${it.content}`).join("\n\n---\n\n");
  } catch (err) {
    console.warn("[summarize] fetchLiveExamples failed:", err);
    return "";
  }
}

const STATIC_RULES = `אתה כותב דברי תורה בסגנון הרב רועי אמגר — רב ישראלי עכשווי הכותב דברי תורה ספרותיים-תורניים לשולחן שבת ולכל עת.

סגנון הכתיבה — עקרונות מחייבים:
אורך: 300–420 מילים. לא לקצר — הרב מעדיף עומק על פני קיצור.
כותרת: פורמט "נושא — מסר" (דוגמה: "מה שמשה לא יכול להבין").
פתיחה: שאלה חדה שאדם אמיתי היה שואל. לא "בפרשתנו" — אלא "למה X? ולמה Y?".
זרימה: כל פסקה מוסיפה שכבה על הקודמת — לא רשימה, אלא מהלך שמתפתח.
מקורות: ציטוט מלא בעברית + שם ספר, פרק, פסוק. פרשנים (נצי"ב, שפת אמת, רש"י) — בשמם ובספרם.
שפה: ספרותית-תורנית, נעימה לקריאה בקול. לא אקדמית, לא סלנג.
מסר סגירה: 2-3 משפטים ישירים שנוגעים — קריאה לחיים, לא פתגם.
לא להמציא מקורות. אם חסר מקור — [ניתן להוסיף מקור בנושא זה].

אסור בהחלט:
"בשיעור זה", "כפי שלמדנו", "הרב אמר", "ראינו יחד", "נסכם", "לסיכום".
רשימות ממוספרות (1. 2. 3.) בתוך הטקסט.
מעברים של "ראשית... שנית... לסיום...".
משפטי "ולכן נלמד כי...", "מכאן ניתן להסיק".
קווי הפרדה ויזואלית כלשהם (─, ═, ---).
הדבר תורה נכתב כאדם שמדבר — זורם, נעים לקריאה, כאילו נכתב ביד אחת.

${STYLE_NOTES}

פורמט תגובה — JSON בלבד, ללא כל טקסט נוסף:
{
  "items": [
    {
      "title": "כותרת — מסר (עד 8 מילים)",
      "teaser": "1-2 משפטים שמגרים לקרוא — לא מגלים את המסר",
      "content": "גוף דבר התורה המלא",
      "category": "parasha|halacha|emuna|zugiyut|moadim"
    }
  ]
}
כשמבקשים מספר דברי תורה (count > 1) — מערך עם מספר פריטים, כל אחד נושא שונה.`;

type AiOutput = { items?: Array<{ title: string; teaser: string; content: string; category?: string }> };

async function callGemini(systemPrompt: string, userPrompt: string, maxTokens: number): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY!;
  const genai = new GoogleGenerativeAI(apiKey);
  const model = genai.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: systemPrompt,
    generationConfig: {
      responseMimeType: "application/json",
      maxOutputTokens: maxTokens,
      temperature: 0.7,
    },
  });
  const result = await model.generateContent(userPrompt);
  return result.response.text();
}

async function callAnthropic(systemPrompt: string, userPrompt: string, maxTokens: number): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY!;
  const anthropic = new Anthropic({ apiKey });
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: maxTokens,
    system: [{ type: "text", text: systemPrompt, cache_control: { type: "ephemeral" } }],
    messages: [{ role: "user", content: userPrompt }],
  });
  return message.content[0]?.type === "text" ? message.content[0].text : "";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null) as { text?: string; count?: number; provider?: string } | null;
    if (!body) {
      return NextResponse.json({ error: "גוף בקשה לא תקין" }, { status: 400 });
    }
    const { text, count = 1, provider } = body;
    if (!text?.trim()) {
      return NextResponse.json({ error: "טקסט חסר" }, { status: 400 });
    }

    // בחירת ספק — Gemini אם יש מפתח, אחרת Anthropic
    const hasGemini = !!process.env.GEMINI_API_KEY;
    const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;
    const selected = provider ?? (hasGemini ? "gemini" : hasAnthropic ? "anthropic" : null);

    if (!selected) {
      return NextResponse.json(
        { error: "לא הוגדר GEMINI_API_KEY וגם לא ANTHROPIC_API_KEY" },
        { status: 500 }
      );
    }

    const requestedCount = Math.min(Math.max(1, count), 5);

    const liveExamples = await fetchLiveExamples();
    const examplesSection = liveExamples
      ? `דוגמאות לסגנון הנכון — נלמדו מדברי תורה שהרב אישר:\n\n${liveExamples}`
      : `דוגמאות לסגנון הנכון:\n${STYLE_EXAMPLES}`;
    const fullPrompt = `${STATIC_RULES}\n\n${examplesSection}`;

    const userPrompt = requestedCount === 1
      ? `צור דבר תורה אחד מהחומר הבא. בחר את הנושא החזק ביותר:\n\n${text.slice(0, 12000)}`
      : `צור ${requestedCount} דברי תורה שונים מהחומר הבא. כל אחד על נושא אחר:\n\n${text.slice(0, 12000)}`;

    const maxTokens = Math.min(8000, 2000 * requestedCount);

    let raw = "";
    let usedProvider = selected;
    try {
      if (selected === "gemini") {
        raw = await callGemini(fullPrompt, userPrompt, maxTokens);
      } else {
        raw = await callAnthropic(fullPrompt, userPrompt, maxTokens);
      }
    } catch (primaryErr) {
      // נסה fallback אם יש
      const otherProvider = selected === "gemini" && hasAnthropic ? "anthropic"
                          : selected === "anthropic" && hasGemini ? "gemini"
                          : null;
      if (otherProvider) {
        console.warn(`[summarize] ${selected} failed, trying ${otherProvider}:`, primaryErr);
        raw = otherProvider === "gemini"
          ? await callGemini(fullPrompt, userPrompt, maxTokens)
          : await callAnthropic(fullPrompt, userPrompt, maxTokens);
        usedProvider = otherProvider;
      } else {
        throw primaryErr;
      }
    }

    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("[summarize] no JSON in response:", raw.slice(0, 500));
      return NextResponse.json(
        { error: `${usedProvider} לא החזיר JSON תקין`, raw: raw.slice(0, 200) },
        { status: 500 }
      );
    }

    const parsed = JSON.parse(jsonMatch[0]) as AiOutput;
    if (!parsed.items?.length) {
      return NextResponse.json({ error: "AI לא החזיר items" }, { status: 500 });
    }

    if (requestedCount === 1 && parsed.items.length === 1) {
      return NextResponse.json({ ...parsed.items[0], items: parsed.items, provider: usedProvider });
    }
    return NextResponse.json({ ...parsed, provider: usedProvider });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[summarize] unhandled error:", err);
    return NextResponse.json({ error: `שגיאת שרת: ${message}` }, { status: 500 });
  }
}
