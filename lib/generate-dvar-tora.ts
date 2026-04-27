import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { STYLE_EXAMPLES, STYLE_NOTES } from "./dvar-tora-examples";
import { ALL_SLUGS_FLAT } from "./parasha-map";
import { smartTagSubtopics } from "./smart-tag-subtopics";

async function callGemini(system: string, user: string): Promise<string> {
  const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = genai.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: system,
    generationConfig: { responseMimeType: "application/json", maxOutputTokens: 4000, temperature: 0.7 },
  });
  const result = await model.generateContent(user);
  return result.response.text();
}

async function callAnthropic(system: string, user: string): Promise<string> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4000,
    system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
    messages: [{ role: "user", content: user }],
  });
  const b = response.content.find((b) => b.type === "text");
  return b?.type === "text" ? b.text : "";
}

const SYSTEM_PROMPT = `אתה כותב דברי תורה קצרים בסגנון הרב רועי אמגר.

סגנון הכתיבה:
- 150-250 מילים בלבד
- פתיחה בשאלת חיים אמיתית או שאלה על הפסוק/מקור — לא תמיד סיפור
- 2-3 מקורות מהתורה, חז"ל או פוסקים בתוך הטקסט
- מסקנה מעשית קצרה וישירה
- שפה ברורה, עכשווית, לא מיושנת
- ללא כותרות, ללא פסקאות מופרדות — גוף אחד רציף
- לא להמציא מקורות — רק מה שמופיע בתמלול

כלל מוחלט — דרשה עצמאית, לא תמלול שיעור:
- אסור לכתוב: "השיעור בנוי על", "בשיעור זה", "כפי שלמדנו", "כפי שנשמע", "הרצאה", "מפגש"
- דבר התורה חייב להיות קריא כדרשה עצמאית — כאילו נכתב מראש, לא מתוך שיעור

${STYLE_NOTES}

דוגמאות לסגנון הנכון:
${STYLE_EXAMPLES}

רשימת slugs חוקיים לשיוך תת-נושאים (השתמש אך ורק ב-slugs מהרשימה הזו):
${ALL_SLUGS_FLAT.join(", ")}

פורמט תגובה (JSON בלבד):
[
  {
    "title": "כותרת קצרה ומושכת (עד 8 מילים)",
    "teaser": "1-2 משפטים שמגרים לקרוא — שאלה שהקורא רוצה לדעת תשובתה",
    "content": "גוף דבר התורה המלא (150-250 מילים)",
    "category": "parasha|halacha|emuna|zugiyut|moadim",
    "subTopics": ["slug1", "slug2"]
  }
]
שדה subTopics: מערך slugs מהרשימה לעיל בלבד. אם התוכן קשור לפרשה ספציפית — ציין את slug הפרשה. אם קשור למועד — ציין את slug המועד. אם אין שיוך ברור — החזר מערך ריק [].`;

export interface DivarToraResult {
  title: string;
  teaser: string;
  content: string;
  category: string;
  subTopics?: string[];
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

  const raw = process.env.GEMINI_API_KEY
    ? await callGemini(SYSTEM_PROMPT, userMessage)
    : await callAnthropic(SYSTEM_PROMPT, userMessage);

  const text = raw.trim();
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return [];

  try {
    const items = JSON.parse(jsonMatch[0]) as DivarToraResult[];
    // שיוך חכם — מחליף את שיוך ה-keywords שנעשה ב-Claude
    return await Promise.all(
      items.map(async (item) => ({
        ...item,
        subTopics: await smartTagSubtopics(item.title, item.content),
      }))
    );
  } catch {
    return [];
  }
}
