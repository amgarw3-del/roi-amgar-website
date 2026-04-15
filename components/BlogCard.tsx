import Link from "next/link";
import { Clock, PenLine } from "lucide-react";

interface BlogCardProps {
  _id: string;
  title: string;
  slug: { current: string };
  category?: { hebrewName: string; slug: { current: string } };
  body?: Array<{ _type: string; children?: Array<{ text?: string }> }>;
  publishedAt?: string;
  level?: string;
  source?: string;
}

function extractText(body?: BlogCardProps["body"]): string {
  if (!body) return "";
  return body
    .filter((b) => b._type === "block")
    .flatMap((b) => b.children ?? [])
    .map((c) => c.text ?? "")
    .join(" ")
    .slice(0, 150);
}

export default function BlogCard({
  title,
  slug,
  category,
  body,
  publishedAt,
}: BlogCardProps) {
  const excerpt = extractText(body);
  const formattedDate = publishedAt
    ? new Date(publishedAt).toLocaleDateString("he-IL", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <Link href={`/blog/${slug.current}`} className="card block group p-5">
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        {category && <span className="badge">{category.hebrewName}</span>}
        <span className="badge" style={{ background: "#f0f9ff", color: "#0369a1" }}>
          <PenLine size={11} className="ml-1" />
          מאמר
        </span>
      </div>

      <h3 className="font-bold text-gray-900 mb-2 text-lg leading-snug group-hover:text-primary transition-colors">
        {title}
      </h3>

      {excerpt && (
        <p className="text-gray-600 text-sm line-clamp-3 mb-3 leading-relaxed">
          {excerpt}...
        </p>
      )}

      <div className="flex items-center justify-between">
        {formattedDate && (
          <div className="flex items-center gap-1 text-gray-400 text-xs">
            <Clock size={12} />
            <span>{formattedDate}</span>
          </div>
        )}
        <span
          className="text-sm font-semibold group-hover:gap-2 transition-all flex items-center gap-1"
          style={{ color: "var(--color-primary)" }}
        >
          קרא עוד ←
        </span>
      </div>
    </Link>
  );
}
