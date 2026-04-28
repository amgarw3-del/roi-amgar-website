import VideoCarousel from "@/components/VideoCarousel";
import { fetchYouTubeVideos } from "@/lib/youtube";
import type { Metadata } from "next";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "שיעורים וחיזוקים בוידאו",
  description: "כל שיעורי הוידאו והחיזוקים הקצרים של הרב רועי אמגר מערוץ היוטיוב",
};

const SHIURIM_CATEGORIES = [
  { label: "הכל", key: "" },
  { label: "פרשת שבוע", key: "פרשת" },
  { label: "אור החיים", key: "אור החיים" },
  { label: "אמונה", key: "אמונה" },
  { label: "הלכה", key: "הלכה" },
  { label: "מועדים", key: "מועד" },
];

const serif = `'Frank Ruhl Libre', var(--font-frank), serif`;

export default async function VideosPage() {
  const [ytLong, ytMedium, ytShorts] = await Promise.all([
    fetchYouTubeVideos(50, "long"),
    fetchYouTubeVideos(50, "medium"),
    fetchYouTubeVideos(50, "short"),
  ]);

  const HALA_KEYWORDS = ["הלכה", "הלכה בהליכה"];
  const ytHala = ytMedium.filter((v) =>
    HALA_KEYWORDS.some((kw) => v.title.includes(kw))
  );

  const ytShiurim = [...ytLong, ...ytMedium].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  const ytShortsAll = [...ytShorts, ...ytHala].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  return (
    <>
      {/* Hero */}
      <section
        className="py-12"
        style={{
          background: "linear-gradient(135deg, var(--color-navy) 0%, var(--color-navy-deep) 100%)",
        }}
      >
        <div className="container text-center">
          <h1
            style={{
              fontFamily: serif,
              fontSize: "36px",
              fontWeight: 700,
              color: "var(--color-bg-paper)",
            }}
          >
            שיעורים וחיזוקים בוידאו
          </h1>
          <p style={{ color: "rgba(250,243,226,0.8)", marginTop: "8px", fontSize: "16px" }}>
            כל שיעורי הוידאו והשורטים מערוץ היוטיוב, עם סינון לפי נושא
          </p>
        </div>
      </section>

      {/* שיעורים מלאים */}
      {ytShiurim.length > 0 && (
        <section className="section" style={{ background: "var(--color-bg-paper)" }}>
          <div className="container">
            <VideoCarousel
              videos={ytShiurim}
              title="שיעורים אחרונים"
              subtitle="שיעורים מלאים מערוץ היוטיוב"
              categories={SHIURIM_CATEGORIES}
            />
          </div>
        </section>
      )}

      {/* שורטים — רואים תורה */}
      {ytShortsAll.length > 0 && (
        <section className="section" style={{ background: "var(--color-navy)" }}>
          <div className="container">
            <VideoCarousel
              videos={ytShortsAll}
              title="רואים תורה"
              subtitle="חיזוקים קצרים ומרוממים"
              isShorts
              dark
            />
          </div>
        </section>
      )}

      {ytShiurim.length === 0 && ytShortsAll.length === 0 && (
        <div className="container py-16 text-center" style={{ color: "var(--color-muted)" }}>
          <p className="text-lg">לא נמצאו סרטונים כרגע. אנא נסו שוב מאוחר יותר.</p>
        </div>
      )}
    </>
  );
}
