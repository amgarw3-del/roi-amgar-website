import Link from "next/link";
import type { ChatSource } from "./types";

const TYPE_ACCENT: Record<string, string> = {
  video: "rgba(168, 30, 50, 0.85)",
  divarTora: "var(--color-ochre)",
  blogPost: "var(--color-navy)",
  qna: "rgba(46, 125, 90, 0.85)",
  youtube: "rgba(220, 50, 50, 0.85)",       // YouTube red
  youtubeShort: "rgba(220, 50, 50, 0.85)",
  lecture: "rgba(120, 50, 160, 0.85)",
  pdfSummary: "rgba(40, 100, 140, 0.85)",
  service: "var(--color-ochre)",
};

// CTA copy + URL pattern for the 4 virtual service docs surfaced by the bot.
const SERVICE_CTA: Record<string, { emoji: string; label: string }> = {
  "/hupot":     { emoji: "💍", label: "לתיאום עריכת חופה" },
  "/lectures":  { emoji: "🎤", label: "להזמנת הרצאה" },
  "/shaal":     { emoji: "✉️", label: "שאל שאלה לרב" },
  "/sikkumim":  { emoji: "📥", label: "להורדת הסיכומים" },
};

function YouTubeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" aria-hidden>
      <path
        d="M23 7s-.2-1.6-.9-2.3c-.8-.9-1.7-.9-2.1-1C16.9 3.5 12 3.5 12 3.5s-4.9 0-7.9.2c-.4 0-1.3 0-2.1 1C1.2 5.4 1 7 1 7S.8 8.9.8 10.8v1.6c0 1.9.2 3.8.2 3.8s.2 1.6.9 2.3c.8.9 1.9.8 2.4.9 1.7.2 7.7.2 7.7.2s4.9 0 7.9-.3c.4-.1 1.3-.1 2.1-1 .7-.7.9-2.3.9-2.3s.2-1.9.2-3.8v-1.6c0-1.9-.2-3.8-.2-3.8z"
        fill="currentColor"
      />
      <path d="M9.7 14.5V8.3l5.4 3.1-5.4 3.1z" fill="white" />
    </svg>
  );
}

export default function SourceCard({ source }: { source: ChatSource }) {
  const accent = TYPE_ACCENT[source.type] ?? "var(--color-muted)";
  const isYoutube = source.type === "youtube" || source.type === "youtubeShort";
  const isService = source.type === "service";

  // Render a prominent CTA card for virtual service docs (hupot/lectures/shaal/sikkumim).
  if (isService) {
    const cta = SERVICE_CTA[source.url] ?? { emoji: "→", label: "עבור לדף" };
    return (
      <Link
        id={`source-${source.id}`}
        href={source.url}
        className="block rounded-xl p-4 transition-all group"
        style={{
          background:
            "linear-gradient(135deg, rgba(168, 106, 44, 0.12) 0%, rgba(168, 106, 44, 0.05) 100%)",
          border: "2px solid var(--color-ochre)",
          boxShadow: "0 2px 8px rgba(168, 106, 44, 0.15)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.boxShadow = "0 8px 22px rgba(168, 106, 44, 0.28)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "0 2px 8px rgba(168, 106, 44, 0.15)";
        }}
      >
        <div className="flex items-center gap-3">
          <span
            className="shrink-0 text-2xl"
            aria-hidden
            style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.1))" }}
          >
            {cta.emoji}
          </span>
          <div className="flex-1 min-w-0">
            <div
              className="text-sm font-bold mb-0.5"
              style={{ color: "var(--color-navy)" }}
            >
              {source.title}
            </div>
            <div
              className="text-xs font-semibold"
              style={{ color: "var(--color-ochre-dark, #8a5520)" }}
            >
              {cta.label} ←
            </div>
          </div>
        </div>
      </Link>
    );
  }

  const content = (
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
            className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold"
            style={{
              background: "rgba(255,255,255,0.6)",
              color: accent,
              border: `1px solid ${accent}`,
            }}
          >
            {isYoutube && <YouTubeIcon />}
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
  );

  const cardClass = "block rounded-xl p-3 transition-all group";
  const cardStyle: React.CSSProperties = {
    background: "var(--color-bg-card)",
    border: "1px solid var(--color-line-light)",
  };
  const onEnter = (e: React.MouseEvent<HTMLElement>) => {
    e.currentTarget.style.borderColor = "var(--color-ochre)";
    e.currentTarget.style.transform = "translateY(-1px)";
    e.currentTarget.style.boxShadow = "0 4px 14px rgba(15, 23, 41, 0.08)";
  };
  const onLeave = (e: React.MouseEvent<HTMLElement>) => {
    e.currentTarget.style.borderColor = "var(--color-line-light)";
    e.currentTarget.style.transform = "translateY(0)";
    e.currentTarget.style.boxShadow = "none";
  };

  if (source.external) {
    return (
      <a
        id={`source-${source.id}`}
        href={source.url}
        target="_blank"
        rel="noopener noreferrer"
        className={cardClass}
        style={cardStyle}
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
      >
        {content}
      </a>
    );
  }

  return (
    <Link
      id={`source-${source.id}`}
      href={source.url}
      className={cardClass}
      style={cardStyle}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      {content}
    </Link>
  );
}
