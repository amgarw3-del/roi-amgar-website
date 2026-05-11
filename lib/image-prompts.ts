/**
 * lib/image-prompts.ts
 *
 * מיפוי אירועים לסמלים ופלטות צבעים ליצירת תמונות Gemini.
 * עיקרון מחייב: ללא דמויות אנושיות, ללא פנים, ללא אנשים.
 */

export type EventGroup = "parasha" | "moed" | "fast" | "national" | "general";

export interface ImagePromptConfig {
  symbols: string;
  palette: string;
}

/**
 * מיפוי לפי שם אירוע (slug או שם עברי).
 * אם לא מוצא — fallback לפי group.
 */
const EVENT_MAP: Record<string, ImagePromptConfig> = {
  // === שבת ופרשות ===
  shabbat: { symbols: "Shabbat candles, braided challah bread, silver kiddush wine cup, rising warm light", palette: "deep gold with sky blue accents" },

  // === מועדים ===
  pesach: { symbols: "stacked matzot, four ornate wine cups, parted sea (symbolic), Aaron's staff", palette: "rich gold with deep crimson red" },
  שבועות: { symbols: "two stone tablets of the Ten Commandments, Mount Sinai silhouette, wheat sheaves, divine fire from heaven", palette: "gold with olive green and bright sky" },
  shavuot: { symbols: "two stone tablets of the Ten Commandments, Mount Sinai silhouette, wheat sheaves, divine fire from heaven", palette: "gold with olive green and bright sky" },
  sukkot: { symbols: "ornate sukkah booth with schach roof, four species (lulav, etrog, hadass, aravah), clouds of glory", palette: "gold with forest green and warm orange" },
  "rosh-hashanah": { symbols: "ornate ram horn shofar, pomegranates, open Book of Life with quill", palette: "gold with honey amber and sky blue" },
  ראש_השנה: { symbols: "ornate ram horn shofar, pomegranates, open Book of Life with quill", palette: "gold with honey amber and sky blue" },
  "yom-kippur": { symbols: "memorial candle, open Book of Life, swirling incense clouds, golden Temple altar", palette: "gold with pure white and royal blue" },
  יום_כיפור: { symbols: "memorial candle, open Book of Life, swirling incense clouds, golden Temple altar", palette: "gold with pure white and royal blue" },
  hanukkah: { symbols: "golden seven-branched menorah with flames, small clay oil jugs, eight points of light", palette: "deep gold with royal blue and silver" },
  חנוכה: { symbols: "golden seven-branched menorah with flames, small clay oil jugs, eight points of light", palette: "deep gold with royal blue and silver" },
  purim: { symbols: "rolled Esther scroll, ornate royal crown, decorative carnival mask, hamantash pastry", palette: "gold with royal purple and crimson" },
  פורים: { symbols: "rolled Esther scroll, ornate royal crown, decorative carnival mask, hamantash pastry", palette: "gold with royal purple and crimson" },

  // === צומות ===
  "tisha-bav": { symbols: "ruined Temple stones (symbolic), single extinguished candle, broken stones of the Western Wall", palette: "muted gray with deep mournful brown" },
  תשעה_באב: { symbols: "ruined Temple stones (symbolic), single extinguished candle, broken stones of the Western Wall", palette: "muted gray with deep mournful brown" },
  "17-tammuz": { symbols: "cracked Jerusalem walls, broken siege stones, weathered ancient ramparts", palette: "muted gray with desaturated brown" },
  "fast-gedaliah": { symbols: "broken city gates, scattered keys, fallen leaves", palette: "muted gray with deep blue" },
  "10-tevet": { symbols: "besieged Jerusalem walls, snow on ancient stones, cold winter ramparts", palette: "muted gray with cold blue" },
  "esther-fast": { symbols: "rolled scroll partially open, fading candle, ornate Persian arches", palette: "muted gold with deep purple" },

  // === מועדים לאומיים ===
  "yom-haatzmaut": { symbols: "Tower of David, Israeli flag waving, illuminated Jerusalem skyline at golden hour", palette: "azure blue with pure white and gold" },
  יום_העצמאות: { symbols: "Tower of David, Israeli flag waving, illuminated Jerusalem skyline at golden hour", palette: "azure blue with pure white and gold" },
  "yom-hazikaron": { symbols: "single memorial candle, red anemone flower (kalanit), Jerusalem stone walls in mist", palette: "muted gray with sky blue and deep crimson" },
  יום_הזיכרון: { symbols: "single memorial candle, red anemone flower (kalanit), Jerusalem stone walls in mist", palette: "muted gray with sky blue and deep crimson" },
  "yom-yerushalayim": { symbols: "Old City walls, Western Wall stones, Jaffa Gate, golden Dome silhouette", palette: "deep gold with Jerusalem stone and azure" },
  יום_ירושלים: { symbols: "Old City walls, Western Wall stones, Jaffa Gate, golden Dome silhouette", palette: "deep gold with Jerusalem stone and azure" },

  // === מיוחדים ===
  "lag-baomer": { symbols: "large blazing bonfire, Mount Meron silhouette at night, scattered stars, sparks rising", palette: "orange flames with deep night black and gold" },
  "ל-ג-בעומר": { symbols: "large blazing bonfire, Mount Meron silhouette at night, scattered stars, sparks rising", palette: "orange flames with deep night black and gold" },
  "rosh-chodesh": { symbols: "thin crescent moon, scattered stars, twilight sky", palette: "silver with deep night blue" },
  "tu-bishvat": { symbols: "blossoming almond tree branches, fruit of the seven species, etrog and figs", palette: "soft gold with spring green" },
  "tu-bav": { symbols: "soft white moonlight, vineyard at dusk, dancing white ribbons", palette: "moonlight silver with rose pink and white" },
};

/**
 * fallback לפי group של subTopic
 */
const GROUP_FALLBACK: Record<EventGroup, ImagePromptConfig> = {
  parasha: { symbols: "open Torah scroll with ornate wooden handles, golden crown, divine light rays", palette: "deep gold with royal blue" },
  moed: { symbols: "festive table setting, kiddush cup, festive candles, ornate decoration", palette: "rich gold with warm tones" },
  fast: { symbols: "single candle, ancient stones, weathered scroll", palette: "muted gray with deep brown" },
  national: { symbols: "Jerusalem skyline, Israeli flag, Tower of David", palette: "azure blue with white and gold" },
  general: { symbols: "open Torah scroll, ornate Hebrew letters, golden light", palette: "gold with deep blue" },
};

/**
 * מחזיר prompt מלא ליצירת תמונת אירוע
 */
export function buildEventImagePrompt(params: {
  eventName: string; // שם בעברית, יוצג בתמונה
  eventKey?: string; // slug / מזהה למיפוי
  group: EventGroup;
}): string {
  const { eventName, eventKey, group } = params;

  const config =
    (eventKey ? EVENT_MAP[eventKey] : undefined) ||
    (EVENT_MAP[eventName] as ImagePromptConfig | undefined) ||
    GROUP_FALLBACK[group];

  return `Create a square 1:1 ornate religious Jewish art piece, 1024x1024 pixels.

CRITICAL CONSTRAINTS — DO NOT VIOLATE:
- NO PEOPLE, NO HUMAN FIGURES, NO FACES, NO PORTRAITS
- NO silhouettes of people, NO hands, NO body parts
- ONLY symbolic objects, architecture, and decorative elements

Style: ornate biblical Hebrew manuscript illumination, like a medieval
illuminated Torah scroll page or Mishneh Torah folio. Traditional
Jewish art aesthetic with rich ${config.palette} color palette and deep
gold accents. Decorative geometric and floral border ornaments in the
style of Sephardic and Ashkenazi medieval manuscripts.

Composition (top to bottom):
1. TOP CENTER: Hebrew title "${eventName}" in large prominent gold
   biblical-style calligraphy with ornate serifs and decorative flourishes.
2. CENTER: Symbolic imagery (NO people): ${config.symbols}. Arranged
   harmoniously within decorative arch frames or ornate borders.
3. BOTTOM CENTER: Hebrew text "הרב רועי אמגר" in elegant smaller
   gold script, centered horizontally.

Surround the composition with decorative arches, columns, or ornate
border patterns. Use atmospheric warm lighting that evokes sanctity
and reverence. The overall feeling should be timeless, sacred, ornate,
and museum-quality — like an artifact from a great Jewish library.

Output: square 1:1 aspect ratio image, 1024x1024.`;
}

/**
 * מחזיר event key לcache (slug + שנה עברית)
 */
export function buildEventCacheKey(eventKey: string, hebrewYear: string): string {
  return `${eventKey}-${hebrewYear}`.replace(/[^a-z0-9-]/gi, "-");
}
