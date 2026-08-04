/**
 * lib/hebcal.ts
 *
 * זיהוי האירוע היהודי הקרוב (שבת, מועד, צום, מועד לאומי)
 * דורש: @hebcal/core (להתקנה: npm install @hebcal/core)
 */

import { HebrewCalendar, HDate, Event, flags, Location } from "@hebcal/core";
import type { EventGroup } from "./image-prompts";

export interface NextEvent {
  /** שם בעברית להצגה ובתמונה */
  nameHebrew: string;
  /** מזהה ל-cache ולמיפוי prompt */
  eventKey: string;
  /** קבוצה ל-subTopic matching */
  group: EventGroup;
  /** תאריך לועזי של תחילת האירוע */
  gregorianDate: Date;
  /** תאריך עברי */
  hebrewDate: string;
  /** שנה עברית (לצורך cache) */
  hebrewYear: string;
  /** מילות חיפוש נוספות לדבר תורה */
  searchHints: string[];
  /** שעות עד האירוע */
  hoursUntil: number;
}

/** האם זו שבת רגילה (לא מועד) */
function isShabbat(date: Date): boolean {
  return date.getDay() === 6;
}

/** מסיר ניקוד עברי ממחרוזת (שורקים, דגשים, חולמים וכו') */
function stripNikud(s: string): string {
  // U+0591-U+05C7: כל סימני הניקוד וטעמי המקרא בעברית
  return s.replace(/[֑-ׇ]/g, '').trim();
}

/** מציאת השבת הבאה */
function nextShabbat(from: Date): Date {
  const d = new Date(from);
  const daysUntilSat = (6 - d.getDay() + 7) % 7 || 7;
  d.setDate(d.getDate() + daysUntilSat);
  d.setHours(18, 0, 0, 0); // ~כניסת שבת
  return d;
}

/** מילון מועדים → group + key */
function classifyEvent(ev: Event): { group: EventGroup; eventKey: string; nameHebrew: string } | null {
  const desc = ev.getDesc();
  const f = ev.getFlags();

  // CHAG = חגי תורה
  if (f & flags.CHAG) {
    if (desc.includes("Pesach")) return { group: "moed", eventKey: "pesach", nameHebrew: "פסח" };
    if (desc.includes("Shavuot")) return { group: "moed", eventKey: "shavuot", nameHebrew: "שבועות" };
    if (desc.includes("Sukkot")) return { group: "moed", eventKey: "sukkot", nameHebrew: "סוכות" };
    if (desc.includes("Shmini Atzeret")) return { group: "moed", eventKey: "shmini-atzeret", nameHebrew: "שמיני עצרת" };
    if (desc.includes("Simchat Torah")) return { group: "moed", eventKey: "simchat-torah", nameHebrew: "שמחת תורה" };
    if (desc.includes("Rosh Hashana")) return { group: "moed", eventKey: "rosh-hashanah", nameHebrew: "ראש השנה" };
    if (desc.includes("Yom Kippur")) return { group: "moed", eventKey: "yom-kippur", nameHebrew: "יום כיפור" };
  }

  // MINOR_HOLIDAY = חנוכה, פורים, ט"ו בשבט, ל"ג בעומר וכו'
  if (f & flags.MINOR_HOLIDAY || f & flags.MODERN_HOLIDAY) {
    if (desc.includes("Chanukah")) return { group: "moed", eventKey: "hanukkah", nameHebrew: "חנוכה" };
    if (desc.includes("Purim")) return { group: "moed", eventKey: "purim", nameHebrew: "פורים" };
    if (desc.includes("Tu BiShvat") || desc.includes("Tu B'Shvat")) return { group: "moed", eventKey: "tu-bishvat", nameHebrew: "ט\"ו בשבט" };
    if (desc.includes("Tu B'Av") || desc.includes("Tu BeAv")) return { group: "moed", eventKey: "tu-bav", nameHebrew: "ט\"ו באב" };
    if (desc.includes("Lag BaOmer") || desc.includes("Lag B'Omer")) return { group: "moed", eventKey: "lag-baomer", nameHebrew: "ל\"ג בעומר" };
    if (desc.includes("Yom HaAtzma'ut") || desc.includes("Yom HaAtzmaut")) return { group: "national", eventKey: "yom-haatzmaut", nameHebrew: "יום העצמאות" };
    if (desc.includes("Yom HaZikaron")) return { group: "national", eventKey: "yom-hazikaron", nameHebrew: "יום הזיכרון" };
    if (desc.includes("Yom Yerushalayim")) return { group: "national", eventKey: "yom-yerushalayim", nameHebrew: "יום ירושלים" };
    if (desc.includes("Yom HaShoah")) return { group: "national", eventKey: "yom-hashoah", nameHebrew: "יום השואה" };
  }

  // FAST = צומות
  if (f & flags.MAJOR_FAST || f & flags.MINOR_FAST) {
    if (desc.includes("Tish'a B'Av") || desc.includes("Tisha B'Av")) return { group: "fast", eventKey: "tisha-bav", nameHebrew: "תשעה באב" };
    if (desc.includes("Tzom Gedaliah")) return { group: "fast", eventKey: "fast-gedaliah", nameHebrew: "צום גדליה" };
    if (desc.includes("Asara B'Tevet") || desc.includes("Asara BeTevet")) return { group: "fast", eventKey: "10-tevet", nameHebrew: "עשרה בטבת" };
    if (desc.includes("Ta'anit Esther") || desc.includes("Taanit Esther")) return { group: "fast", eventKey: "esther-fast", nameHebrew: "תענית אסתר" };
    if (desc.includes("Shiva Asar B'Tammuz") || desc.includes("17th of Tammuz")) return { group: "fast", eventKey: "17-tammuz", nameHebrew: "שבעה עשר בתמוז" };
  }

  // ROSH_CHODESH
  if (f & flags.ROSH_CHODESH) {
    return { group: "moed", eventKey: "rosh-chodesh", nameHebrew: "ראש חודש" };
  }

  return null;
}

/**
 * החזרת האירוע המשמעותי הבא בטווח שעות מ-now.
 * מטרה: לזהות אירוע שב-29-31 שעות מעכשיו (חלון cron).
 */
export function getEventInWindow(now: Date, windowHoursMin: number, windowHoursMax: number): NextEvent | null {
  const windowStart = new Date(now.getTime() + windowHoursMin * 3600 * 1000);
  const windowEnd = new Date(now.getTime() + windowHoursMax * 3600 * 1000);

  const start = new HDate(windowStart);
  const end = new HDate(windowEnd);

  const events = HebrewCalendar.calendar({
    start,
    end,
    location: Location.lookup("Jerusalem"),
    il: true, // לוח ארץ ישראל
    sedrot: true, // כולל פרשות
    candlelighting: false,
    omer: false,
    noMinorFast: false,
    noModern: false,
    noRoshChodesh: true, // לא נשלח על כל ר"ח (יותר מדי)
  });

  // נחפש אירוע בחלון
  for (const ev of events) {
    const evDate = ev.getDate().greg();
    if (evDate < windowStart || evDate > windowEnd) continue;

    const f = ev.getFlags();

    // פרשת השבוע — נשלח רק לפי סוף שבוע (חמישי-שישי)
    if (f & flags.PARSHA_HASHAVUA) {
      const dow = evDate.getDay();
      // פרשה רשומה בשבת, נשלח 30 שעות לפני => חמישי בערב/שישי בבוקר
      if (dow === 6) {
        const hoursUntil = (evDate.getTime() - now.getTime()) / 3600000;
        if (hoursUntil >= windowHoursMin && hoursUntil <= windowHoursMax) {
          const hdate = ev.getDate();
          const rawName = ev.render("he"); // "פָּרָשַׁת בְּמִדְבַּר" (עם ניקוד)
          const cleanFull = stripNikud(rawName); // "פרשת במדבר"
          const cleanShort = cleanFull.replace(/^פרשת\s+/, ""); // "במדבר"

          // וריאנטים לפרשות מורכבות (כמו "שלח לך", "לך לך", "חיי שרה"):
          // המקף העברי ־ (U+05BE) מוסר ע"י stripNikud ← מקבלים "שלחלך" במקום "שלח לך"
          // לכן מחליפים אותו ברווח/מקף רגיל לפני הסרת הניקוד
          const rawSpaced = rawName.replace(/־/g, " ");
          const cleanShortSpaced = stripNikud(rawSpaced).replace(/^פרשת\s+/, "").trim(); // "שלח לך"
          const cleanShortHyphen = cleanShortSpaced.replace(/\s+/g, "-"); // "שלח-לך"

          // כל הווריאנטים — מבטיחים match בכל צורת תיוג ב-Sanity
          const hintList = [
            cleanShort,                        // "שלחלך" (legacy)
            cleanShortSpaced,                  // "שלח לך"
            cleanShortHyphen,                  // "שלח-לך"
            cleanFull,                         // "פרשת שלחלך"
            `פרשת ${cleanShortSpaced}`,        // "פרשת שלח לך"
            `פרשת ${cleanShortHyphen}`,        // "פרשת שלח-לך"
            rawName,                           // עם ניקוד (מקף עברי)
          ];

          // פרשות מחוברות (כפולות): hebcal מציין ב-ev.parsha מערך של 2 שמות
          // (["Matot","Masei"]). הרב מתייג לרוב בפרשה בודדת ("מטות") ולא במאוחד.
          // מפצלים על המקף העברי (־) ומוסיפים כל רכיב כ-hint נפרד.
          // פיצול על המקף (ולא רווח) שומר על שם דו-מילי כמו "אחרי מות" שלם.
          const parshaComponents = (ev as unknown as { parsha?: string[] }).parsha;
          const isCombined = Array.isArray(parshaComponents) && parshaComponents.length >= 2;
          if (isCombined) {
            const components = rawName
              .split("־")
              .map((p) => stripNikud(p).replace(/^פרשת\s+/, "").trim())
              .filter(Boolean); // ["מטות", "מסעי"]
            for (const comp of components) {
              hintList.push(comp, `פרשת ${comp}`);
            }
          }

          const hints = Array.from(new Set(hintList));

          return {
            nameHebrew: `פרשת ${cleanShortSpaced}`, // "פרשת שלח לך" — להצגה נכונה
            eventKey: `parasha-${cleanShortHyphen}`,
            group: "parasha",
            gregorianDate: evDate,
            hebrewDate: stripNikud(hdate.renderGematriya()),
            hebrewYear: new HDate(now).getFullYear().toString(),
            searchHints: hints,
            hoursUntil,
          };
        }
      }
      continue;
    }

    const classified = classifyEvent(ev);
    if (!classified) continue;

    const hoursUntil = (evDate.getTime() - now.getTime()) / 3600000;
    if (hoursUntil < windowHoursMin || hoursUntil > windowHoursMax) continue;

    const hdate = ev.getDate();
    return {
      nameHebrew: classified.nameHebrew,
      eventKey: classified.eventKey,
      group: classified.group,
      gregorianDate: evDate,
      hebrewDate: hdate.renderGematriya(),
      hebrewYear: new HDate(now).getFullYear().toString(),
      searchHints: [classified.nameHebrew, classified.eventKey],
      hoursUntil,
    };
  }

  return null;
}

/**
 * Helper: מחזיר את האירוע הבא מ-now (לא מוגבל בחלון) — לדשבורד.
 */
export function getNextEvent(from: Date, daysAhead: number = 30): NextEvent | null {
  return getEventInWindow(from, 0, daysAhead * 24);
}
