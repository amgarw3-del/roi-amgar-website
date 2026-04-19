import Link from "next/link";
import { BookOpen } from "lucide-react";

interface Props {
  _id: string;
  title: string;
  slug: { current: string };
  teaser?: string;
  publishedAt?: string;
  category?: { hebrewName: string; slug: { current: string } };
}

export default function DivarToraCard({ title, slug, teaser, publishedAt, category }: Props) {
  const date = publishedAt
    ? new Date(publishedAt).toLocaleDateString("he-IL", { day: "numeric", month: "long", year: "numeric" })
    : null;

  return (
    <Link href={`/dvar-tora/${slug.current}`} className="card p-5 flex flex-col gap-3 group">
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
          <h3
            className="font-bold text-lg leading-snug group-hover:underline"
            style={{ color: "var(--color-primary)" }}
          >
            {title}
          </h3>
        </div>
      </div>

      {teaser && (
        <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">{teaser}</p>
      )}

      <div className="flex items-center justify-between mt-auto pt-1">
        {date && <span className="text-xs text-gray-400">{date}</span>}
        <span
          className="text-sm font-semibold flex items-center gap-1"
          style={{ color: "var(--color-accent)" }}
        >
          קרא עוד ←
        </span>
      </div>
    </Link>
  );
}
