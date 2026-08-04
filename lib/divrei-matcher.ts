/**
 * lib/divrei-matcher.ts
 *
 * שולף דבר תורה מתאים לאירוע מתוך Sanity:
 * - סינון לפי קבוצת subTopic (parasha/moed/fast/national)
 * - תיעדוף לפי התאמת שם
 * - מיון לפי lastSentAt asc nulls first (הכי ישן או לא נשלח קודם)
 */

import type { SanityClient } from "@sanity/client";
import type { EventGroup } from "./image-prompts";

export interface MatchedDivarTora {
  _id: string;
  title: string;
  slug: string;
  teaser: string;
  shortId: string | null;
  lastSentAt: string | null;
  publishedAt: string | null;
}

/**
 * נרמול שם עברי להתאמה עמידה בפני הבדלי כתיב.
 * מטפל בכל סוגי אי-ההתאמה שנתקלנו בהם:
 *   1. ניקוד (hebcal מנקד, Sanity לא) — "פִּינְחָס" מול "פינחס"
 *   2. כתיב מלא/חסר ביו"ד/וי"ו — "פינחס"↔"פנחס", "מצורע"↔"מצרע", "קדושים"↔"קדשים"
 *   3. רווחים ומקפים — "שלח לך" / "שלח־לך" / "שלחלך"
 *
 * מסיר יו"ד/וי"ו (אמות קריאה) מכל מילה **פרט לאות הראשונה** — כדי לא לשבש
 * שמות שמתחילים בוי"ו/יו"ד ("וישלח", "וילך"). נבדק: 0 התנגשויות בין 54 הפרשות
 * (הסרה גלובלית של וי"ו הייתה יוצרת התנגשות "וישלח"↔"שלח").
 */
function normalizeHebrewName(s: string): string {
  return (s || "")
    .replace(/[֑-ׇ]/g, "") // ניקוד וטעמי מקרא
    .replace(/[\s\-־]+/g, " ") // מאחד רווחים ומקפים לרווח בודד
    .split(" ")
    .map((w) => (w.length ? w[0] + w.slice(1).replace(/[יו]/g, "") : w)) // שומר אות ראשונה
    .join("")
    .trim();
}

/**
 * מחזיר את *כל* דברי התורה המתאימים לאירוע (כולל כאלה שכבר נשלחו).
 * ההתאמה נעשית ב-JS עם נרמול (לא GROQ exact) — עמיד בפני הבדלי כתיב.
 * הסינון לפי lastSentAt נעשה ב-route ע"י filterUnsent — כך אפשר להבחין בין
 * "אין תוכן במאגר" (→ התראה) לבין "יש תוכן אבל כבר נשלח" (→ לא עושים כלום).
 */
export async function findAllDivreiTora(
  sanity: SanityClient,
  params: {
    group: EventGroup;
    searchHints: string[];
  }
): Promise<MatchedDivarTora[]> {
  const { group, searchHints } = params;

  // שולף את כל דברי התורה בקבוצה (parasha/moed/...) עם נתוני התיוג שלהם.
  // ההתאמה לשם האירוע נעשית ב-JS למטה עם נרמול.
  const query = `
    *[
      _type == "divarTora" &&
      status == "published" &&
      count(subTopics[@->group == $group]) > 0
    ] | order(coalesce(lastSentAt, "1970-01-01") asc, publishedAt desc) {
      _id,
      title,
      "slug": slug.current,
      teaser,
      shortId,
      lastSentAt,
      publishedAt,
      "tagNames": subTopics[@->group == $group]->hebrewName,
      "tagAliases": subTopics[@->group == $group]->aliases[],
      searchKeywords
    }
  `;

  type Row = MatchedDivarTora & {
    tagNames?: (string | null)[];
    tagAliases?: (string | null)[];
    searchKeywords?: (string | null)[];
  };

  const rows = (await sanity.fetch<Row[]>(query, { group })) ?? [];

  const normHints = new Set(searchHints.map(normalizeHebrewName).filter(Boolean));

  const matched = rows.filter((r) => {
    const candidates = [
      ...(r.tagNames ?? []),
      ...(r.tagAliases ?? []),
      ...(r.searchKeywords ?? []),
    ];
    return candidates.some((c) => c && normHints.has(normalizeHebrewName(c)));
  });

  // מסיר את שדות העזר לפני החזרה
  return matched.map(({ tagNames, tagAliases, searchKeywords, ...rest }) => rest);
}

/**
 * מסנן דברי תורה שעוד לא נשלחו (או שנשלחו לפני יותר מ-6 ימים — אירוע שנה שעברה).
 * דבר תורה חדש (ללא lastSentAt) תמיד נכלל.
 * resend=true → מחזיר את כולם (התעלמות מהדדופ, לשליחה ידנית).
 */
export function filterUnsent(
  divrei: MatchedDivarTora[],
  opts: { resend?: boolean } = {}
): MatchedDivarTora[] {
  if (opts.resend) return divrei;
  const cutoff = new Date(Date.now() - 6 * 24 * 3600 * 1000).toISOString();
  return divrei.filter((d) => !d.lastSentAt || d.lastSentAt < cutoff);
}

/** @deprecated השתמש ב-findAllDivreiTora */
export async function findBestDivarTora(
  sanity: SanityClient,
  params: {
    group: EventGroup;
    searchHints: string[];
  }
): Promise<MatchedDivarTora | null> {
  const all = await findAllDivreiTora(sanity, params);
  return all[0] ?? null;
}

/** עדכון lastSentAt לאחר שליחה מוצלחת */
export async function markAsSent(sanity: SanityClient, divarToraId: string): Promise<void> {
  await sanity
    .patch(divarToraId)
    .set({ lastSentAt: new Date().toISOString() })
    .commit();
}

/**
 * יצירת shortId לדבר תורה אם אין לו (משמש בקיצור URL).
 * Server-side: מחייב לוודא ייחודיות.
 */
export async function ensureShortId(
  sanity: SanityClient,
  divarToraId: string
): Promise<string> {
  const existing = await sanity.fetch<{ shortId: string | null }>(
    `*[_id == $id][0]{ shortId }`,
    { id: divarToraId }
  );

  if (existing?.shortId) return existing.shortId;

  // ייצור nanoid פשוט (6 תווים alphanumeric)
  const newShortId = generateShortId();

  // וידוא ייחודיות
  let candidate = newShortId;
  let collision = await sanity.fetch<number>(
    `count(*[_type == "divarTora" && shortId == $sid])`,
    { sid: candidate }
  );
  let retries = 0;
  while (collision > 0 && retries < 5) {
    candidate = generateShortId();
    collision = await sanity.fetch<number>(
      `count(*[_type == "divarTora" && shortId == $sid])`,
      { sid: candidate }
    );
    retries++;
  }

  await sanity.patch(divarToraId).set({ shortId: candidate }).commit();
  return candidate;
}

function generateShortId(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let s = "";
  for (let i = 0; i < 6; i++) {
    s += chars[Math.floor(Math.random() * chars.length)];
  }
  return s;
}

/** חיפוש דבר תורה לפי shortId — לhrefדף הקצר */
export async function findBySlugOrShortId(
  sanity: SanityClient,
  identifier: string
): Promise<{ slug: string } | null> {
  return sanity.fetch<{ slug: string } | null>(
    `*[_type == "divarTora" && (shortId == $id || slug.current == $id)][0]{ "slug": slug.current }`,
    { id: identifier }
  );
}
