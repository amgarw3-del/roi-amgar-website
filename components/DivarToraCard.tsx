import Link from "next/link";
import { BookOpen, Download } from "lucide-react";

interface Props {
  _id: string;
  title: string;
  slug: { current: string };
  teaser?: string;
  publishedAt?: string;
  category?: { hebrewName: string; slug: { current: string } };
  subTopics?: { hebrewName: string; slug: { current: string } }[];
}

export default function DivarToraCard({ title, slug, teaser, publishedAt, category, subTopics }: Props) {
  const date = publishedAt
    ? new Date(publishedAt).toLocaleDateString("he-IL", { day: "numeric", month: "long", year: "numeric" })
    : null;

  return (
    <div className="card p-5 flex flex-col gap-3 group">
      <div className="flex items-start gap-3">
        <div
          className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5"
          style={{ background: "var(--color-warm)" }}
        >
          <BookOpen size={16} style={{ color: "var(--color-primary)" }} />
        </div>
        <div className="flex-1 min-w-0">
          {category && (
            <span className="badge text-xs mb-1 inline-block">{category.hebrewName}</span>
          )}
          <Link href={`/dvar-tora/${slug.current}`}>
            <h3
              className="font-bold text-lg leading-snug hover:underline"
              style={{ color: "var(--color-primary)" }}
            >
              {title}
            </h3>
          </Link>
          {subTopics && subTopics.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {subTopics.map((st) => (
                <span
                  key={st.slug.current}
                  className="text-xs px-2 py-0.5 rounded-full border"
                  style={{
                    background: "var(--color-accent, #b5834a)11",
                    color: "var(--color-accent, #b5834a)",
                    borderColor: "var(--color-accent, #b5834a)44",
                  }}
                >
                  {st.hebrewName}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {teaser && (
        <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">{teaser}</p>
      )}

      <div className="flex items-center justify-between mt-auto pt-1">
        {date && <span className="text-xs text-gray-400">{date}</span>}
        <div className="flex items-center gap-3">
          <a
            href={`/api/download-dvar/${slug.current}`}
            download
            title="הורד כ-Word"
            className="flex items-center gap-1 text-xs transition-opacity opacity-60 hover:opacity-100"
            style={{ color: "var(--color-accent)" }}
          >
            <Download size={13} />
            הורדה
          </a>
          <Link
            href={`/dvar-tora/${slug.current}`}
            className="text-sm font-semibold flex items-center gap-1"
            style={{ color: "var(--color-accent)" }}
          >
            קרא עוד ←
          </Link>
        </div>
      </div>
    </div>
  );
}
