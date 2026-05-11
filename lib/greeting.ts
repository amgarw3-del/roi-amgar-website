/**
 * lib/greeting.ts
 *
 * ברכות דינמיות לפי סוג האירוע — לחתימת הודעות וואטסאפ.
 */

import type { EventGroup } from "./image-prompts";

export interface GreetingContext {
  group: EventGroup;
  eventKey?: string;
  eventName?: string;
}

/**
 * מחזיר את הברכה המתאימה לסוף ההודעה.
 */
export function getGreeting(ctx: GreetingContext): string {
  const { group, eventKey, eventName } = ctx;
  const key = (eventKey || eventName || "").toLowerCase();

  // === ברכות ספציפיות ===
  if (key.includes("rosh-hashanah") || key.includes("ראש השנה") || key.includes("ר״ה"))
    return "שנה טובה ומבורכת";
  if (key.includes("yom-kippur") || key.includes("יום כיפור") || key.includes("יוה״כ"))
    return "גמר חתימה טובה";
  if (key.includes("pesach") || key.includes("פסח")) return "חג פסח שמח וכשר";
  if (key.includes("sukkot") || key.includes("סוכות")) return "חג סוכות שמח";
  if (key.includes("shavuot") || key.includes("שבועות")) return "חג שבועות שמח";
  if (key.includes("hanukkah") || key.includes("חנוכה")) return "חנוכה שמח ומואר";
  if (key.includes("purim") || key.includes("פורים")) return "פורים שמח";
  if (key.includes("yom-haatzmaut") || key.includes("עצמאות"))
    return "יום עצמאות שמח";
  if (key.includes("yom-yerushalayim") || key.includes("ירושלים"))
    return "יום ירושלים שמח";
  if (key.includes("lag-baomer") || key.includes("ל\"ג בעומר") || key.includes("לג בעומר"))
    return "ל\"ג בעומר שמח";
  if (key.includes("tu-bishvat") || key.includes("ט\"ו בשבט"))
    return "ט\"ו בשבט שמח";
  if (key.includes("tu-bav") || key.includes("ט\"ו באב")) return "ט\"ו באב שמח";

  // === ברכות לפי group ===
  switch (group) {
    case "parasha":
      return "שבת שלום ומבורך";
    case "moed":
      return "חג שמח";
    case "fast":
      return "צום מועיל";
    case "national":
      return "יום משמעותי";
    case "general":
    default:
      return "בברכה";
  }
}
