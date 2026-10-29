/**
 * app/api/cron/weekly-divrei/route.ts
 *
 * Cron job — רץ כל שעה דרך GitHub Actions (חינמי).
 * אם יש אירוע יהודי בעוד 42-54 שעות (או 14-42 — חלון מאוחר לתוכן שפורסם באיחור):
 *   1. שולף את כל דברי התורה המתאימים מ-Sanity
 *   2. יוצר/מאחזר תמונת אירוע (Pollinations.ai, cached)
 *   3. בונה הודעת WhatsApp (כל דברי התורה בהודעה אחת)
 *   4. שולח גם למייל (Gmail) וגם לוואטסאפ (Green API)
 *   5. אם אין דבר תורה — שולח התראה
 *
 * Query params לבדיקה:
 *   ?dry=true             — לא שולח, רק מחזיר JSON
 *   ?date=2026-05-22      — סימולציה של תאריך אחר
 *   ?channels=email       — לשלוח רק למייל
 *   ?channels=whatsapp    — לשלוח רק לוואטסאפ
 *
 * Auth: header `authorization: Bearer ${CRON_SECRET}`
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@sanity/client";
import { getEventInWindow } from "@/lib/hebcal";
import { findAllDivreiTora, filterUnsent, markAsSent, ensureShortId } from "@/lib/divrei-matcher";
import { generateEventImage } from "@/lib/gemini-image";
import { buildWhatsAppMultiMessage, buildAlertMessage, getEventLink } from "@/lib/message-builder";
import { getGreeting } from "@/lib/greeting";
import { sendDivarToraMessage, sendWhatsAppText } from "@/lib/whatsapp-sender";
import { sendGreenDivarTora, sendGreenText } from "@/lib/whatsapp-green-api";
import { sendWeeklyDvarEmail, sendMissingDvarAlert } from "@/lib/send-email";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// חלון שליחה: ~48 שעות לפני האירוע, רחב מספיק לפיגורי GitHub Actions (3-4h בין ריצות)
// lastSentAt מבטיח שליחה חד-פעמית בלבד
const WINDOW_MIN = 42;
const WINDOW_MAX = 54;
// חלון מאוחר: דבר תורה שפורסם אחרי החלון הראשי עדיין נשלח, עד ~14 שעות לפני
// (האירוע מחושב מחצות UTC של היום עצמו → 14h = שישי/ערב חג בצהריים, לפני הדלקת נרות).
// בחלון הזה לא שולחים התראת "חסר תוכן" — רק דברי תורה חדשים שטרם נשלחו.
const LATE_WINDOW_MIN = 14;

type Channel = "email" | "whatsapp";

export async function GET(req: NextRequest) {
  const secret = req.headers.get("authorization")?.replace("Bearer ", "");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dryRun = req.nextUrl.searchParams.get("dry") === "true";
  const dateParam = req.nextUrl.searchParams.get("date");
  const channelsParam = req.nextUrl.searchParams.get("channels");
  // resend=true — שליחה ידנית שמתעלמת מהדדופ (שולח גם דברי תורה שכבר נשלחו)
  const resend = req.nextUrl.searchParams.get("resend") === "true";
  const now = dateParam ? new Date(dateParam) : new Date();

  const channels: Channel[] =
    channelsParam === "email"
      ? ["email"]
      : channelsParam === "whatsapp"
      ? ["whatsapp"]
      : ["email", "whatsapp"];

  const sanity = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
    token: process.env.SANITY_API_TOKEN,
    apiVersion: "2024-01-01",
    useCdn: false,
  });

  try {
    let event = getEventInWindow(now, WINDOW_MIN, WINDOW_MAX);
    let late = false;
    if (!event) {
      event = getEventInWindow(now, LATE_WINDOW_MIN, WINDOW_MIN);
      late = event !== null;
    }

    if (!event) {
      return NextResponse.json({
        status: "no-event",
        message: `No event in window ${LATE_WINDOW_MIN}-${WINDOW_MAX}h from ${now.toISOString()}`,
        now: now.toISOString(),
      });
    }

    // שולף את *כל* דברי התורה המתאימים (כולל כאלה שכבר נשלחו)
    const allMatching = await findAllDivreiTora(sanity, {
      group: event.group,
      searchHints: event.searchHints,
    });

    // מסנן לאלה שעוד לא נשלחו (resend=true → כולם, לשליחה ידנית)
    const divarList = filterUnsent(allMatching, { resend });

    // חלון מאוחר בלי תוכן — ההתראה כבר נשלחה (או תישלח) בחלון הראשי
    if (late && allMatching.length === 0) {
      return NextResponse.json({
        status: "late-no-content",
        event: event.nameHebrew,
        hoursUntil: event.hoursUntil,
      });
    }

    // === אין דבר תורה במאגר כלל — שליחת התראה (פעם אחת) ===
    // חשוב: רק כשאין תוכן באמת. אם יש תוכן שכבר נשלח — לא שולחים התראת שווא.
    if (allMatching.length === 0) {
      const alertText = buildAlertMessage(event.nameHebrew, event.hebrewDate);

      if (dryRun) {
        return NextResponse.json({
          status: "alert",
          dryRun: true,
          channels,
          event,
          alertText,
        });
      }

      // דדופ התראה: שולחים התראה פעם אחת בלבד לכל אירוע (לפי eventKey + תאריך השבת/חג).
      // הקרון רץ כל שעה, אבל ההתראה לא תחזור על עצמה.
      const alertLogId = `cronAlert-${event.eventKey}-${event.gregorianDate
        .toISOString()
        .slice(0, 10)}`.replace(/[^a-zA-Z0-9_-]/g, "-");

      const alreadyAlerted = await sanity.fetch<string | null>(
        `*[_id == $id][0]._id`,
        { id: alertLogId }
      );

      if (alreadyAlerted) {
        return NextResponse.json({
          status: "alert-skipped",
          reason: "כבר נשלחה התראה לאירוע זה",
          event: event.nameHebrew,
        });
      }

      const results: Record<string, unknown> = {};

      if (channels.includes("email")) {
        try {
          await sendMissingDvarAlert(event.nameHebrew, event.hebrewDate);
          results.email = "sent";
        } catch (e) {
          results.email = `error: ${e instanceof Error ? e.message : String(e)}`;
        }
      }

      if (channels.includes("whatsapp")) {
        let sent = false;
        if (process.env.GREEN_API_ID_INSTANCE && process.env.GREEN_API_TOKEN) {
          try {
            const r = await sendGreenText(alertText);
            if (r.ok) {
              results.whatsapp = "sent (green-api)";
              sent = true;
            } else {
              results.whatsapp_green = `failed (${r.status}): ${r.body.slice(0, 200)}`;
            }
          } catch (e) {
            results.whatsapp_green = `error: ${e instanceof Error ? e.message : String(e)}`;
          }
        }
        if (!sent && process.env.CALLMEBOT_API_KEY) {
          try {
            const r = await sendWhatsAppText(alertText);
            results.whatsapp = r.ok ? "sent (callmebot)" : `failed (${r.status}): ${r.body.slice(0, 200)}`;
          } catch (e) {
            results.whatsapp = `error: ${e instanceof Error ? e.message : String(e)}`;
          }
        } else if (!sent && !results.whatsapp) {
          results.whatsapp = "skipped (no provider configured)";
        }
      }

      // רישום שההתראה נשלחה — רק אם לפחות ערוץ אחד הצליח, כדי שכשל זמני ינסה שוב בשעה הבאה
      const alertSucceeded =
        results.email === "sent" ||
        (typeof results.whatsapp === "string" && results.whatsapp.startsWith("sent"));

      if (alertSucceeded) {
        await sanity.createIfNotExists({
          _id: alertLogId,
          _type: "cronAlertLog",
          eventKey: event.eventKey,
          eventName: event.nameHebrew,
          sentAt: new Date().toISOString(),
        });
      }

      return NextResponse.json({ status: "alert-sent", event: event.nameHebrew, results });
    }

    // === יש תוכן במאגר אבל הכל כבר נשלח — לא עושים כלום (לא התראה, לא שליחה כפולה) ===
    if (divarList.length === 0) {
      return NextResponse.json({
        status: "already-sent",
        message: "כל דברי התורה לאירוע זה כבר נשלחו",
        event: event.nameHebrew,
        matchingCount: allMatching.length,
      });
    }

    // === יש דברי תורה לשליחה ===
    // וודא shortId לכל אחד
    const divarListWithShortId = await Promise.all(
      divarList.map(async (d) => ({
        ...d,
        shortId: d.shortId || (await ensureShortId(sanity, d._id)),
      }))
    );

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.haravroiamgar.com";
    const newsletterUrl = process.env.NEWSLETTER_URL || `${siteUrl}/#newsletter`;

    const greetingContext = {
      group: event.group,
      eventKey: event.eventKey,
      eventName: event.nameHebrew,
    };

    // בניית רשימת הפריטים לכל דברי התורה
    const items = divarListWithShortId.map((d) => ({
      title: d.title,
      teaser: d.teaser,
      shortLinkUrl: `${siteUrl}/d/${d.shortId}`,
    }));

    const whatsappText = buildWhatsAppMultiMessage({
      items,
      newsletterUrl,
      greetingContext,
      eventLink: getEventLink(event.eventKey),
    });

    const greeting = getGreeting(greetingContext);

    // תמונה — מבוססת על האירוע (לא על דבר תורה ספציפי)
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

    if (dryRun) {
      return NextResponse.json({
        status: "dry-run",
        late,
        channels,
        event,
        divarCount: divarListWithShortId.length,
        divrei: divarListWithShortId.map((d) => ({ id: d._id, title: d.title, shortId: d.shortId })),
        imageUrl,
        imageError,
        whatsappText,
        emailPreview: {
          subject: `📜 ${divarListWithShortId.length} דברי תורה ל-${event.nameHebrew} (${event.hebrewDate}) — מוכנים להפצה`,
          to: process.env.NOTIFICATION_EMAIL || process.env.GMAIL_USER,
        },
      });
    }

    // === שליחה בפועל ===
    const results: Record<string, unknown> = {};

    // Email
    if (channels.includes("email")) {
      try {
        // שולח את הדבר תורה הראשון ברשימה (החשוב ביותר) למייל,
        // עם כל הקישורים של שאר דברי התורה בגוף
        await sendWeeklyDvarEmail({
          title: divarListWithShortId.length === 1
            ? divarListWithShortId[0].title
            : `${divarListWithShortId.length} דברי תורה ל${event.nameHebrew}`,
          teaser: divarListWithShortId[0].teaser,
          shortLinkUrl: items[0].shortLinkUrl,
          imageUrl,
          newsletterUrl,
          greeting,
          eventName: event.nameHebrew,
          hebrewDate: event.hebrewDate,
          whatsappTextForCopy: whatsappText,
        });
        results.email = "sent";
      } catch (e) {
        results.email = `error: ${e instanceof Error ? e.message : String(e)}`;
      }
    }

    // WhatsApp
    if (channels.includes("whatsapp")) {
      let sent = false;

      if (process.env.GREEN_API_ID_INSTANCE && process.env.GREEN_API_TOKEN) {
        try {
          const r = await sendGreenDivarTora(whatsappText, imageUrl);
          const imgOk = r.image?.ok;
          const txtOk = r.text?.ok;
          if (imgOk || txtOk) {
            results.whatsapp = {
              provider: "green-api",
              image: imgOk ? "sent" : r.image ? `failed (${r.image.status})` : "skipped",
              text: txtOk ? "sent" : r.text ? `failed (${r.text.status})` : "skipped",
            };
            sent = true;
          } else {
            results.whatsapp_green = {
              image: r.image ? `failed (${r.image.status}): ${r.image.body.slice(0, 150)}` : "skipped",
              text: r.text ? `failed (${r.text.status}): ${r.text.body.slice(0, 150)}` : "skipped",
            };
          }
        } catch (e) {
          results.whatsapp_green = `error: ${e instanceof Error ? e.message : String(e)}`;
        }
      }

      if (!sent && process.env.CALLMEBOT_API_KEY) {
        try {
          const r = await sendDivarToraMessage(whatsappText, imageUrl);
          const imgOk = r.image?.ok;
          const txtOk = r.text?.ok;
          results.whatsapp = {
            provider: "callmebot",
            image: imgOk ? "sent" : r.image ? `failed (${r.image.status})` : "skipped",
            text: txtOk ? "sent" : r.text ? `failed (${r.text.status})` : "skipped",
          };
        } catch (e) {
          results.whatsapp = `error: ${e instanceof Error ? e.message : String(e)}`;
        }
      } else if (!sent && !results.whatsapp) {
        results.whatsapp = "skipped (no provider configured)";
      }
    }

    // עדכון lastSentAt לכל דברי התורה ששוגרו
    const anySuccess =
      results.email === "sent" ||
      (typeof results.whatsapp === "object" &&
        results.whatsapp !== null &&
        ((results.whatsapp as any).image === "sent" || (results.whatsapp as any).text === "sent"));

    if (anySuccess) {
      await Promise.all(divarListWithShortId.map((d) => markAsSent(sanity, d._id)));
    }

    return NextResponse.json({
      status: late ? "sent-late" : "sent",
      event: event.nameHebrew,
      divarCount: divarListWithShortId.length,
      divrei: divarListWithShortId.map((d) => ({ title: d.title, shortId: d.shortId })),
      imageUrl,
      imageError,
      results,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
