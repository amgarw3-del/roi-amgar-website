/**
 * seed-subtopic-aliases.js — הוספת aliases (שמות חלופיים) ל-subTopics קיימים.
 * משמש את בוט החיפוש לזיהוי שאלות עם מילים נרדפות / שמות עממיים / תעתיק.
 *
 * הרצה: node scripts/seed-subtopic-aliases.js
 * משתני סביבה: SANITY_PROJECT_ID, SANITY_DATASET, SANITY_API_TOKEN
 */

const { createClient } = require("@sanity/client");

const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID || "bssgoew8",
  dataset: process.env.SANITY_DATASET || "production",
  apiVersion: "2024-01-01",
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
});

// מיפוי slug → רשימת aliases. הבוט יחפש בעברית, באנגלית, ובכינויים עממיים.
const ALIASES = {
  // ─── מועדים ────────────────────────────────────────
  "rosh-hashana": ["יום הדין", "תשרי", "ר״ה", "ראש השנה היהודי", "Rosh Hashana"],
  "yom-kippur": ["צום הגדול", "יום הדין", "יום קדוש", "כיפור", "Yom Kippur"],
  "sukkot": ["חג הסוכות", "חג האסיף", "סוכה", "ארבעת המינים", "אושפיזין", "Sukkot"],
  "hoshana-raba": ["הושענא רבא", "הושענות"],
  "shmini-atzeret": ["שמחת תורה", "שמיני עצרת", "Simchat Torah"],
  "chanuka": ["חנוכה", "חג האורים", "חנוכייה", "סופגניות", "לביבות", "Hanukkah", "Chanukah"],
  "tu-bishvat": ["ט״ו בשבט", "ראש השנה לאילנות", "Tu Bishvat"],
  "purim": ["מגילת אסתר", "משלוח מנות", "מתנות לאביונים", "סעודת פורים", "Purim"],
  "purim-shushan": ["שושן פורים", "Shushan Purim"],
  "pesach": ["חג המצות", "חג האביב", "ליל הסדר", "הגדה של פסח", "ארבע כוסות", "מצה", "Pesach", "Passover"],
  "sfirat-haomer": ["ספירה", "עומר", "49 ימים", "ספירת עומר"],
  "lag-baomer": ["לג בעומר", "ל״ג בעומר", "רשב״י", "מירון", "מדורה"],
  "shavuot": ["חג מתן תורה", "חג הביכורים", "חג הקציר", "תיקון ליל שבועות", "Shavuot"],
  "tu-beav": ["ט״ו באב", "חג האהבה"],

  // ─── מועדים לאומיים ───────────────────────────────
  "yom-hashoah": ["יום השואה", "השואה", "Holocaust"],
  "yom-hazikaron": ["יום הזיכרון", "חללי צה״ל", "Memorial Day"],
  "yom-haatzmaut": ["יום העצמאות", "Independence Day"],
  "yom-yerushalayim": ["יום ירושלים", "איחוד ירושלים", "Jerusalem Day"],

  // ─── צומות ─────────────────────────────────────────
  "tzom-gedalia": ["צום גדליהו", "ג׳ בתשרי"],
  "asara-betevet": ["עשרה בטבת", "צום עשרה בטבת"],
  "taanit-esther": ["תענית אסתר", "צום אסתר"],
  "shiva-asar-betamuz": ["י״ז בתמוז", "שבעה עשר בתמוז", "בין המצרים"],
  "tisha-beav": ["ט׳ באב", "ת״ב", "חורבן הבית", "בין המצרים", "תשעה באב", "Tisha Beav"],

  // ─── פרשיות — ספר בראשית ──────────────────────────
  "bereshit": ["בראשית", "פר׳ בראשית", "Parashat Bereshit"],
  "noach": ["נח", "תיבת נח", "פר׳ נח", "Parashat Noach"],
  "lech-lecha": ["לך לך", "אברהם", "Lech Lecha"],
  "vayera": ["וירא", "עקדת יצחק", "סדום", "Vayera"],
  "chayei-sarah": ["חיי שרה", "מערת המכפלה", "Chayei Sarah"],
  "toldot": ["תולדות", "יעקב ועשו", "Toldot"],
  "vayetzei": ["ויצא", "סולם יעקב", "Vayetzei"],
  "vayishlach": ["וישלח", "מאבק יעקב", "Vayishlach"],
  "vayeshev": ["וישב", "יוסף ואחיו", "Vayeshev"],
  "miketz": ["מקץ", "פרעה", "Miketz"],
  "vayigash": ["ויגש", "יהודה ויוסף", "Vayigash"],
  "vayechi": ["ויחי", "ברכת יעקב", "Vayechi"],

  // ─── פרשיות — ספר שמות ────────────────────────────
  "shemot": ["שמות", "Shemot"],
  "vaera": ["וארא", "עשר המכות", "Vaera"],
  "bo": ["בא", "יציאת מצרים", "Bo"],
  "beshalach": ["בשלח", "קריעת ים סוף", "Beshalach"],
  "yitro": ["יתרו", "עשרת הדיברות", "מתן תורה", "Yitro"],
  "mishpatim": ["משפטים", "Mishpatim"],
  "terumah": ["תרומה", "המשכן", "Terumah"],
  "tetzaveh": ["תצוה", "בגדי כהונה", "Tetzaveh"],
  "ki-tisa": ["כי תשא", "חטא העגל", "Ki Tisa"],
  "vayakhel": ["ויקהל", "Vayakhel"],
  "pekudei": ["פקודי", "Pekudei"],

  // ─── פרשיות — ספר ויקרא ───────────────────────────
  "vayikra": ["ויקרא", "קרבנות", "Vayikra"],
  "tzav": ["צו", "Tzav"],
  "shmini": ["שמיני", "כשרות", "Shmini"],
  "tazria": ["תזריע", "Tazria"],
  "metzora": ["מצורע", "Metzora"],
  "acharei-mot": ["אחרי מות", "Acharei Mot"],
  "kedoshim": ["קדושים", "ואהבת לרעך כמוך", "Kedoshim"],
  "emor": ["אמור", "Emor"],
  "behar": ["בהר", "שמיטה", "Behar"],
  "bechukotai": ["בחקתי", "Bechukotai"],

  // ─── פרשיות — ספר במדבר ───────────────────────────
  "bamidbar": ["במדבר", "Bamidbar"],
  "naso": ["נשא", "ברכת כהנים", "Naso"],
  "behaalotcha": ["בהעלתך", "Behaalotcha"],
  "shlach": ["שלח", "המרגלים", "Shlach"],
  "korach": ["קרח", "מחלוקת", "Korach"],
  "chukat": ["חקת", "פרה אדומה", "Chukat"],
  "balak": ["בלק", "בלעם", "Balak"],
  "pinchas": ["פנחס", "קנאות", "Pinchas"],
  "matot": ["מטות", "Matot"],
  "masei": ["מסעי", "Masei"],

  // ─── פרשיות — ספר דברים ───────────────────────────
  "devarim": ["דברים", "Devarim"],
  "vaetchanan": ["ואתחנן", "שמע ישראל", "Vaetchanan"],
  "ekev": ["עקב", "Ekev"],
  "reeh": ["ראה", "Reeh"],
  "shoftim": ["שופטים", "Shoftim"],
  "ki-tetzeh": ["כי תצא", "Ki Tetzeh"],
  "ki-tavo": ["כי תבוא", "ברכות וקללות", "Ki Tavo"],
  "nitzavim": ["נצבים", "Nitzavim"],
  "vayelech": ["וילך", "Vayelech"],
  "haazinu": ["האזינו", "Haazinu"],
  "vezot-haberacha": ["וזאת הברכה", "Vezot Haberacha"],
};

async function run() {
  if (!process.env.SANITY_API_TOKEN) {
    console.error("❌ נדרש משתנה סביבה SANITY_API_TOKEN");
    process.exit(1);
  }

  const slugs = Object.keys(ALIASES);
  console.log(`🔎 שולף ${slugs.length} subTopics מ-Sanity...`);

  const docs = await client.fetch(
    `*[_type == "subTopic" && slug.current in $slugs]{_id, slug, hebrewName}`,
    { slugs }
  );

  console.log(`📦 נמצאו ${docs.length} מסמכים. מעדכן aliases...`);

  let updated = 0;
  let missing = 0;
  for (const doc of docs) {
    const slug = doc.slug?.current;
    const aliases = ALIASES[slug];
    if (!aliases) {
      missing++;
      continue;
    }
    await client.patch(doc._id).set({ aliases }).commit();
    updated++;
    console.log(`  ✓ ${doc.hebrewName} → [${aliases.length} aliases]`);
  }

  // Report any slugs that don't exist in Sanity yet (so user can seed them).
  const foundSlugs = new Set(docs.map((d) => d.slug?.current));
  const notInSanity = slugs.filter((s) => !foundSlugs.has(s));

  console.log(`\n✅ עודכנו ${updated} מסמכים.`);
  if (missing) console.log(`⚠️  ${missing} מסמכים ללא aliases במיפוי.`);
  if (notInSanity.length) {
    console.log(`ℹ️  ${notInSanity.length} slugs במיפוי אך לא ב-Sanity:`);
    console.log("   " + notInSanity.join(", "));
  }
}

run().catch((err) => {
  console.error("❌ שגיאה:", err);
  process.exit(1);
});
