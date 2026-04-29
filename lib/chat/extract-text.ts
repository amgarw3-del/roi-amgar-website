// Extracts plain Hebrew text + canonical site URL from any indexable Sanity doc.

interface PortableTextChild { _type?: string; text?: string }
interface PortableTextBlock { _type?: string; children?: PortableTextChild[]; text?: string }

function portableTextToPlain(blocks: PortableTextBlock[] | undefined): string {
  if (!Array.isArray(blocks)) return "";
  return blocks
    .map((b) => {
      if (b._type === "block" && Array.isArray(b.children)) {
        return b.children.map((c) => c.text ?? "").join("");
      }
      return b.text ?? "";
    })
    .filter(Boolean)
    .join("\n\n");
}

interface CategoryRef {
  hebrewName?: string;
  slug?: { current?: string };
}

interface SubTopicRef {
  hebrewName?: string;
  slug?: { current?: string };
  group?: string; // moed | parasha | fast | national
}

export interface IndexableDoc {
  _id: string;
  _type: string;
  // common
  title?: string;
  question?: string;
  slug?: { current?: string } | string;
  publishedAt?: string;
  status?: string;
  hidden?: boolean;
  isPublic?: boolean;
  published?: boolean;
  category?: CategoryRef | null;
  extraCategories?: CategoryRef[];
  subTopics?: SubTopicRef[];
  // type-specific
  summary?: string;
  transcript?: string;
  teaser?: string;
  content?: string;
  body?: PortableTextBlock[];
  answer?: string;
  description?: string;
}

export interface ExtractedDoc {
  docId: string;
  type: string;
  title: string;
  slug: string;
  url: string;
  category?: string;
  /** Joined Hebrew names of all categories (primary + extras) and sub-topics. */
  topics: string[];
  publishedAt?: string;
  text: string;
}

function getSlug(doc: IndexableDoc): string {
  if (typeof doc.slug === "string") return doc.slug;
  if (doc.slug?.current) return doc.slug.current;
  return doc._id; // lecture + pdfSummary אין להם slug
}

const PDF_CATEGORY_LABELS: Record<string, string> = {
  general:    "כללי",
  shabbat:    "הלכות שבת",
  kashrut:    "הלכות כשרות",
  nidda:      "הלכות נידה",
  evelut:     "הלכות אבלות",
  "yoreh-deah": "הלכות יורה דעה",
};

function urlFor(type: string, slug: string): string {
  switch (type) {
    case "video":      return `/shiur/${slug}`;
    case "divarTora":  return `/dvar-tora/${slug}`;
    case "blogPost":   return `/blog/${slug}`;
    case "qna":        return `/shaal/${slug}`;
    case "lecture":    return `/lectures`;
    case "pdfSummary": return `/sikkumim`;
    default:           return `/${slug}`;
  }
}

const PARASHA_GROUP_LABEL: Record<string, string> = {
  parasha: "פרשת",
  moed: "מועד",
  fast: "צום",
  national: "יום לאומי",
};

function topicLabels(doc: IndexableDoc): string[] {
  const out: string[] = [];
  if (doc.category?.hebrewName) out.push(doc.category.hebrewName);
  for (const c of doc.extraCategories ?? []) {
    if (c?.hebrewName) out.push(c.hebrewName);
  }
  for (const st of doc.subTopics ?? []) {
    if (!st?.hebrewName) continue;
    const prefix = PARASHA_GROUP_LABEL[st.group ?? ""] ?? "";
    out.push(prefix ? `${prefix} ${st.hebrewName}` : st.hebrewName);
  }
  return Array.from(new Set(out));
}

/** Returns null if the doc should NOT be indexed (unpublished, hidden, private). */
export function extract(doc: IndexableDoc): ExtractedDoc | null {
  const type = doc._type;
  const slug = getSlug(doc);
  if (!slug) return null;

  if (type === "video") {
    if (doc.status !== "published" || doc.hidden) return null;
  } else if (type === "divarTora") {
    if (doc.status !== "published") return null;
  } else if (type === "qna") {
    if (!doc.isPublic) return null;
  } else if (type === "blogPost") {
    // no status field — index all
  } else if (type === "lecture") {
    if (doc.published === false) return null;
  } else if (type === "pdfSummary") {
    if (doc.published === false) return null;
  } else {
    return null;
  }

  let title = "";
  let parts: string[] = [];

  if (type === "video") {
    title = doc.title ?? "";
    parts = [doc.title ?? "", doc.summary ?? "", doc.transcript ?? ""];
  } else if (type === "divarTora") {
    title = doc.title ?? "";
    parts = [doc.title ?? "", doc.teaser ?? "", doc.content ?? ""];
  } else if (type === "blogPost") {
    title = doc.title ?? "";
    parts = [doc.title ?? "", portableTextToPlain(doc.body)];
  } else if (type === "qna") {
    title = doc.question ?? "";
    parts = [doc.question ?? "", doc.answer ?? ""];
  } else if (type === "lecture") {
    title = doc.title ?? "";
    parts = [doc.title ?? "", doc.summary ?? ""];
  } else if (type === "pdfSummary") {
    title = doc.title ?? "";
    const catKey = typeof doc.category === "string" ? doc.category : "";
    const catLabel = PDF_CATEGORY_LABELS[catKey] ?? catKey;
    parts = [doc.title ?? "", doc.description ?? "", catLabel];
  }

  const topics = topicLabels(doc);
  // Prepend topic labels to the body so retrieval/LLM see them.
  if (topics.length) parts.unshift(`נושאים: ${topics.join(", ")}`);

  const text = parts
    .filter(Boolean)
    .join("\n\n")
    .replace(/\s+/g, " ")
    .trim();

  if (text.length < 30) return null;

  return {
    docId: doc._id,
    type,
    title: title.slice(0, 300),
    slug,
    url: urlFor(type, slug),
    category: doc.category?.hebrewName,
    topics,
    publishedAt: doc.publishedAt,
    text,
  };
}
