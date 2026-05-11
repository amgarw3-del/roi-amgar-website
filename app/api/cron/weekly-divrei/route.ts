/**
 * app/api/cron/weekly-divrei/route.ts
 *
 * Cron job — רץ כל שעה.
 * אם יש אירוע יהודי בעוד 29-31 שעות:
 *   1. שולף דבר תורה מתאים מ-Sanity
 *   2. יוצר/מאחזר תמונת אירוע (Gemini, cached)
 *   3. בונה הודעת WhatsApp
 *   4. שולח לרב דרך CallMeBot
 *   5. אם אין דבר תורה — שולח התראה
 *
 * Query params לבדיקה:
 *   ?dry=true             — לא שולח, רק מחזיר JSON
 *   ?date=2026-05-22      — סימולציה של תאריך אחר
 *
 * Auth: header `authorization: Bearer ${CRON_SECRET}`
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@sanity/client";
import { getEventInWindow } from "@/lib/hebcal";
import { findBestDivarTora, markAsSent, ensureShortId } from "@/lib/divrei-matcher";
import { generateEventImage } from "@/lib/gemini-image";
import { buildWhatsAppMessage, buildAlertMessage } from "@/lib/message-builder";
import { sendDivarToraMessage, sendWhatsAppText } from "@/lib/whatsapp-sender";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // יצירת תמונה יכולה לקחת זמן

const WINDOW_MIN = 29;
const WINDOW_MAX = 31;

export async function GET(req: NextRequest) {
  // Auth: cron מ-Vercel שולח אוטומטית את הheader
  const secret = req.headers.get("authorization")?.replace("Bearer ", "");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dryRun = req.nextUrl.searchParams.get("dry") === "true";
  const dateParam = req.nextUrl.searchParams.get("date");
  const now = dateParam ? new Date(dateParam) : new Date();

  const sanity = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
    token: process.env.SANITY_API_TOKEN,
    apiVersion: "2024-01-01",
    useCdn: false,
  });

  try {
    // 1. בדיקה אם יש אירוע בחלון 29-31 שעות
    const event = getEventInWindow(now, WINDOW_MIN, WINDOW_MAX);

    if (!event) {
      return NextResponse.json({
        status: "no-event",
        message: `No event in window ${WINDOW_MIN}-${WINDOW_MAX}h from ${now.toISOString()}`,
        now: now.toISOString(),
      });
    }

    // 2. חיפוש דבר תורה מתאים
    const divar = await findBestDivarTora(sanity, {
      group: event.group,
      searchHints: event.searchHints,
    });

    // 3. אם אין — שליחת התראה
    if (!divar) {
      const alertText = buildAlertMessage(event.nameHebrew, event.hebrewDate);
      if (dryRun) {
        return NextResponse.json({
          status: "alert",
          dryRun: true,
          event,
          alertText,
        });
      }
      await sendWhatsAppText(alertText);
      return NextResponse.json({
        status: "alert-sent",
        event: event.nameHebrew,
      });
    }

    // 4. ייצור shortId אם אין
    const shortId = divar.shortId || (await ensureShortId(sanity, divar._id));

    // 5. ייצור/אחזור תמונה
    let imageUrl: string | undefined;
    let imageError: string | undefined;
    try {
      const img = await generateEventImage({
        eventName: event.nameHebrew,
        eventKey: event.eventKey,
        group: event.group,
        hebrewYear: event.hebrewYear,
        sanity,
      });
      imageUrl = img.url;
    } catch (e) {
      imageError = e instanceof Error ? e.message : String(e);
    }

    // 6. בניית טקסט
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://website-seven-kappa-25.vercel.app";
    const shortLinkUrl = `${siteUrl}/d/${shortId}`;
    const newsletterUrl = process.env.NEWSLETTER_URL || `${siteUrl}/#newsletter`;

    const text = buildWhatsAppMessage({
      title: divar.title,
      teaser: divar.teaser,
      shortLinkUrl,
      newsletterUrl,
      greetingContext: {
        group: event.group,
        eventKey: event.eventKey,
        eventName: event.nameHebrew,
      },
    });

    // 7. dry-run
    if (dryRun) {
      return NextResponse.json({
        status: "dry-run",
        event,
        divar: { id: divar._id, title: divar.title, shortId },
        imageUrl,
        imageError,
        text,
      });
    }

    // 8. שליחה
    const sendResult = await sendDivarToraMessage(text, imageUrl);

    // 9. עדכון lastSentAt
    await markAsSent(sanity, divar._id);

    return NextResponse.json({
      status: "sent",
      event: event.nameHebrew,
      divarTitle: divar.title,
      shortId,
      imageUrl,
      sendResult,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
