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

export async function findBestDivarTora(
  sanity: SanityClient,
  params: {
    group: EventGroup;
    searchHints: string[];
  }
): Promise<MatchedDivarTora | null> {
  const { group, searchHints } = params;

  // GROQ: דבר תורה מפורסם שיש לו subTopic מהקבוצה הרצויה
  // ושמתאים לפי aliases/hebrewName של ה-subTopic
  const query = `
    *[
      _type == "divarTora" &&
      status == "published" &&
      count(subTopics[@->group == $group]) > 0 &&
      (
        count(subTopics[@->hebrewName in $hints]) > 0 ||
        count(subTopics[count((@->aliases)[@ in $hints]) > 0]) > 0 ||
        count(searchKeywords[@ in $hints]) > 0
      )
    ] | order(coalesce(lastSentAt, "1970-01-01") asc, publishedAt desc) [0] {
      _id,
      title,
      "slug": slug.current,
      teaser,
      shortId,
      lastSentAt,
      publishedAt
    }
  `;

  const result = await sanity.fetch<MatchedDivarTora | null>(query, {
    group,
    hints: searchHints,
  });

  return result;
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
