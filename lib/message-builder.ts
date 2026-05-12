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

export interface MultiMessageInput {
  items: DivarItem[];
  newsletterUrl: string;
  greetingContext: GreetingContext;
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
  const { items, newsletterUrl, greetingContext } = input;
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

  return [
    itemsText,
    "",
    `📬 להצטרפות לניוזלטר:`,
    newsletterUrl,
    "",
    greeting,
    `*הרב רועי אמגר*`,
  ].join("\n");
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
