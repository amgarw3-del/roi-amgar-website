import { client, queries } from "@/sanity/client";
import Hero from "@/components/Hero";
import VideoCard from "@/components/VideoCard";
import BlogCard from "@/components/BlogCard";
import QnACard from "@/components/QnACard";
import NewsletterSignup from "@/components/NewsletterSignup";
import VideoCarousel from "@/components/VideoCarousel";
import SubscribeBanner from "@/components/SubscribeBanner";
import DonationWidget from "@/components/DonationWidget";
import { fetchYouTubeVideos } from "@/lib/youtube";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const revalidate = 3600; // ISR כל שעה — נתוני YouTube נשמרים 24ש ב-unstable_cache

const categories = [
  { href: "/parasha", label: "פרשת שבוע", emoji: "📖", desc: "שיעורים ודברי תורה לפרשה" },
  { href: "/halacha", label: "הלכה", emoji: "⚖️", desc: "שאלות ותשובות הלכתיות" },
  { href: "/emuna", label: "אמונה", emoji: "✡️", desc: "מחשבה ועומק רוחני" },
  { href: "/zugiyut", label: "זוגיות", emoji: "💑", desc: "שיעורים לזוגיות בריאה" },
  { href: "/rega-shel-tora", label: "רגע של תורה", emoji: "⚡", desc: "סרטונים קצרים ומרוממים" },
  { href: "/moadim", label: "מועדים", emoji: "🕎", desc: "לפי לוח השנה העברי" },
];

const socialLinks = [
  { label: "YouTube", href: "https://www.youtube.com/channel/UCpep2f42VluYwMqZ4kXiQTA" },
  { label: "Instagram", href: "https://instagram.com/harav_roi_amgar" },
  { label: "Facebook", href: "https://facebook.com/share/1ZMNajb5NE" },
  { label: "TikTok", href: "https://tiktok.com/@harav.roi.amgar" },
  { label: "WhatsApp", href: "https://whatsapp.com/channel/0029Vb7F1opJP212dpclkU3d" },
];

const serif = `'Frank Ruhl Libre', var(--font-frank), serif`;

function SectionHeading({ title }: { title: string }) {
  return (
    <div className="section-heading">
      <div className="section-heading-deco">
        <span style={{ color: "var(--color-ochre)", fontSize: "12px" }}>◆</span>
      </div>
      <h2 style={{ fontFamily: serif, fontSize: "28px", fontWeight: 700, color: "var(--color-navy)" }}>
        {title}
      </h2>
    </div>
  );
}

export default async function HomePage() {
  const [videos, posts, qnas, ytLong, ytMedium, ytShorts] = await Promise.all([
    client.fetch(queries.latestVideos(6)).catch(() => []),
    client.fetch(queries.latestPosts(4)).catch(() => []),
    client.fetch(queries.latestQna(3)).catch(() => []),
    fetchYouTubeVideos(50, "long"),
    fetchYouTubeVideos(50, "medium"),
    fetchYouTubeVideos(50, "short"),
  ]);

  const ytShiurim = [...ytLong, ...ytMedium].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  const HALA_KEYWORDS = ["הלכה", "הלכה בהליכה"];
  const ytHala = ytMedium.filter((v) =>
    HALA_KEYWORDS.some((kw) => v.title.includes(kw))
  );
  const ytShortsAll = [...ytShorts, ...ytHala].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  return (
    <>
      <Hero />
      <DonationWidget />
      <SubscribeBanner />

      {/* נושאי לימוד */}
      <section className="section" style={{ background: "var(--color-bg-cream)" }}>
        <div className="container">
          <SectionHeading title="נושאי לימוד" />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {categories.map((cat) => (
              <Link
                key={cat.href}
                href={cat.href}
                className="card group"
                style={{
                  padding: "28px 24px",
                  position: "relative",
                  display: "block",
                  textDecoration: "none",
                  overflow: "visible",
                }}
              >
                {/* פינת זהב אלכסונית */}
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    right: 0,
                    width: 0,
                    height: 0,
                    borderStyle: "solid",
                    borderWidth: "0 34px 34px 0",
                    borderColor: `transparent var(--color-ochre) transparent transparent`,
                    opacity: 0.35,
                  }}
                />

                {/* אייקון */}
                <div
                  style={{
                    width: "56px",
                    height: "56px",
                    background: "var(--color-navy)",
                    borderRadius: "10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "16px",
                    fontSize: "26px",
                  }}
                >
                  {cat.emoji}
                </div>

                {/* כותרת */}
                <h3
                  style={{
                    fontFamily: serif,
                    fontSize: "22px",
                    fontWeight: 700,
                    color: "var(--color-navy)",
                    marginBottom: "8px",
                  }}
                >
                  {cat.label}
                </h3>

                {/* תיאור */}
                <p
                  style={{
                    fontSize: "14px",
                    color: "var(--color-muted)",
                    marginBottom: "16px",
                    lineHeight: 1.6,
                  }}
                >
                  {cat.desc}
                </p>

                {/* קישור */}
                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "var(--color-ochre)",
                  }}
                >
                  למידה →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* שיעורים מיוטיוב */}
      {ytShiurim.length > 0 && (
        <section className="section" style={{ background: "var(--color-bg-paper)" }}>
          <div className="container">
            <VideoCarousel videos={ytShiurim} title="שיעורים אחרונים" />
          </div>
        </section>
      )}

      {/* רגע של תורה — רקע כהה */}
      {ytShortsAll.length > 0 && (
        <section className="section" style={{ background: "var(--color-navy)" }}>
          <div className="container">
            <VideoCarousel videos={ytShortsAll} title="רגע של תורה" isShorts dark />
          </div>
        </section>
      )}

      {/* ניוזלטר */}
      <NewsletterSignup />

      {/* פוסטים אחרונים */}
      {posts.length > 0 && (
        <section className="section" style={{ background: "var(--color-bg-paper)" }}>
          <div className="container">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 style={{ fontFamily: serif, fontSize: "26px", fontWeight: 700, color: "var(--color-navy)" }}>
                  מאמרים ודברי תורה
                </h2>
                <div className="divider" />
              </div>
              <Link
                href="/blog"
                className="flex items-center gap-1 font-semibold text-sm"
                style={{ color: "var(--color-ochre)" }}
              >
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

      {/* fallback שיעורים מ-Sanity */}
      {ytShiurim.length === 0 && videos.length > 0 && (
        <section className="section" style={{ background: "var(--color-bg-paper)" }}>
          <div className="container">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 style={{ fontFamily: serif, fontSize: "26px", fontWeight: 700, color: "var(--color-navy)" }}>
                  שיעורים אחרונים
                </h2>
                <div className="divider" />
              </div>
              <Link
                href="/shiurim"
                className="flex items-center gap-1 font-semibold text-sm"
                style={{ color: "var(--color-ochre)" }}
              >
                לכל השיעורים <ArrowLeft size={16} />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {videos.map((v: any) => <VideoCard key={v._id} {...v} />)}
            </div>
          </div>
        </section>
      )}

      {/* שאל את הרב */}
      <section className="section" style={{ background: "var(--color-bg-cream)" }}>
        <div className="container">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 style={{ fontFamily: serif, fontSize: "26px", fontWeight: 700, color: "var(--color-navy)" }}>
                שאלות ותשובות
              </h2>
              <div className="divider" />
            </div>
            <Link
              href="/shaal"
              className="flex items-center gap-1 font-semibold text-sm"
              style={{ color: "var(--color-ochre)" }}
            >
              לכל השו&quot;ת <ArrowLeft size={16} />
            </Link>
          </div>
          {qnas.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {qnas.map((q: any) => <QnACard key={q._id} {...q} />)}
            </div>
          ) : (
            <p className="text-center py-4 mb-6" style={{ color: "var(--color-muted)" }}>
              שאלות ותשובות יתווספו בקרוב
            </p>
          )}
          <div className="text-center">
            <Link href="/shaal" className="btn-primary">שאל את הרב שאלה</Link>
          </div>
        </div>
      </section>

      {/* רשתות חברתיות */}
      <section
        className="py-10"
        style={{ background: "var(--color-bg-paper)", borderTop: "1px solid var(--color-line-light)" }}
      >
        <div className="container">
          <p
            className="text-center font-semibold mb-5"
            style={{ color: "var(--color-navy)", fontSize: "16px" }}
          >
            עקבו אחרינו ברשתות החברתיות
          </p>
          <div className="flex justify-center gap-3 flex-wrap">
            {socialLinks.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 font-semibold text-sm transition-colors"
                style={{
                  padding: "8px 20px",
                  borderRadius: "999px",
                  border: "1.5px solid var(--color-line)",
                  color: "var(--color-navy)",
                  background: "white",
                }}
              >
                {s.label}
              </a>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
