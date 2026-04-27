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
  category?: { hebrewName?: string; slug?: { current?: string } } | null;
  // type-specific
  summary?: string;
  transcript?: string;
  teaser?: string;
  content?: string;
  body?: PortableTextBlock[];
  answer?: string;
}

export interface ExtractedDoc {
  docId: string;
  type: string;
  title: string;
  slug: string;
  url: string;
  category?: string;
  publishedAt?: string;
  text: string;
}

function getSlug(doc: IndexableDoc): string {
  if (typeof doc.slug === "string") return doc.slug;
  return doc.slug?.current ?? "";
}

function urlFor(type: string, slug: string): string {
  switch (type) {
    case "video":
      return `/shiur/${slug}`;
    case "divarTora":
      return `/dvar-tora/${slug}`;
    case "blogPost":
      return `/blog/${slug}`;
    case "qna":
      return `/shaal/${slug}`;
    default:
      return `/${slug}`;
  }
}

/** Returns null if the doc should NOT be indexed (unpublished, hidden, private). */
export function extract(doc: IndexableDoc): ExtractedDoc | null {
  const type = doc._type;
  const slug = getSlug(doc);
  if (!slug) return null;

  // Visibility filters per type
  if (type === "video") {
    if (doc.status !== "published" || doc.hidden) return null;
  } else if (type === "divarTora") {
    if (doc.status !== "published") return null;
  } else if (type === "qna") {
    if (!doc.isPublic) return null;
  } else if (type === "blogPost") {
    // blogPost has no status field — index all
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
  }

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
    publishedAt: doc.publishedAt,
    text,
  };
}
