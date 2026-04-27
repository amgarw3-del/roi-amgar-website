/**
 * seed-subtopics.js — זריעת כל תתי-הנושאים ל-Sanity
 * הרצה: node scripts/seed-subtopics.js
 * משתני סביבה נדרשים: SANITY_PROJECT_ID, SANITY_DATASET, SANITY_API_TOKEN
 */

const { createClient } = require("@sanity/client");

const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID || "bssgoew8",
  dataset: process.env.SANITY_DATASET || "production",
  apiVersion: "2024-01-01",
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
});

function toSlug(str) {
  // שמירת Hebrew כ-slug (Sanity תומך ב-Unicode slugs)
  return str
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/"/g, "")
    .replace(/'/g, "")
    .replace(/\//g, "-");
}

const subTopics = [
  // ─── מועדים ───────────────────────────────────────
  { hebrewName: "ראש השנה",                   slug: "rosh-hashana",      group: "moed",     order: 1 },
  { hebrewName: "יום הכיפורים",               slug: "yom-kippur",        group: "moed",     order: 2 },
  { hebrewName: "סוכות",                       slug: "sukkot",            group: "moed",     order: 3 },
  { hebrewName: "הושענא רבה",                  slug: "hoshana-raba",      group: "moed",     order: 4 },
  { hebrewName: "שמיני עצרת ושמחת תורה",      slug: "shmini-atzeret",    group: "moed",     order: 5 },
  { hebrewName: "חנוכה",                       slug: "chanuka",           group: "moed",     order: 6 },
  { hebrewName: "ט\"ו בשבט",                   slug: "tu-bishvat",        group: "moed",     order: 7 },
  { hebrewName: "פורים",                       slug: "purim",             group: "moed",     order: 8 },
  { hebrewName: "פורים שושן",                  slug: "purim-shushan",     group: "moed",     order: 9 },
  { hebrewName: "פסח",                         slug: "pesach",            group: "moed",     order: 10 },
  { hebrewName: "ספירת העומר",                 slug: "sfirat-haomer",     group: "moed",     order: 11 },
  { hebrewName: "ל\"ג בעומר",                  slug: "lag-baomer",        group: "moed",     order: 12 },
  { hebrewName: "שבועות",                      slug: "shavuot",           group: "moed",     order: 13 },
  { hebrewName: "ט\"ו באב",                    slug: "tu-beav",           group: "moed",     order: 14 },

  // ─── מועדים לאומיים ──────────────────────────────
  { hebrewName: "יום הזיכרון לשואה ולגבורה",             slug: "yom-hashoah",       group: "national", order: 1 },
  { hebrewName: "יום הזיכרון לחללי מערכות ישראל",        slug: "yom-hazikaron",     group: "national", order: 2 },
  { hebrewName: "יום העצמאות",                            slug: "yom-haatzmaut",     group: "national", order: 3 },
  { hebrewName: "יום ירושלים",                            slug: "yom-yerushalayim",  group: "national", order: 4 },

  // ─── צומות ───────────────────────────────────────
  { hebrewName: "צום גדליה",          slug: "tzom-gedalia",         group: "fast", order: 1 },
  { hebrewName: "עשרה בטבת",          slug: "asara-betevet",        group: "fast", order: 2 },
  { hebrewName: "תענית אסתר",         slug: "taanit-esther",        group: "fast", order: 3 },
  { hebrewName: "שבעה עשר בתמוז",     slug: "shiva-asar-betamuz",   group: "fast", order: 4 },
  { hebrewName: "תשעה באב",           slug: "tisha-beav",           group: "fast", order: 5 },

  // ─── פרשיות — ספר בראשית ─────────────────────────
  { hebrewName: "בראשית",     slug: "bereshit",      group: "parasha", order: 1  },
  { hebrewName: "נח",         slug: "noach",         group: "parasha", order: 2  },
  { hebrewName: "לך לך",      slug: "lech-lecha",    group: "parasha", order: 3  },
  { hebrewName: "וירא",       slug: "vayera",        group: "parasha", order: 4  },
  { hebrewName: "חיי שרה",    slug: "chayei-sara",   group: "parasha", order: 5  },
  { hebrewName: "תולדות",     slug: "toldot",        group: "parasha", order: 6  },
  { hebrewName: "ויצא",       slug: "vayetze",       group: "parasha", order: 7  },
  { hebrewName: "וישלח",      slug: "vayishlach",    group: "parasha", order: 8  },
  { hebrewName: "וישב",       slug: "vayeshev",      group: "parasha", order: 9  },
  { hebrewName: "מקץ",        slug: "miketz",        group: "parasha", order: 10 },
  { hebrewName: "ויגש",       slug: "vayigash",      group: "parasha", order: 11 },
  { hebrewName: "ויחי",       slug: "vayechi",       group: "parasha", order: 12 },

  // ─── פרשיות — ספר שמות ──────────────────────────
  { hebrewName: "שמות",       slug: "shemot",        group: "parasha", order: 13 },
  { hebrewName: "וארא",       slug: "vaera",         group: "parasha", order: 14 },
  { hebrewName: "בא",         slug: "bo",            group: "parasha", order: 15 },
  { hebrewName: "בשלח",       slug: "beshalach",     group: "parasha", order: 16 },
  { hebrewName: "יתרו",       slug: "yitro",         group: "parasha", order: 17 },
  { hebrewName: "משפטים",     slug: "mishpatim",     group: "parasha", order: 18 },
  { hebrewName: "תרומה",      slug: "teruma",        group: "parasha", order: 19 },
  { hebrewName: "תצווה",      slug: "tetzave",       group: "parasha", order: 20 },
  { hebrewName: "כי תשא",     slug: "ki-tisa",       group: "parasha", order: 21 },
  { hebrewName: "ויקהל",      slug: "vayakhel",      group: "parasha", order: 22 },
  { hebrewName: "פקודי",      slug: "pekudei",       group: "parasha", order: 23 },

  // ─── פרשיות — ספר ויקרא ─────────────────────────
  { hebrewName: "ויקרא",      slug: "vayikra",       group: "parasha", order: 24 },
  { hebrewName: "צו",         slug: "tzav",          group: "parasha", order: 25 },
  { hebrewName: "שמיני",      slug: "shmini",        group: "parasha", order: 26 },
  { hebrewName: "תזריע",      slug: "tazria",        group: "parasha", order: 27 },
  { hebrewName: "מצורע",      slug: "metzora",       group: "parasha", order: 28 },
  { hebrewName: "אחרי מות",   slug: "acharei-mot",   group: "parasha", order: 29 },
  { hebrewName: "קדושים",     slug: "kedoshim",      group: "parasha", order: 30 },
  { hebrewName: "אמור",       slug: "emor",          group: "parasha", order: 31 },
  { hebrewName: "בהר",        slug: "behar",         group: "parasha", order: 32 },
  { hebrewName: "בחוקותי",    slug: "bechukotai",    group: "parasha", order: 33 },

  // ─── פרשיות — ספר במדבר ─────────────────────────
  { hebrewName: "במדבר",      slug: "bamidbar",      group: "parasha", order: 34 },
  { hebrewName: "נשא",        slug: "naso",          group: "parasha", order: 35 },
  { hebrewName: "בהעלותך",    slug: "behaalotcha",   group: "parasha", order: 36 },
  { hebrewName: "שלח לך",     slug: "shelach",       group: "parasha", order: 37 },
  { hebrewName: "קרח",        slug: "korach",        group: "parasha", order: 38 },
  { hebrewName: "חוקת",       slug: "chukat",        group: "parasha", order: 39 },
  { hebrewName: "בלק",        slug: "balak",         group: "parasha", order: 40 },
  { hebrewName: "פנחס",       slug: "pinchas",       group: "parasha", order: 41 },
  { hebrewName: "מטות",       slug: "matot",         group: "parasha", order: 42 },
  { hebrewName: "מסעי",       slug: "masei",         group: "parasha", order: 43 },

  // ─── פרשיות — ספר דברים ─────────────────────────
  { hebrewName: "דברים",           slug: "devarim",          group: "parasha", order: 44 },
  { hebrewName: "ואתחנן",          slug: "vaetchanan",        group: "parasha", order: 45 },
  { hebrewName: "עקב",             slug: "ekev",              group: "parasha", order: 46 },
  { hebrewName: "ראה",             slug: "ree",               group: "parasha", order: 47 },
  { hebrewName: "שופטים",          slug: "shoftim",           group: "parasha", order: 48 },
  { hebrewName: "כי תצא",          slug: "ki-tetze",          group: "parasha", order: 49 },
  { hebrewName: "כי תבוא",         slug: "ki-tavo",           group: "parasha", order: 50 },
  { hebrewName: "נצבים",           slug: "nitzavim",          group: "parasha", order: 51 },
  { hebrewName: "וילך",            slug: "vayelech",          group: "parasha", order: 52 },
  { hebrewName: "האזינו",          slug: "haazinu",           group: "parasha", order: 53 },
  { hebrewName: "וזאת הברכה",      slug: "vezot-habracha",    group: "parasha", order: 54 },
];

async function seed() {
  console.log(`\n🌱 מתחיל זריעת ${subTopics.length} תתי-נושאים...\n`);

  let created = 0;
  let skipped = 0;

  for (const st of subTopics) {
    const _id = `subTopic-${st.slug}`;
    try {
      await client.createIfNotExists({
        _id,
        _type: "subTopic",
        hebrewName: st.hebrewName,
        slug: { _type: "slug", current: st.slug },
        group: st.group,
        order: st.order,
      });
      console.log(`  ✅ ${st.hebrewName} (${st.slug})`);
      created++;
    } catch (err) {
      console.log(`  ⚠️  ${st.hebrewName} — ${err.message}`);
      skipped++;
    }
  }

  console.log(`\n✅ סיום: ${created} נוצרו, ${skipped} דולגו`);
}

seed().catch((err) => {
  console.error("שגיאה:", err);
  process.exit(1);
});
