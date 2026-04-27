import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { callGemini } from "@/lib/gemini";

const SYSTEM = `אתה עוזר לרב רועי אמגר לכתוב תקציר קצר לדבר תורה.

כתוב 1-2 משפטים שמגרים לקרוא — בלי לגלות את המסר. הטון: ספרותי-תורני, נעים.
אל תתחיל ב"בדבר תורה זה" או "במאמר". כתוב ישירות מן העניין.
החזר JSON בלבד: { "teaser": "..." }`;

export async function POST(req: NextRequest) {
  try {
    const { content } = (await req.json().catch(() => ({}))) as { content?: string };
    if (!content?.trim()) return NextResponse.json({ error: "תוכן חסר" }, { status: 400 });

    const snippet = content.slice(0, 3000);
    const userPrompt = `כתוב תקציר קצר לדבר התורה הבא:\n\n${snippet}`;

    let teaser = "";

    if (process.env.GEMINI_API_KEY) {
      const raw = await callGemini(SYSTEM, userPrompt, { maxOutputTokens: 200 });
      const parsed = JSON.parse(raw) as { teaser?: string };
      teaser = parsed.teaser ?? "";
    } else if (process.env.ANTHROPIC_API_KEY) {
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const msg = await anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 200,
        system: SYSTEM,
        messages: [{ role: "user", content: userPrompt }],
      });
      const raw = msg.content[0]?.type === "text" ? msg.content[0].text : "{}";
      const parsed = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] ?? "{}") as { teaser?: string };
      teaser = parsed.teaser ?? "";
    } else {
      return NextResponse.json({ error: "לא הוגדר מפתח AI" }, { status: 500 });
    }

    if (!teaser) return NextResponse.json({ error: "AI לא החזיר תקציר" }, { status: 500 });
    return NextResponse.json({ teaser });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `שגיאת שרת: ${message}` }, { status: 500 });
  }
}
