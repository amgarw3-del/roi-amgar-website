/**
 * lib/youtube-message-builder.ts
 *
 * בניית הודעת WhatsApp מוכנה לפרסום כשעולה סרטון יוטיוב חדש.
 * היגיון פשוט בלי AI:
 *  - אימוג'י נבחר לפי מילות מפתח בכותרת
 *  - משפט קצר מחולץ מהתיאור (ואם אין — מהתמלול, ב-route)
 *  - קישור קצר youtu.be (WhatsApp מייצר תצוגה מקדימה עם תמונה אוטומטית)
 */

/** מפת מילות מפתח → אימוג'י. הראשונה שמתאימה בכותרת מנצחת. */
const EMOJI_RULES: { keywords: string[]; emoji: string }[] = [
  { keywords: ["תפיל", "אמונה", "ביטחון", "השגחה", "בורא", "הקדוש ברוך הוא", "ה'"], emoji: "🙏" },
  { keywords: ["שבת", "נר", "הדלקת"], emoji: "🕯️" },
  { keywords: ["פרש", "תורה", "פסוק", "גמרא", "משנה", "לימוד", "שיעור", "אור החיים"], emoji: "📖" },
  { keywords: ["חיזוק", "כוח", "להתגבר", "יצר"], emoji: "💪" },
  { keywords: ["זוגי", "אהבה", "שלום בית", "חתונה", "נישואין"], emoji: "❤️" },
  { keywords: ["ילד", "חינוך", "הורים", "משפח"], emoji: "👨‍👩‍👧" },
  { keywords: ["פרנס", "כסף", "עשיר", "עושר", "ממון"], emoji: "💰" },
  { keywords: ["בריאות", "רפוא", "מחל", "החלמה", "רופא"], emoji: "🩺" },
  { keywords: ["צבא", "חייל", "מלחמ", "ביטחון לאומי", "גיוס"], emoji: "🎖️" },
  { keywords: ["שמח", "חג", "מועד", "שירה"], emoji: "😊" },
  { keywords: ["תשוב", "חטא", "עבר", "כפרה", "סליחה"], emoji: "✨" },
];

const DEFAULT_EMOJI = "🎥";

/**
 * מנקה כותרת יוטיוב: מסיר האשטגים (שמופיעים לרוב בסוף הכותרת),
 * מאחד רווחים, וגוזר מפרידים/פיסוק תלויים בקצה.
 */
export function cleanTitle(title: string): string {
  return title
    .replace(/#[^\s#]+/g, "") // האשטגים
    .replace(/\s+/g, " ")
    .replace(/[\s\-–—.,|]+$/u, "") // מפרידים/פיסוק תלויים בסוף
    .trim();
}

/** בוחר אימוג'י מתאים לפי מילות מפתח בכותרת. */
export function pickEmoji(title: string): string {
  const t = title.toLowerCase();
  for (const rule of EMOJI_RULES) {
    if (rule.keywords.some((kw) => t.includes(kw.toLowerCase()))) {
      return rule.emoji;
    }
  }
  return DEFAULT_EMOJI;
}

const MAX_SENTENCE_LEN = 120;

/**
 * מחלץ משפט קצר מתיאור הסרטון.
 * מסיר שורות שהן רק האשטגים / קישורים / קריאות למעקב, ומחזיר את המשפט
 * האמיתי הראשון (עד ~120 תווים). אם לא נשאר טקסט משמעותי — מחזיר null.
 */
export function extractSentence(description: string | null | undefined): string | null {
  if (!description) return null;

  const lines = description
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  for (const line of lines) {
    // דילוג על שורות שהן רק האשטגים
    const withoutHashtags = line.replace(/#[^\s#]+/g, "").trim();
    if (!withoutHashtags) continue;
    // דילוג על שורות קישור בלבד
    if (/^https?:\/\/\S+$/i.test(withoutHashtags)) continue;
    // דילוג על קריאות מעקב נפוצות
    if (/^(מוזמנים|הירשמו|לעוד|עקבו|שתפו|שיתוף|לייק)/.test(withoutHashtags) && withoutHashtags.length < 25) continue;

    const cleaned = withoutHashtags.replace(/\s+/g, " ").trim();
    if (cleaned.length < 15) continue;

    return truncateSentence(cleaned);
  }

  return null;
}

/** גוזר עד המשפט הראשון או ~120 תווים (על גבול מילה). */
export function truncateSentence(text: string): string {
  const clean = text.replace(/\s+/g, " ").trim();
  // חיתוך על סוף משפט ראשון אם קצר מספיק
  const sentenceEnd = clean.search(/[.!?]/);
  if (sentenceEnd !== -1 && sentenceEnd <= MAX_SENTENCE_LEN) {
    return clean.slice(0, sentenceEnd + 1).trim();
  }
  if (clean.length <= MAX_SENTENCE_LEN) return clean;
  // חיתוך על גבול מילה + שלוש נקודות
  const cut = clean.slice(0, MAX_SENTENCE_LEN);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 40 ? cut.slice(0, lastSpace) : cut).trim() + "…";
}

/** קישור צפייה קצר — עובד גם ל-shorts וגם לרגיל, ומפעיל תצוגה מקדימה בוואטסאפ. */
export function videoUrl(videoId: string): string {
  return `https://youtu.be/${videoId}`;
}

/**
 * מרכיב את הודעת ה-WhatsApp המלאה:
 *   [אימוג'י] *[כותרת]*
 *
 *   [משפט קצר — אם קיים]
 *
 *   ▶️ https://youtu.be/[id]
 */
export function buildVideoMessage(params: {
  title: string;
  sentence?: string | null;
  videoId: string;
}): string {
  const { title, sentence, videoId } = params;
  const clean = cleanTitle(title);
  const emoji = pickEmoji(clean);

  const parts = [`${emoji} *${clean}*`];
  const trimmedSentence = sentence?.trim();
  // מוסיפים משפט רק אם הוא לא כבר מוכל בכותרת (מונע כפילות)
  if (trimmedSentence && !clean.includes(trimmedSentence.replace(/[.!?…]+$/, ""))) {
    parts.push("", trimmedSentence);
  }
  parts.push("", `▶️ ${videoUrl(videoId)}`);

  return parts.join("\n");
}
