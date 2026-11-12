/**
 * lib/trigger-weekly-divrei.ts
 *
 * מפעיל את קרון דברי התורה מיד אחרי פרסום דבר תורה.
 * למה: הקרון ב-GitHub Actions רץ בפועל רק כל 6-8 שעות, ולכן דבר תורה שפורסם
 * באיחור (תולדות תשפ"ז — פורסם ביום חמישי בערב) יכול לפספס את החלון.
 * הקרון עצמו מחליט אם יש אירוע קרוב, מסנן כפילויות (lastSentAt) ושולח.
 *
 * רץ ב-after() — לא מעכב את תשובת הפרסום.
 */

import { after } from "next/server";

export function triggerWeeklyDivreiAfterPublish(): void {
  const secret = process.env.CRON_SECRET;
  if (!secret) return;
  // חובה www: הפניה מהדומיין הראשי היא cross-origin ומפילה את כותרת ה-Authorization
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.haravroiamgar.com";

  after(async () => {
    try {
      const res = await fetch(`${siteUrl}/api/cron/weekly-divrei?trigger=publish`, {
        headers: { authorization: `Bearer ${secret}` },
        cache: "no-store",
      });
      const body = await res.text();
      console.log(`[weekly-divrei publish-trigger] ${res.status} ${body.slice(0, 500)}`);
    } catch (e) {
      console.error("[weekly-divrei publish-trigger] failed", e);
    }
  });
}
