import Link from "next/link";
import type { ChatSource } from "./types";

const TYPE_ACCENT: Record<string, string> = {
  video: "rgba(168, 30, 50, 0.85)",      // ruby/rose
  divarTora: "var(--color-ochre)",        // ochre
  blogPost: "var(--color-navy)",          // navy
  qna: "rgba(46, 125, 90, 0.85)",         // emerald
};

export default function SourceCard({ source }: { source: ChatSource }) {
  const accent = TYPE_ACCENT[source.type] ?? "var(--color-muted)";
  return (
    <Link
      href={source.url}
      className="block rounded-xl p-3 transition-all group"
      style={{
        background: "var(--color-bg-card)",
        border: "1px solid var(--color-line-light)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--color-ochre)";
        e.currentTarget.style.transform = "translateY(-1px)";
        e.currentTarget.style.boxShadow = "0 4px 14px rgba(15, 23, 41, 0.08)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--color-line-light)";
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <div className="flex items-start gap-2.5">
        <span
          className="shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold"
          style={{
            background: "var(--color-bg-cream)",
            color: "var(--color-navy)",
            border: "1px solid var(--color-line)",
          }}
        >
          {source.id}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span
              className="inline-flex items-center text-[10px] px-2 py-0.5 rounded-full font-semibold"
              style={{
                background: "rgba(255,255,255,0.6)",
                color: accent,
                border: `1px solid ${accent}`,
              }}
            >
              {source.typeLabel}
            </span>
            {source.category && (
              <span className="text-[10px]" style={{ color: "var(--color-muted)" }}>
                · {source.category}
              </span>
            )}
          </div>
          <div
            className="text-sm font-medium line-clamp-2 leading-snug"
            style={{ color: "var(--color-ink-body)" }}
          >
            {source.title}
          </div>
        </div>
        <svg
          viewBox="0 0 20 20"
          fill="none"
          className="shrink-0 w-4 h-4 mt-0.5 opacity-50 group-hover:opacity-100 transition-opacity"
          style={{ color: "var(--color-ochre)", transform: "scaleX(-1)" }}
          aria-hidden
        >
          <path d="M7 5l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </Link>
  );
}
