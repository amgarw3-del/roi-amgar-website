import { client, queries } from "@/sanity/client";
import Hero from "@/components/Hero";
import VideoCard from "@/components/VideoCard";
import BlogCard from "@/components/BlogCard";
import QnACard from "@/components/QnACard";
import NewsletterSignup from "@/components/NewsletterSignup";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const revalidate = 3600; // ISR every hour

const categories = [
  { href: "/parasha", label: "פרשת שבוע", emoji: "📖", desc: "שיעורים ודברי תורה לפרשה" },
  { href: "/halacha", label: "הלכה", emoji: "⚖️", desc: "שאלות ותשובות הלכתיות" },
  { href: "/emuna", label: "אמונה", emoji: "✡️", desc: "מחשבה ועומק רוחני" },
  { href: "/zugiyut", label: "זוגיות", emoji: "💑", desc: "שיעורים לזוגיות בריאה" },
  { href: "/rega-shel-tora", label: "רגע של תורה", emoji: "⚡", desc: "סרטונים קצרים ומרוממים" },
  { href: "/moadim", label: "מועדים", emoji: "🕎", desc: "לפי לוח השנה העברי" },
];

const socialLinks = [
  { label: "YouTube", emoji: "▶️", href: "https://youtube.com/@roiamgar" },
  { label: "Instagram", emoji: "📸", href: "https://instagram.com/roiamgar" },
  { label: "Facebook", emoji: "👥", href: "https://facebook.com/roiamgar" },
  { label: "TikTok", emoji: "🎵", href: "https://tiktok.com/@roiamgar" },
];

export default async function HomePage() {
  const [videos, posts, qnas] = await Promise.all([
    client.fetch(queries.latestVideos(6)).catch(() => []),
    client.fetch(queries.latestPosts(4)).catch(() => []),
    client.fetch(queries.latestQna(3)).catch(() => []),
  ]);

  return (
    <>
      <Hero />

      {/* קטגוריות */}
      <section className="section" style={{ background: "var(--color-warm)" }}>
        <div className="container">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold" style={{ color: "var(--color-primary)" }}>
              נושאי לימוד
            </h2>
            <div className="divider mx-auto" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {categories.map((cat) => (
              <Link key={cat.href} href={cat.href} className="card p-5 text-center group">
                <div className="text-3xl mb-2">{cat.emoji}</div>
                <h3 className="font-bold text-lg mb-1" style={{ color: "var(--color-primary)" }}>
                  {cat.label}
                </h3>
                <p className="text-gray-500 text-sm">{cat.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* שיעורים אחרונים */}
      <section className="section">
        <div className="container">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold" style={{ color: "var(--color-primary)" }}>
                שיעורים אחרונים
              </h2>
              <div className="divider" />
            </div>
            <Link href="/shiurim" className="flex items-center gap-1 font-semibold text-sm" style={{ color: "var(--color-primary)" }}>
              לכל השיעורים <ArrowLeft size={16} />
            </Link>
          </div>
          {videos.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {videos.map((v: any) => <VideoCard key={v._id} {...v} />)}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-8">שיעורים יתווספו בקרוב</p>
          )}
        </div>
      </section>

      {/* ניוזלטר */}
      <NewsletterSignup />

      {/* פוסטים אחרונים */}
      {posts.length > 0 && (
        <section className="section">
          <div className="container">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold" style={{ color: "var(--color-primary)" }}>
                  מאמרים ודברי תורה
                </h2>
                <div className="divider" />
              </div>
              <Link href="/blog" className="flex items-center gap-1 font-semibold text-sm" style={{ color: "var(--color-primary)" }}>
                לכל המאמרים <ArrowLeft size={16} />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {posts.map((p: any) => <BlogCard key={p._id} {...p} />)}
            </div>
          </div>
        </section>
      )}

      {/* שאל את הרב */}
      <section className="section" style={{ background: "var(--color-warm)" }}>
        <div className="container">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold" style={{ color: "var(--color-primary)" }}>
                שאלות ותשובות
              </h2>
              <div className="divider" />
            </div>
            <Link href="/shaal" className="flex items-center gap-1 font-semibold text-sm" style={{ color: "var(--color-primary)" }}>
              לכל השו"ת <ArrowLeft size={16} />
            </Link>
          </div>
          {qnas.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {qnas.map((q: any) => <QnACard key={q._id} {...q} />)}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-4 mb-6">שאלות ותשובות יתווספו בקרוב</p>
          )}
          <div className="text-center">
            <Link href="/shaal" className="btn-primary">שאל את הרב שאלה</Link>
          </div>
        </div>
      </section>

      {/* רשתות חברתיות */}
      <section className="py-8 border-t border-gray-100">
        <div className="container">
          <p className="text-center font-semibold mb-4" style={{ color: "var(--color-primary)" }}>
            עקוב אחרינו ברשתות החברתיות
          </p>
          <div className="flex justify-center gap-3 flex-wrap">
            {socialLinks.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-full border-2 border-gray-200 hover:border-gray-400 transition-colors text-sm font-medium"
              >
                <span>{s.emoji}</span> {s.label}
              </a>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
