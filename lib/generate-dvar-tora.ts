import Anthropic from "@anthropic-ai/sdk";
import { STYLE_EXAMPLES, STYLE_NOTES } from "./dvar-tora-examples";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `אתה כותב דברי תורה קצרים בסגנון הרב רועי אמגר.

סגנון הכתיבה:
- 150-250 מילים בלבד
- פתיחה בשאלת חיים אמיתית או שאלה על הפסוק/מקור — לא תמיד סיפור
- 2-3 מקורות מהתורה, חז"ל או פוסקים בתוך הטקסט
- מסקנה מעשית קצרה וישירה
- שפה ברורה, עכשווית, לא מיושנת
- ללא כותרות, ללא פסקאות מופרדות — גוף אחד רציף
- לא להמציא מקורות — רק מה שמופיע בתמלול

${STYLE_NOTES}

דוגמאות לסגנון הנכון:
${STYLE_EXAMPLES}

פורמט תגובה (JSON בלבד):
[
  {
    "title": "כותרת קצרה ומושכת (עד 8 מילים)",
    "teaser": "1-2 משפטים שמגרים לקרוא — שאלה שהקורא רוצה לדעת תשובתה",
    "content": "גוף דבר התורה המלא (150-250 מילים)",
    "category": "parasha|halacha|emuna|zugiyut|moadim"
  }
]`;

interface DivarToraResult {
  title: string;
  teaser: string;
  content: string;
  category: string;
}

export async function generateDvarTora(
  transcript: string,
  videoTitle: string
): Promise<DivarToraResult[]> {
  const userMessage = `כותרת השיעור: ${videoTitle}

תמלול השיעור:
${transcript.slice(0, 12000)}

---
צור 2-3 דברי תורה קצרים מהשיעור הזה. הוצא נקודות שונות מהתמלול.
החזר מערך JSON: [{ title, teaser, content, category }, ...]`;

  const response = await client.messages.create({
    model: "claude-opus-4-7",
    max_tokens: 4000,
    thinking: { type: "adaptive" },
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: userMessage }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") return [];

  const text = textBlock.text.trim();
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return [];

  try {
    return JSON.parse(jsonMatch[0]) as DivarToraResult[];
  } catch {
    return [];
  }
}
