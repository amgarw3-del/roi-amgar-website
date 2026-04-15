import Link from "next/link";
import { ArrowLeft, MessageCircleQuestion, BookOpen } from "lucide-react";

const categories = [
  { href: "/parasha", label: "פרשת שבוע", emoji: "📖" },
  { href: "/halacha", label: "הלכה", emoji: "⚖️" },
  { href: "/zugiyut", label: "זוגיות", emoji: "💑" },
];

export default function Hero() {
  return (
    <section
      className="relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%)" }}
    >
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute top-10 left-10 w-64 h-64 rounded-full"
          style={{ background: "var(--color-accent)" }}
        />
        <div
          className="absolute bottom-0 right-20 w-48 h-48 rounded-full"
          style={{ background: "var(--color-primary-dark)" }}
        />
      </div>

      <div className="container relative py-16 md:py-24">
        <div className="flex flex-col md:flex-row items-center gap-10">
          {/* Text */}
          <div className="flex-1 text-center md:text-right">
            <p
              className="text-sm font-bold tracking-widest uppercase mb-4 opacity-80"
              style={{ color: "var(--color-accent-light)" }}
            >
              תורה לחיים
            </p>
            <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-4">
              הרב רועי אמגר
            </h1>
            <p className="text-xl text-white/80 mb-8 max-w-lg leading-relaxed">
              שיעורי תורה, הלכה, אמונה וזוגיות — מתמלל חיים של אמת לחיים של יהדות
            </p>

            <div className="flex flex-wrap gap-3 justify-center md:justify-start">
              <Link
                href="/shiurim"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-all hover:-translate-y-0.5"
                style={{ background: "white", color: "var(--color-primary)" }}
              >
                <BookOpen size={18} />
                לשיעורים
              </Link>
              <Link
                href="/shaal"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold border-2 border-white text-white transition-all hover:bg-white/20"
              >
                <MessageCircleQuestion size={18} />
                שאל את הרב
              </Link>
            </div>

            {/* Quick category links */}
            <div className="mt-8 flex flex-wrap gap-3 justify-center md:justify-start">
              {categories.map((cat) => (
                <Link
                  key={cat.href}
                  href={cat.href}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 text-white hover:bg-white/25 transition-colors text-sm font-medium"
                >
                  <span>{cat.emoji}</span>
                  {cat.label}
                  <ArrowLeft size={14} />
                </Link>
              ))}
            </div>
          </div>

          {/* Image placeholder */}
          <div className="flex-shrink-0">
            <div
              className="w-48 h-48 md:w-64 md:h-64 rounded-full border-4 border-white/30 overflow-hidden flex items-center justify-center text-6xl"
              style={{ background: "var(--color-primary-dark)" }}
            >
              👨‍🏫
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
