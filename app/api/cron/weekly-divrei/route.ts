/**
 * app/api/cron/weekly-divrei/route.ts
 *
 * Cron job — רץ כל שעה דרך GitHub Actions (חינמי).
 * אם יש אירוע יהודי בעוד 29-31 שעות:
 *   1. שולף דבר תורה מתאים מ-Sanity
 *   2. יוצר/מאחזר תמונת אירוע (Gemini, cached)
 *   3. בונה הודעת WhatsApp
 *   4. שולח גם למייל (Gmail — אמין) וגם לוואטסאפ (CallMeBot — best-effort)
 *   5. אם אין דבר תורה — שולח התראה לשני הערוצים
 *
 * Query params לבדיקה:
 *   ?dry=true             — לא שולח, רק מחזיר JSON
 *   ?date=2026-05-22      — סימולציה של תאריך אחר
 *   ?channels=email       — לשלוח רק למייל (default: שניהם)
 *   ?channels=whatsapp    — לשלוח רק לוואטסאפ
 *
 * Auth: header `authorization: Bearer ${CRON_SECRET}`
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@sanity/client";
import { getEventInWindow } from "@/lib/hebcal";
import { findBestDivarTora, markAsSent, ensureShortId } from "@/lib/divrei-matcher";
import { generateEventImage } from "@/lib/gemini-image";
import { buildWhatsAppMessage, buildAlertMessage } from "@/lib/message-builder";
import { getGreeting } from "@/lib/greeting";
import { sendDivarToraMessage, sendWhatsAppText } from "@/lib/whatsapp-sender";
import { sendGreenDivarTora, sendGreenText } from "@/lib/whatsapp-green-api";
import { sendWeeklyDvarEmail, sendMissingDvarAlert } from "@/lib/send-email";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const WINDOW_MIN = 29;
const WINDOW_MAX = 31;

type Channel = "email" | "whatsapp";

export async function GET(req: NextRequest) {
  const secret = req.headers.get("authorization")?.replace("Bearer ", "");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dryRun = req.nextUrl.searchParams.get("dry") === "true";
  const dateParam = req.nextUrl.searchParams.get("date");
  const channelsParam = req.nextUrl.searchParams.get("channels");
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
    const event = getEventInWindow(now, WINDOW_MIN, WINDOW_MAX);

    if (!event) {
      return NextResponse.json({
        status: "no-event",
        message: `No event in window ${WINDOW_MIN}-${WINDOW_MAX}h from ${now.toISOString()}`,
        now: now.toISOString(),
      });
    }

    const divar = await findBestDivarTora(sanity, {
      group: event.group,
      searchHints: event.searchHints,
    });

    // === אין דבר תורה — שליחת התראה לשני הערוצים ===
    if (!divar) {
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
        // ניסיון 1: Green API (היציב)
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
        // ניסיון 2: CallMeBot (fallback)
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

      return NextResponse.json({ status: "alert-sent", event: event.nameHebrew, results });
    }

    // === יש דבר תורה ===
    const shortId = divar.shortId || (await ensureShortId(sanity, divar._id));

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

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://website-seven-kappa-25.vercel.app";
    const shortLinkUrl = `${siteUrl}/d/${shortId}`;
    const newsletterUrl = process.env.NEWSLETTER_URL || `${siteUrl}/#newsletter`;

    const greetingContext = {
      group: event.group,
      eventKey: event.eventKey,
      eventName: event.nameHebrew,
    };

    const whatsappText = buildWhatsAppMessage({
      title: divar.title,
      teaser: divar.teaser,
      shortLinkUrl,
      newsletterUrl,
      greetingContext,
    });

    const greeting = getGreeting(greetingContext);

    if (dryRun) {
      return NextResponse.json({
        status: "dry-run",
        channels,
        event,
        divar: { id: divar._id, title: divar.title, shortId },
        imageUrl,
        imageError,
        whatsappText,
        emailPreview: {
          subject: `📜 דבר תורה ל-${event.nameHebrew} (${event.hebrewDate}) — מוכן להפצה`,
          to: process.env.NOTIFICATION_EMAIL || process.env.GMAIL_USER,
        },
      });
    }

    // === שליחה בפועל לשני הערוצים ===
    const results: Record<string, unknown> = {};

    // Email — אמין, ננסה תמיד אם בערוצים
    if (channels.includes("email")) {
      try {
        await sendWeeklyDvarEmail({
          title: divar.title,
          teaser: divar.teaser,
          shortLinkUrl,
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

    // WhatsApp — ניסיון 1: Green API (יציב), ניסיון 2: CallMeBot (fallback)
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

    // עדכון lastSentAt (רק אם לפחות אחד עבר)
    const anySuccess =
      results.email === "sent" ||
      (typeof results.whatsapp === "object" &&
        results.whatsapp !== null &&
        ((results.whatsapp as any).image === "sent" || (results.whatsapp as any).text === "sent"));

    if (anySuccess) {
      await markAsSent(sanity, divar._id);
    }

    return NextResponse.json({
      status: "sent",
      event: event.nameHebrew,
      divarTitle: divar.title,
      shortId,
      imageUrl,
      imageError,
      results,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
