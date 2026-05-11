/**
 * lib/message-builder.ts
 *
 * בניית הטקסט המסוגנן של הודעת WhatsApp.
 */

import { getGreeting, type GreetingContext } from "./greeting";

export interface MessageInput {
  title: string;
  teaser: string;
  shortLinkUrl: string;
  newsletterUrl: string;
  greetingContext: GreetingContext;
}

/**
 * מבנה ההודעה (וואטסאפ תומך ב-*bold* ו-_italic_):
 *
 * *[כותרת]*
 *
 * [טיזר]
 *
 * 🔗 לקריאה מלאה:
 * [קישור קצר]
 *
 * 📬 להצטרפות לניוזלטר:
 * [קישור ניוזלטר]
 *
 * [ברכה דינמית]
 * *הרב רועי אמגר*
 */
export function buildWhatsAppMessage(input: MessageInput): string {
  const { title, teaser, shortLinkUrl, newsletterUrl, greetingContext } = input;
  const greeting = getGreeting(greetingContext);

  const lines = [
    `*${title}*`,
    "",
    teaser.trim(),
    "",
    `🔗 לקריאה מלאה:`,
    shortLinkUrl,
    "",
    `📬 להצטרפות לניוזלטר:`,
    newsletterUrl,
    "",
    greeting,
    `*הרב רועי אמגר*`,
  ];

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
