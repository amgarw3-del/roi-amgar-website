/**
 * retag-by-keywords.ts
 * משייך תת-נושאים לדברי תורה קיימים על בסיס מילות מפתח עבריות (ללא AI)
 * הרצה: npx tsx scripts/retag-by-keywords.ts [--dry-run]
 * משתני סביבה: SANITY_API_TOKEN (וגם NEXT_PUBLIC_SANITY_PROJECT_ID אם שונה מ-bssgoew8)
 */

import { createClient } from "@sanity/client";
import { validateAndBuildRefs } from "../lib/parasha-map";

const DRY_RUN = process.argv.includes("--dry-run");

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "bssgoew8",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2024-01-01",
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
});

// מילות מפתח → slug
const KEYWORD_MAP: Array<{ keywords: string[]; slug: string }> = [
  // מועדים
  { keywords: ["פורים", "מגילה", "אסתר", "המן", "מרדכי", "משלוח מנות", "פורים קטן"], slug: "purim" },
  { keywords: ["פורים שושן", "שושן פורים"], slug: "purim-shushan" },
  { keywords: ["פסח", "חג החרות", "ליל הסדר", "הגדה", "מצה", "חמץ", "יציאת מצרים", "ארבע כוסות", "אפיקומן"], slug: "pesach" },
  { keywords: ["שבועות", "מתן תורה", "חג הביכורים", "רות"], slug: "shavuot" },
  { keywords: ["סוכות", "סוכה", "ארבעת המינים", "לולב", "אתרוג", "הושענות"], slug: "sukkot" },
  { keywords: ["הושענא רבה", "הושענא"], slug: "hoshana-raba" },
  { keywords: ["שמחת תורה", "שמיני עצרת"], slug: "shmini-atzeret" },
  { keywords: ["חנוכה", "נרות חנוכה", "מנורה", "חשמונאים", "מכבים", "נס פך השמן"], slug: "chanuka" },
  { keywords: ["ראש השנה", "יום הדין", "שופר", "תשובה", "זיכרון", "מלכויות", "זכרונות", "שופרות"], slug: "rosh-hashana" },
  { keywords: ["יום כיפור", "יום הכיפורים", "נעילה", "כפרה", "תענית", "וידוי"], slug: "yom-kippur" },
  { keywords: ["ספירת העומר", "ספירה", "עומר"], slug: "sfirat-haomer" },
  { keywords: ["ל\"ג בעומר", "לג בעומר", "רשב\"י", "רבי שמעון בר יוחאי", "מירון", "בונפיר"], slug: "lag-baomer" },
  { keywords: ["ט\"ו בשבט", "טו בשבט", "ראש השנה לאילנות", "עצים", "פירות"], slug: "tu-bishvat" },
  { keywords: ["ט\"ו באב", "טו באב"], slug: "tu-beav" },

  // צומות
  { keywords: ["תשעה באב", "ט' באב", "חורבן", "בית המקדש", "קינות", "איכה"], slug: "tisha-beav" },
  { keywords: ["צום גדליה", "גדליה"], slug: "tzom-gedalia" },
  { keywords: ["תענית אסתר"], slug: "taanit-esther" },
  { keywords: ["שבעה עשר בתמוז", "י\"ז בתמוז", "יז בתמוז"], slug: "shiva-asar-betamuz" },
  { keywords: ["עשרה בטבת", "י' בטבת", "יו בטבת"], slug: "asara-betevet" },

  // מועדים לאומיים
  { keywords: ["יום העצמאות", "עצמאות", "מדינת ישראל"], slug: "yom-haatzmaut" },
  { keywords: ["יום ירושלים", "שחרור ירושלים"], slug: "yom-yerushalayim" },
  { keywords: ["יום הזיכרון", "חללים", "יום הזכרון"], slug: "yom-hazikaron" },
  { keywords: ["יום השואה", "שואה", "זכרון השואה"], slug: "yom-hashoah" },

  // פרשיות — ספר בראשית
  { keywords: ["פרשת בראשית", "בראשית ברא", "גן עדן", "אדם וחוה", "קין והבל"], slug: "bereshit" },
  { keywords: ["פרשת נח", "תיבת נח", "המבול", "קשת בענן"], slug: "noach" },
  { keywords: ["פרשת לך לך", "לך לך", "אברהם אבינו", "ברית המילה", "ברית בין הבתרים"], slug: "lech-lecha" },
  { keywords: ["פרשת וירא", "וירא אליו", "עקידת יצחק", "עקידה", "לוט", "אנשי סדום"], slug: "vayera" },
  { keywords: ["פרשת חיי שרה", "חיי שרה", "שידוך רבקה", "מערת המכפלה"], slug: "chayei-sara" },
  { keywords: ["פרשת תולדות", "תולדות", "יצחק ורבקה", "עשו ויעקב", "הבכורה"], slug: "toldot" },
  { keywords: ["פרשת ויצא", "ויצא יעקב", "לבן", "רחל ולאה", "חלום הסולם"], slug: "vayetze" },
  { keywords: ["פרשת וישלח", "וישלח", "מלאך", "פניאל", "דינה", "שכם"], slug: "vayishlach" },
  { keywords: ["פרשת וישב", "וישב", "יוסף ואחיו", "חלומות יוסף", "פוטיפר", "אשת פוטיפר"], slug: "vayeshev" },
  { keywords: ["פרשת מקץ", "מקץ", "פרעה", "חלום פרעה", "שבע פרות", "שבע שנים"], slug: "miketz" },
  { keywords: ["פרשת ויגש", "ויגש אליו", "יהודה ויוסף", "גלוי יוסף", "התוודע יוסף"], slug: "vayigash" },
  { keywords: ["פרשת ויחי", "ויחי יעקב", "ברכת יעקב", "יב שבטים", "שנים עשר שבטים"], slug: "vayechi" },

  // פרשיות — ספר שמות
  { keywords: ["פרשת שמות", "משה רבנו", "הסנה הבוער", "סנה", "מצרים", "עבדות"], slug: "shemot" },
  { keywords: ["פרשת וארא", "וארא", "עשר מכות", "מכות מצרים", "דם צפרדע"], slug: "vaera" },
  { keywords: ["פרשת בא", "פרשת בא", "מכת בכורות", "ליל שימורים", "קרבן פסח"], slug: "bo" },
  { keywords: ["פרשת בשלח", "בשלח", "קריעת ים סוף", "שירת הים", "מן", "מים ממרה"], slug: "beshalach" },
  { keywords: ["פרשת יתרו", "יתרו", "מתן תורה", "עשרת הדיברות", "הר סיני", "עשרת הדברות"], slug: "yitro" },
  { keywords: ["פרשת משפטים", "משפטים", "עבד עברי", "דיני נזיקין", "שמיטה"], slug: "mishpatim" },
  { keywords: ["פרשת תרומה", "תרומה", "משכן", "ארון הברית", "מנורה", "שולחן לחם הפנים"], slug: "teruma" },
  { keywords: ["פרשת תצווה", "תצווה", "בגדי כהונה", "אפוד", "חושן", "מצנפת"], slug: "tetzave" },
  { keywords: ["פרשת כי תשא", "כי תשא", "עגל הזהב", "לוחות הברית", "כיור נחושת"], slug: "ki-tisa" },
  { keywords: ["פרשת ויקהל", "ויקהל", "שבת ומלאכה", "אמני המשכן", "בצלאל"], slug: "vayakhel" },
  { keywords: ["פרשת פקודי", "פקודי", "הקמת המשכן", "חשבון המשכן", "ענן כבוד"], slug: "pekudei" },

  // פרשיות — ספר ויקרא
  { keywords: ["פרשת ויקרא", "ויקרא", "קרבנות", "עולה", "מנחה", "שלמים"], slug: "vayikra" },
  { keywords: ["פרשת צו", "פרשת צו", "הוראות הכהנים", "שמיני למילואים"], slug: "tzav" },
  { keywords: ["פרשת שמיני", "פרשת שמיני", "בני אהרן", "נדב ואביהוא", "כשרות", "בעלי חיים טמאים"], slug: "shmini" },
  { keywords: ["פרשת תזריע", "תזריע", "צרעת", "טהרת האם", "ילד נולד"], slug: "tazria" },
  { keywords: ["פרשת מצורע", "מצורע", "טהרת המצורע", "צרעת הבית", "לשון הרע"], slug: "metzora" },
  { keywords: ["פרשת אחרי מות", "אחרי מות", "יום כיפור במקדש", "שעיר לעזאזל", "קדושת הדם"], slug: "acharei-mot" },
  { keywords: ["פרשת קדושים", "קדושים", "קדושים תהיו", "ואהבת לרעך"], slug: "kedoshim" },
  { keywords: ["פרשת אמור", "פרשת אמור", "מועדים", "שבת ומועד", "ספירת העומר", "כהנים ופגמים"], slug: "emor" },
  { keywords: ["פרשת בהר", "פרשת בהר", "שמיטה", "יובל", "עבד עברי ומחיר"], slug: "behar" },
  { keywords: ["פרשת בחוקותי", "בחוקותי", "ברכות וקללות", "תוכחה"], slug: "bechukotai" },

  // פרשיות — ספר במדבר
  { keywords: ["פרשת במדבר", "פרשת במדבר", "מפקד", "סדר המחנות"], slug: "bamidbar" },
  { keywords: ["פרשת נשא", "פרשת נשא", "ברכת כהנים", "נזיר", "סוטה"], slug: "naso" },
  { keywords: ["פרשת בהעלותך", "בהעלותך", "מנורת המשכן", "מתאוננים", "קברות התאוה"], slug: "behaalotcha" },
  { keywords: ["פרשת שלח", "שלח לך", "מרגלים", "עשרה מרגלים", "כלב ויהושע"], slug: "shelach" },
  { keywords: ["פרשת קרח", "קרח", "מחלוקת קרח", "מחלוקת לשמה"], slug: "korach" },
  { keywords: ["פרשת חוקת", "חוקת", "פרה אדומה", "מות מרים", "מי מריבה"], slug: "chukat" },
  { keywords: ["פרשת בלק", "בלק", "בלעם", "אתון בלעם", "ברכות בלעם"], slug: "balak" },
  { keywords: ["פרשת פנחס", "פינחס", "פנחס", "בנות צלפחד", "קנאות"], slug: "pinchas" },
  { keywords: ["פרשת מטות", "מטות", "נדרים", "מלחמת מדין", "שבטי גד וראובן"], slug: "matot" },
  { keywords: ["פרשת מסעי", "מסעי", "מסעות במדבר", "ערי מקלט"], slug: "masei" },

  // פרשיות — ספר דברים
  { keywords: ["פרשת דברים", "פרשת דברים", "משה נואם", "דברי תוכחה"], slug: "devarim" },
  { keywords: ["פרשת ואתחנן", "ואתחנן", "שמע ישראל", "עשרת הדיברות", "ואהבת"], slug: "vaetchanan" },
  { keywords: ["פרשת עקב", "פרשת עקב", "ארץ ישראל", "מזוזה", "אם שמוע תשמעו"], slug: "ekev" },
  { keywords: ["פרשת ראה", "פרשת ראה", "ברכה וקללה", "מקום המקדש", "מעשר שני"], slug: "ree" },
  { keywords: ["פרשת שופטים", "פרשת שופטים", "מלך", "דיינים", "עיר מקלט", "צבא"], slug: "shoftim" },
  { keywords: ["פרשת כי תצא", "כי תצא", "שבי", "גט", "עמלק", "מצוות"], slug: "ki-tetze" },
  { keywords: ["פרשת כי תבוא", "כי תבוא", "ביכורים", "ווידוי מעשרות", "ברכות וקללות"], slug: "ki-tavo" },
  { keywords: ["פרשת נצבים", "נצבים", "ברית", "תשובה", "כל נדרי", "לב ערל"], slug: "nitzavim" },
  { keywords: ["פרשת וילך", "וילך", "שירת האזינו", "הקהל", "יום מותי"], slug: "vayelech" },
  { keywords: ["פרשת האזינו", "האזינו", "שירת משה", "האזינו השמים"], slug: "haazinu" },
  { keywords: ["וזאת הברכה", "ברכת משה", "פטירת משה", "מות משה"], slug: "vezot-habracha" },
];

function detectSubTopics(title: string, content: string): string[] {
  const text = `${title} ${content}`.toLowerCase();
  const found: string[] = [];

  for (const { keywords, slug } of KEYWORD_MAP) {
    for (const kw of keywords) {
      if (text.includes(kw.toLowerCase())) {
        if (!found.includes(slug)) found.push(slug);
        break;
      }
    }
  }

  return found;
}

async function main() {
  console.log(`\n🔍 ${DRY_RUN ? "[DRY RUN] " : ""}מחפש דברי תורה ללא שיוך תת-נושאים...\n`);

  const docs = await sanity.fetch<Array<{ _id: string; title: string; content: string; subTopics?: unknown[] }>>(
    `*[_type == "divarTora" && status == "published" && (
      !defined(subTopics) || count(subTopics) == 0
    )] { _id, title, content }`
  );

  console.log(`נמצאו ${docs.length} דברי תורה לשיוך\n`);

  let updated = 0;
  let skipped = 0;

  for (const doc of docs) {
    const slugs = detectSubTopics(doc.title, doc.content || "");

    if (slugs.length === 0) {
      console.log(`  ⚪ "${doc.title}" — לא זוהו מילות מפתח`);
      skipped++;
      continue;
    }

    const refs = validateAndBuildRefs(slugs);
    console.log(`  ✅ "${doc.title}" → [${slugs.join(", ")}]`);

    if (!DRY_RUN) {
      await sanity.patch(doc._id).set({ subTopics: refs }).commit();
    }

    updated++;
  }

  console.log(`\n${DRY_RUN ? "[DRY RUN] " : ""}✅ סיום: ${updated} ישויכו, ${skipped} ללא זיהוי`);
  if (DRY_RUN) console.log("הרץ ללא --dry-run לשמירה ב-Sanity");
}

main().catch((err) => {
  console.error("שגיאה:", err);
  process.exit(1);
});
