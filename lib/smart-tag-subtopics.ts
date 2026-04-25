import Anthropic from "@anthropic-ai/sdk";
import { ALL_SLUGS_FLAT, ALL_SUBTOPIC_SLUGS } from "./parasha-map";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM = `אתה מומחה לתורה ומתמחה בשיוך דברי תורה לנושאים ספציפיים.

המשימה שלך: לקבל דבר תורה (כותרת + תוכן) ולהחזיר JSON של slugs לתת-נושאים רלוונטיים.

כללים קריטיים:
1. מקסימום 3 slugs לכל דבר תורה
2. שיוך **מהותי בלבד** — הנושא חייב להיות מרכזי בדבר התורה, לא אזכור אגבי
3. אם יש ספק — אל תשייך. עדיף 0 תגים מ-3 תגים שגויים
4. השתמש רק ב-slugs מהרשימות שלהלן

קטגוריות:
- **פרשיות שבוע** (parasha): שיוך רק אם הפרשה היא הנושא המרכזי או שהדבר תורה דרוש לפרשה ספציפית
- **מועדים** (moed): שיוך רק אם החג/מועד הוא ליבת הדבר תורה
- **צומות** (fast): שיוך רק אם הצום עצמו נדון בפירוט
- **לאומיים** (national): שיוך רק אם האירוע הלאומי הוא הנושא הישיר

תהליך חשיבה (בצע לפני כל תגובה):
1. מהו הרעיון המרכזי של דבר התורה? (משפט אחד)
2. האם פסוק/פרשה מסוימת היא הנושא או רק ציטוט תומך?
3. האם מוזכר מועד/יום מיוחד כנושא מרכזי?
4. האם השיוך מהותי (נושא) או עקיף (ציטוט/אזכור)?

slugs חוקיים:
parasha: ${ALL_SUBTOPIC_SLUGS.parasha.join(", ")}
moed: ${ALL_SUBTOPIC_SLUGS.moed.join(", ")}
fast: ${ALL_SUBTOPIC_SLUGS.fast.join(", ")}
national: ${ALL_SUBTOPIC_SLUGS.national.join(", ")}

פורמט תגובה: JSON בלבד, מערך של slugs. דוגמאות:
["purim", "taanit-esther"] — אם הדבר תורה עוסק בפורים ובתענית אסתר כנושאים ישירים
["vayera"] — אם הדבר תורה הוא על פרשת וירא בלבד
[] — אם אין שיוך מהותי ברור`;

export async function smartTagSubtopics(
  title: string,
  content: string
): Promise<string[]> {
  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 200,
      system: SYSTEM,
      messages: [
        {
          role: "user",
          content: `כותרת: ${title}\n\nתוכן:\n${content.slice(0, 3000)}`,
        },
      ],
    });

    const text = response.content.find((b) => b.type === "text")?.text ?? "[]";
    const match = text.match(/\[[\s\S]*?\]/);
    if (!match) return [];

    const parsed = JSON.parse(match[0]) as string[];
    return parsed
      .filter((s) => ALL_SLUGS_FLAT.includes(s))
      .slice(0, 3);
  } catch {
    return [];
  }
}
