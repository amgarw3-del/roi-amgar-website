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
  {
    label: "YouTube",
    href: "https://www.youtube.com/channel/UCpep2f42VluYwMqZ4kXiQTA",
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="#FF0000">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
    ),
  },
  {
    label: "Instagram",
    href: "https://instagram.com/harav_roi_amgar",
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="url(#ig-gradient)">
        <defs>
          <linearGradient id="ig-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f09433"/>
            <stop offset="25%" stopColor="#e6683c"/>
            <stop offset="50%" stopColor="#dc2743"/>
            <stop offset="75%" stopColor="#cc2366"/>
            <stop offset="100%" stopColor="#bc1888"/>
          </linearGradient>
        </defs>
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
      </svg>
    ),
  },
  {
    label: "Facebook",
    href: "https://facebook.com/share/1ZMNajb5NE",
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="#1877F2">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
  },
  {
    label: "TikTok",
    href: "https://tiktok.com/@harav.roi.amgar",
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="#000000">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z"/>
      </svg>
    ),
  },
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
                {s.icon} {s.label}
              </a>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
