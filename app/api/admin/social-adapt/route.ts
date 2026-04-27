import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";

const SYSTEM = `אתה עוזר לרב רועי אמגר להתאים דברי תורה לרשתות חברתיות.
סגנון: חם, ישיר, לא אקדמי. עברית תקנית. ללא אמוג'ים אלא אם מתאים.

פורמט תגובה (JSON בלבד):
{
  "whatsapp": "גרסה קצרה לוואטסאפ — עד 200 מילה, ללא פורמט מיוחד, רק טקסט עם רווחי שורה. מסתיימת בשאלה לדיון או מחשבה.",
  "instagram": "גרסה לאינסטגרם — 3-4 שורות קצרות ומרשימות, ניתן להוסיף עד 10 האשטגים בסוף (עברית בלבד)."
}`;

export async function POST(req: NextRequest) {
  try {
    const { title, content, teaser } = await req.json() as {
      title: string;
      content: string;
      teaser?: string;
    };

    if (!content) return NextResponse.json({ error: "Missing content" }, { status: 400 });

    const userPrompt = `כותרת: ${title}\n${teaser ? `תקציר: ${teaser}\n` : ""}תוכן:\n${content}`;
    let raw = "";

    if (process.env.GEMINI_API_KEY) {
      const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genai.getGenerativeModel({
        model: "gemini-2.5-flash",
        systemInstruction: SYSTEM,
        generationConfig: { responseMimeType: "application/json", maxOutputTokens: 800, temperature: 0.7 },
      });
      const result = await model.generateContent(userPrompt);
      raw = result.response.text();
    } else if (process.env.ANTHROPIC_API_KEY) {
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const message = await anthropic.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 800,
        system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
        messages: [{ role: "user", content: userPrompt }],
      });
      raw = message.content[0].type === "text" ? message.content[0].text : "";
    } else {
      return NextResponse.json({ error: "לא הוגדר מפתח AI" }, { status: 500 });
    }

    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return NextResponse.json({ error: "AI parse error" }, { status: 500 });

    return NextResponse.json(JSON.parse(match[0]));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `שגיאת שרת: ${message}` }, { status: 500 });
  }
}
