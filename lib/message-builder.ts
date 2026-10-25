/**
 * lib/message-builder.ts
 *
 * בניית הטקסט המסוגנן של הודעת WhatsApp.
 * תומך בדבר תורה בודד או כמה דברי תורה במקביל.
 */

import { getGreeting, type GreetingContext } from "./greeting";

export interface DivarItem {
  title: string;
  teaser: string;
  shortLinkUrl: string;
}

export interface MessageInput {
  title: string;
  teaser: string;
  shortLinkUrl: string;
  newsletterUrl: string;
  greetingContext: GreetingContext;
}

export interface EventLink {
  label: string;
  url: string;
}

export interface MultiMessageInput {
  items: DivarItem[];
  newsletterUrl: string;
  greetingContext: GreetingContext;
  /** קישור משאב ספציפי לאירוע (למשל חוברת הלכות) — מופיע לפני הניוזלטר */
  eventLink?: EventLink | null;
}

/**
 * קישורי משאב קבועים לפי eventKey — דפי הנחיות/חוברות חג.
 * נכללים אוטומטית בהודעת הוואטסאפ של האירוע (כל שנה מחדש).
 */
const EVENT_RESOURCE_LINKS: Record<string, EventLink> = {
  "rosh-hashanah": {
    label: "📖 חוברת הלכות ראש השנה:",
    url: "https://rosh-hashana-torah-lachaim.vercel.app",
  },
};

/** מחזיר את קישור המשאב לאירוע (אם קיים). */
export function getEventLink(eventKey: string): EventLink | null {
  return EVENT_RESOURCE_LINKS[eventKey] ?? null;
}

/**
 * הודעת וואטסאפ לדבר תורה בודד.
 */
export function buildWhatsAppMessage(input: MessageInput): string {
  return buildWhatsAppMultiMessage({
    items: [{ title: input.title, teaser: input.teaser, shortLinkUrl: input.shortLinkUrl }],
    newsletterUrl: input.newsletterUrl,
    greetingContext: input.greetingContext,
  });
}

/**
 * הודעת וואטסאפ לכמה דברי תורה.
 * אם יש אחד בלבד — אותו פורמט ישן.
 * אם יש כמה — כל אחד עם הפרדת ─────.
 */
export function buildWhatsAppMultiMessage(input: MultiMessageInput): string {
  const { items, newsletterUrl, greetingContext, eventLink } = input;
  const greeting = getGreeting(greetingContext);

  if (items.length === 0) return "";

  const separator = "─────────────────";

  const itemsText = items
    .map((item) =>
      [
        `*${item.title}*`,
        "",
        item.teaser.trim(),
        "",
        `🔗 לקריאה מלאה:`,
        item.shortLinkUrl,
      ].join("\n")
    )
    .join(`\n\n${separator}\n\n`);

  const lines = [itemsText, ""];

  // קישור משאב לאירוע (חוברת הלכות וכו') — לפני הניוזלטר
  if (eventLink) {
    lines.push(eventLink.label, eventLink.url, "");
  }

  lines.push(
    `📬 להצטרפות לניוזלטר:`,
    newsletterUrl,
    "",
    greeting,
    `*הרב רועי אמגר*`
  );

  return lines.join("\n");
}

/**
 * הודעת התראה לרב כשאין דבר תורה לאירוע
 */
export function buildAlertMessage(eventName: string, hebrewDate: string): string {
  return [
    `⚠️ *התראת מערכת*`,
    "",
    `בעוד 30 שעות מתקיים: *${eventName}* (${hebrewDate})`,
    "",
    `אך לא נמצא דבר תורה מתאים במאגר האתר.`,
    "",
    `מומלץ להעלות דבר תורה רלוונטי לפני כן.`,
    "",
    `הרב רועי אמגר`,
  ].join("\n");
}
