import Link from "next/link";
import { Play, Clock } from "lucide-react";

interface VideoCardProps {
  _id: string;
  title: string;
  slug: { current: string };
  category?: { hebrewName: string; slug: { current: string } };
  summary?: string;
  publishedAt?: string;
  youtubeId?: string;
  platform?: string;
  level?: string;
}

const levelLabels: Record<string, string> = {
  beginner: "מתחיל",
  advanced: "מתקדם",
  "talmidei-torah": "לבני תורה",
};

export default function VideoCard({
  title,
  slug,
  category,
  summary,
  publishedAt,
  youtubeId,
  level,
}: VideoCardProps) {
  const formattedDate = publishedAt
    ? new Date(publishedAt).toLocaleDateString("he-IL", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <Link href={`/shiur/${slug.current}`} className="card block group">
      {/* Thumbnail */}
      <div className="relative aspect-video bg-gray-100 overflow-hidden">
        {youtubeId ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: "var(--color-warm)" }}
          >
            <Play size={40} style={{ color: "var(--color-primary)" }} />
          </div>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Play size={20} style={{ color: "var(--color-primary)" }} fill="currentColor" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          {category && (
            <span className="badge">{category.hebrewName}</span>
          )}
          {level && levelLabels[level] && (
            <span className="badge" style={{ background: "var(--color-warm-dark)" }}>
              {levelLabels[level]}
            </span>
          )}
        </div>

        <h3 className="font-bold text-gray-900 mb-2 leading-snug group-hover:text-primary transition-colors line-clamp-2">
          {title}
        </h3>

        {summary && (
          <p className="text-gray-600 text-sm line-clamp-2 mb-3 leading-relaxed">
            {summary}
          </p>
        )}

        {formattedDate && (
          <div className="flex items-center gap-1 text-gray-400 text-xs">
            <Clock size={12} />
            <span>{formattedDate}</span>
          </div>
        )}
      </div>
    </Link>
  );
}
