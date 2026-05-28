// In-memory index of all indexable docs. Cached at module level with a TTL,
// invalidated by the Sanity webhook. Fed wholesale to Gemini Flash on each chat.
//
// Sources:
//   1. Sanity docs (video, divarTora, blogPost, qna)
//   2. YouTube channel videos (long, medium, short) — fetched live via the YouTube API.
//      The site itself surfaces YouTube videos that aren't in Sanity, so the bot
//      indexes them too so it can recommend them.

import { client } from "@/sanity/client";
import { extract, type IndexableDoc, type ExtractedDoc } from "./extract-text";
import { fetchAllChannelVideos, type YouTubeVideo } from "@/lib/youtube";

export interface IndexedDoc {
  docId: string;
  type: string;
  typeLabel: string;
  title: string;
  slug: string;
  url: string;
  external?: boolean; // true → opens in new tab (YouTube)
  category?: string;
  topics: string[];
  publishedAt?: string;
  /** Compact preview — first 600 chars of the body. */
  preview: string;
  /** Q&A practical-ruling indicator — surfaced in index block as [הלכה למעשה ✓]. */
  isHalachicRuling?: boolean;
}

const TYPE_LABELS: Record<string, string> = {
  video: "שיעור מוסרט",
  divarTora: "דבר תורה",
  blogPost: "מאמר",
  qna: "שאלה ותשובה",
  lecture: "הרצאה",
  pdfSummary: "סיכום למבחן רבנות",
  youtube: "שיעור ב-YouTube",
  youtubeShort: "שורט",
  service: "שירות",
};

// Virtual "service" docs — site sections that aren't a Sanity content type but should
// be surfacable as sources with prominent CTAs (chof/lectures/shaal/sikkumim).
const VIRTUAL_DOCS: IndexedDoc[] = [
  {
    docId: "virtual:hupot",
    type: "service",
    typeLabel: "שירות — עריכת חופות",
    title: "עריכת חופות וקידושין",
    slug: "service-hupot",
    url: "/hupot",
    topics: [
      "חופה","חופות","קידושין","נישואין","חתונה","חתן","כלה","שבע ברכות",
      "כתובה","טבעת","ארוסין","מסדר קידושין","עריכת חופה","wedding"
    ],
    preview:
      "הרב רועי אמגר עורך חופות וקידושין — ייעוץ אישי לחתן ולכלה, ליווי לפני החתונה, ועריכת הטקס בנשמה ובחום. כולל המלצות מזוגות שערכו אצלו את החופה.",
  },
  {
    docId: "virtual:lectures-booking",
    type: "service",
    typeLabel: "שירות — הזמנת הרצאה",
    title: "הזמנת הרצאה לאירוע / קהילה / בית כנסת",
    slug: "service-lectures",
    url: "/lectures",
    topics: [
      "הרצאה","הרצאות","הזמנת הרצאה","בית כנסת","קהילה","אירוע","שבת חתן",
      "ברית","יום הולדת","בר מצווה","בת מצווה","יום עיון","ערב עיון",
      "lecture","speaker"
    ],
    preview:
      "להזמנת הרצאה של הרב רועי אמגר לכל אירוע — שבת חתן, בר/בת מצווה, ברית, ימי עיון בקהילה, ערבי לימוד.",
  },
  {
    docId: "virtual:shaal",
    type: "service",
    typeLabel: "שירות — שאל את הרב",
    title: "שאל את הרב — שאלה הלכתית מעשית",
    slug: "service-shaal",
    url: "/shaal",
    topics: [
      "שאלה הלכתית","הלכה למעשה","שאלה אישית","התייעצות","ייעוץ הלכתי",
      "WhatsApp","וואטסאפ","שו״ת","שאלה לרב","פסק הלכה"
    ],
    preview:
      "טופס לשאלות הלכתיות מעשיות — כולל מספר WhatsApp לשליחה ישירה לרב לקבלת מענה אישי.",
  },
  {
    docId: "virtual:sikkumim",
    type: "service",
    typeLabel: "שירות — סיכומי רבנות",
    title: "סיכומי רבנות להורדה (PDF)",
    slug: "service-sikkumim",
    url: "/sikkumim",
    topics: [
      "סיכומים","סיכומי הלכה","הלכות שבת","כשרות","נידה","אבלות","יורה דעה",
      "מבחן רבנות","למידה","PDF","הורדה"
    ],
    preview:
      "סיכומים מלאים בפורמט PDF להורדה — שבת, כשרות, נידה, אבלות, יורה דעה. חינם לציבור הלומדים.",
  },
];

const TTL_MS = 10 * 60 * 1000; // 10 minutes

interface Cache {
  builtAt: number;
  docs: IndexedDoc[];
}

let cache: Cache | null = null;
let inflight: Promise<IndexedDoc[]> | null = null;

const SANITY_QUERY = `*[_type in ["video","divarTora","blogPost","qna","lecture","pdfSummary"]] {
  _id, _type, title, question, slug, status, hidden, isPublic, publishedAt,
  summary, transcript, teaser, content, body, answer,
  published, description,
  questionType, answerType,
  searchKeywords,
  category->{hebrewName, slug},
  extraCategories[]->{hebrewName, slug},
  subTopics[]->{hebrewName, slug, group, aliases}
}`;

function fromExtracted(extracted: ExtractedDoc): IndexedDoc {
  return {
    docId: extracted.docId,
    type: extracted.type,
    typeLabel: TYPE_LABELS[extracted.type] ?? extracted.type,
    title: extracted.title,
    slug: extracted.slug,
    url: extracted.url,
    category: extracted.category,
    topics: extracted.topics,
    publishedAt: extracted.publishedAt,
    preview: extracted.text.slice(0, 600),
    isHalachicRuling: extracted.isHalachicRuling,
  };
}

function fromYouTube(v: YouTubeVideo, kind: "youtube" | "youtubeShort"): IndexedDoc {
  return {
    docId: `yt:${v.videoId}`,
    type: kind,
    typeLabel: TYPE_LABELS[kind],
    title: v.title,
    slug: v.videoId,
    url: `https://www.youtube.com/watch?v=${v.videoId}`,
    external: true,
    topics: [],
    publishedAt: v.publishedAt,
    preview: v.title, // YouTube API gives only title; that's enough for routing
  };
}

async function fetchSanity(): Promise<IndexedDoc[]> {
  try {
    const docs = await client.fetch<IndexableDoc[]>(SANITY_QUERY);
    const out: IndexedDoc[] = [];
    for (const d of docs) {
      const ex = extract(d);
      if (ex) out.push(fromExtracted(ex));
    }
    return out;
  } catch (err) {
    console.error("[doc-index] Sanity fetch failed:", err);
    return [];
  }
}

async function fetchYouTube(): Promise<IndexedDoc[]> {
  try {
    const all = await fetchAllChannelVideos();
    const out: IndexedDoc[] = [];
    const seen = new Set<string>();
    for (const v of all) {
      if (seen.has(v.videoId)) continue;
      seen.add(v.videoId);
      // Without duration we can't tell shorts vs regular — label them all uniformly.
      out.push(fromYouTube(v, "youtube"));
    }
    return out;
  } catch (err) {
    console.error("[doc-index] YouTube fetch failed:", err);
    return [];
  }
}

async function fetchAll(): Promise<IndexedDoc[]> {
  const [sanity, youtube] = await Promise.all([fetchSanity(), fetchYouTube()]);

  // Dedupe Sanity videos that match a YouTube videoId (so we don't list both)
  const sanitySlugs = new Set(
    sanity.filter((d) => d.type === "video").map((d) => d.slug)
  );
  const filteredYoutube = youtube.filter((y) => !sanitySlugs.has(y.slug));

  const all = [...sanity, ...filteredYoutube];
  all.sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""));
  // Virtual service docs are always available regardless of Sanity/YouTube state.
  return [...VIRTUAL_DOCS, ...all];
}

export async function getDocIndex(): Promise<IndexedDoc[]> {
  const now = Date.now();
  if (cache && now - cache.builtAt < TTL_MS) return cache.docs;
  if (inflight) return inflight;

  inflight = (async () => {
    const docs = await fetchAll();
    cache = { builtAt: Date.now(), docs };
    inflight = null;
    return docs;
  })();
  return inflight;
}

export function invalidateDocIndex(): void {
  cache = null;
}

/** Build the compact textual block fed to the LLM. Includes URL so the model can build inline markdown links. */
export function buildIndexBlock(docs: IndexedDoc[]): string {
  return docs
    .map((d) => {
      const meta: string[] = [d.typeLabel];
      if (d.isHalachicRuling) meta.push("[הלכה למעשה ✓]");
      if (d.category) meta.push(`קטגוריה: ${d.category}`);
      if (d.topics.length) meta.push(`נושאים: ${d.topics.join(", ")}`);
      const head = `[slug:${d.slug}] [url:${d.url}] (${meta.join(" | ")}) ${d.title}`;
      if (d.preview && d.preview !== d.title) {
        return `${head}\n  ${d.preview.slice(0, 380)}`;
      }
      return head;
    })
    .join("\n\n");
}

export function lookupBySlug(docs: IndexedDoc[], slug: string): IndexedDoc | undefined {
  return docs.find((d) => d.slug === slug);
}
