import { client, queries } from "@/sanity/client";
import Hero from "@/components/Hero";
import VideoCard from "@/components/VideoCard";
import BlogCard from "@/components/BlogCard";
import DivarToraCard from "@/components/DivarToraCard";
import QnACard from "@/components/QnACard";
import VideoCarousel from "@/components/VideoCarousel";
import SubscribeBanner from "@/components/SubscribeBanner";
import DonationWidget from "@/components/DonationWidget";
import LecturesStrip from "@/components/home/LecturesStrip";
import { fetchYouTubeVideos } from "@/lib/youtube";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const revalidate = 3600; // ISR כל שעה — נתוני YouTube נשמרים 24ש ב-unstable_cache

const categories = [
  { href: "/parasha", label: "פרשת שבוע", emoji: "📖", desc: "שיעורים ודברי תורה לפרשה" },
  { href: "/shaal", label: "הלכה", emoji: "⚖️", desc: "שאלות ותשובות הלכתיות" },
  { href: "/emuna", label: "אמונה", emoji: "✡️", desc: "מחשבה ועומק רוחני" },
  { href: "/videos", label: "רואים תורה", emoji: "⚡", desc: "לשיעורים וחיזוקים בוידאו" },
  { href: "/moadim", label: "מועדים", emoji: "🕎", desc: "לפי לוח השנה העברי" },
];

const socialLinks = [
  {
    label: "YouTube", href: "https://www.youtube.com/channel/UCpep2f42VluYwMqZ4kXiQTA",
    icon: <svg role="img" viewBox="0 0 24 24" width="18" height="18" fill="#FF0000" xmlns="http://www.w3.org/2000/svg"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>,
  },
  {
    label: "Instagram", href: "https://instagram.com/harav_roi_amgar",
    icon: <svg role="img" viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="ig-grad" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stopColor="#feda75"/><stop offset="30%" stopColor="#fa7e1e"/><stop offset="60%" stopColor="#d62976"/><stop offset="80%" stopColor="#962fbf"/><stop offset="100%" stopColor="#4f5bd5"/></linearGradient></defs><path fill="url(#ig-grad)" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>,
  },
  {
    label: "Facebook", href: "https://facebook.com/share/1ZMNajb5NE",
    icon: <svg role="img" viewBox="0 0 24 24" width="18" height="18" fill="#1877F2" xmlns="http://www.w3.org/2000/svg"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>,
  },
  {
    label: "TikTok", href: "https://tiktok.com/@harav.roi.amgar",
    icon: <svg role="img" viewBox="0 0 24 24" width="18" height="18" fill="#000000" xmlns="http://www.w3.org/2000/svg"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>,
  },
  {
    label: "WhatsApp", href: "https://whatsapp.com/channel/0029Vb7F1opJP212dpclkU3d",
    icon: <svg role="img" viewBox="0 0 24 24" width="18" height="18" fill="#25D366" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>,
  },
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

const DEFAULT_BLOCKS = [
  "hero", "donation", "subscribe", "categories", "videos", "shorts",
  "lecturesStrip", "divreiTora", "blog", "qna", "social",
];

interface HomepageDoc {
  heroTitle?: string;
  heroSubtitle?: string;
  heroCtaLabel?: string;
  heroCtaHref?: string;
  heroImageUrl?: string | null;
  blocks?: { type: string; enabled?: boolean }[];
}

export default async function HomePage() {
  const [videos, posts, divreiTora, qnas, ytLong, ytMedium, ytShorts, homepage] = await Promise.all([
    client.fetch(queries.latestVideos(6)).catch(() => []),
    client.fetch(queries.latestPosts(4)).catch(() => []),
    client.fetch(queries.latestDivarTora(6)).catch(() => []),
    client.fetch(queries.latestQna(3)).catch(() => []),
    fetchYouTubeVideos(50, "long"),
    fetchYouTubeVideos(50, "medium"),
    fetchYouTubeVideos(50, "short"),
    client.fetch<HomepageDoc | null>(
      `*[_id == "homepage-singleton"][0]{
        heroTitle, heroSubtitle, heroCtaLabel, heroCtaHref,
        "heroImageUrl": heroImage.asset->url,
        blocks
      }`
    ).catch(() => null),
  ]);

  const orderedBlocks = (homepage?.blocks && homepage.blocks.length > 0
    ? homepage.blocks
    : DEFAULT_BLOCKS.map((t) => ({ type: t, enabled: true })))
    .filter((b) => b.enabled !== false)
    .map((b) => b.type);

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

  const blockMap: Record<string, React.ReactNode> = {
    hero: (
      <Hero
        title={homepage?.heroTitle || undefined}
        subtitle={homepage?.heroSubtitle || undefined}
        imageUrl={homepage?.heroImageUrl || undefined}
        ctaLabel={homepage?.heroCtaLabel || undefined}
        ctaHref={homepage?.heroCtaHref || undefined}
      />
    ),
    donation: <DonationWidget />,
    subscribe: <SubscribeBanner />,
    lecturesStrip: <LecturesStrip />,
    categories: (
      <section className="section" style={{ background: "var(--color-bg-cream)" }}>
        <div className="container">
          <SectionHeading title="נושאי לימוד" />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {categories.map((cat) => (
              <Link
                key={cat.href}
                href={cat.href}
                className="card group"
                style={{ padding: "28px 24px", position: "relative", display: "block", textDecoration: "none", overflow: "visible" }}
              >
                <div style={{ position: "absolute", top: 0, right: 0, width: 0, height: 0, borderStyle: "solid", borderWidth: "0 34px 34px 0", borderColor: `transparent var(--color-ochre) transparent transparent`, opacity: 0.35 }} />
                <div style={{ width: "56px", height: "56px", background: "var(--color-navy)", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px", fontSize: "26px" }}>
                  {cat.emoji}
                </div>
                <h3 style={{ fontFamily: serif, fontSize: "22px", fontWeight: 700, color: "var(--color-navy)", marginBottom: "8px" }}>
                  {cat.label}
                </h3>
                <p style={{ fontSize: "14px", color: "var(--color-muted)", marginBottom: "16px", lineHeight: 1.6 }}>
                  {cat.desc}
                </p>
                <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-ochre)" }}>
                  למידה →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    ),
    videos: ytShiurim.length > 0 ? (
      <section className="section" style={{ background: "var(--color-bg-paper)" }}>
        <div className="container">
          <VideoCarousel videos={ytShiurim} title="שיעורים אחרונים" />
        </div>
      </section>
    ) : videos.length > 0 ? (
      <section className="section" style={{ background: "var(--color-bg-paper)" }}>
        <div className="container">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 style={{ fontFamily: serif, fontSize: "26px", fontWeight: 700, color: "var(--color-navy)" }}>
                שיעורים אחרונים
              </h2>
              <div className="divider" />
            </div>
            <Link href="/shiurim" className="flex items-center gap-1 font-semibold text-sm" style={{ color: "var(--color-ochre)" }}>
              לכל השיעורים <ArrowLeft size={16} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {videos.map((v: any) => <VideoCard key={v._id} {...v} />)}
          </div>
        </div>
      </section>
    ) : null,
    shorts: ytShortsAll.length > 0 ? (
      <section className="section" style={{ background: "var(--color-navy)" }}>
        <div className="container">
          <VideoCarousel videos={ytShortsAll} title="רואים תורה" subtitle="לשיעורים וחיזוקים בוידאו" isShorts dark />
        </div>
      </section>
    ) : null,
    divreiTora: divreiTora.length > 0 ? (
      <section className="section" style={{ background: "var(--color-bg-cream)" }}>
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 style={{ fontFamily: serif, fontSize: "26px", fontWeight: 700, color: "var(--color-navy)" }}>
                דברי תורה
              </h2>
              <div className="divider" />
            </div>
            <Link href="/dvar-tora" className="flex items-center gap-1 font-semibold text-sm" style={{ color: "var(--color-ochre)" }}>
              לכל דברי התורה <ArrowLeft size={16} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {divreiTora.map((d: any) => <DivarToraCard key={d._id} {...d} />)}
          </div>
        </div>
      </section>
    ) : null,
    blog: posts.length > 0 ? (
      <section className="section" style={{ background: "var(--color-bg-paper)" }}>
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 style={{ fontFamily: serif, fontSize: "26px", fontWeight: 700, color: "var(--color-navy)" }}>
                מאמרים ודברי תורה
              </h2>
              <div className="divider" />
            </div>
            <Link href="/blog" className="flex items-center gap-1 font-semibold text-sm" style={{ color: "var(--color-ochre)" }}>
              לכל המאמרים <ArrowLeft size={16} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {posts.map((p: any) => <BlogCard key={p._id} {...p} />)}
          </div>
        </div>
      </section>
    ) : null,
    qna: (
      <section className="section" style={{ background: "var(--color-bg-cream)" }}>
        <div className="container">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 style={{ fontFamily: serif, fontSize: "26px", fontWeight: 700, color: "var(--color-navy)" }}>
                שאלות ותשובות
              </h2>
              <div className="divider" />
            </div>
            <Link href="/shaal" className="flex items-center gap-1 font-semibold text-sm" style={{ color: "var(--color-ochre)" }}>
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
    ),
    social: (
      <section className="py-10" style={{ background: "var(--color-bg-paper)", borderTop: "1px solid var(--color-line-light)" }}>
        <div className="container">
          <p className="text-center font-semibold mb-5" style={{ color: "var(--color-navy)", fontSize: "16px" }}>
            עקבו אחרינו ברשתות החברתיות
          </p>
          <div className="flex justify-center gap-3 flex-wrap">
            {socialLinks.map((s) => (
              <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 font-semibold text-sm transition-colors" style={{ padding: "8px 20px", borderRadius: "999px", border: "1.5px solid var(--color-line)", color: "var(--color-navy)", background: "white" }}>
                {s.icon}{s.label}
              </a>
            ))}
          </div>
        </div>
      </section>
    ),
  };

  return (
    <>
      {orderedBlocks.map((type, i) => {
        const node = blockMap[type];
        return node ? <div key={`${type}-${i}`}>{node}</div> : null;
      })}
    </>
  );
}
