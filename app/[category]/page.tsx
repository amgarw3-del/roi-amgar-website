import { client, queries } from "@/sanity/client";
import VideoCard from "@/components/VideoCard";
import BlogCard from "@/components/BlogCard";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ category: string }>;
}

const categoryMap: Record<string, { hebrewName: string; desc: string }> = {
  parasha: { hebrewName: "פרשת שבוע", desc: "שיעורים וסיכומים לפרשת השבוע" },
  halacha: { hebrewName: "הלכה", desc: "שאלות ותשובות הלכתיות" },
  emuna: { hebrewName: "אמונה", desc: "מחשבה ועומק רוחני" },
  zugiyut: { hebrewName: "זוגיות", desc: "שיעורים ומאמרים לזוגיות בריאה" },
  "rega-shel-tora": { hebrewName: "רגע של תורה", desc: "סרטונים קצרים ומרוממים" },
  moadim: { hebrewName: "מועדים", desc: "שיעורים לחגים ומועדי ישראל" },
  shiurim: { hebrewName: "כל השיעורים", desc: "כל שיעורי הרב רועי אמגר" },
  blog: { hebrewName: "מאמרים", desc: "דברי תורה ומחשבה" },
  categories: { hebrewName: "נושאים", desc: "כל הנושאים" },
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  const info = categoryMap[category];
  if (!info) return { title: "נושא לא נמצא" };
  return {
    title: info.hebrewName,
    description: `${info.desc} — הרב רועי אמגר`,
  };
}

export default async function CategoryPage({ params }: Props) {
  const { category } = await params;
  const info = categoryMap[category];
  if (!info) notFound();

  const [videos, posts] = await Promise.all([
    client.fetch(queries.byCategory(category, "video")).catch(() => []),
    client.fetch(queries.byCategory(category, "blogPost")).catch(() => []),
  ]);

  return (
    <>
      {/* Header */}
      <section
        className="py-10"
        style={{ background: "linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%)" }}
      >
        <div className="container text-center">
          <h1 className="text-3xl font-bold text-white">{info.hebrewName}</h1>
          <p className="text-white/80 mt-2">{info.desc}</p>
        </div>
      </section>

      <div className="container py-10">
        {/* שיעורים */}
        {videos.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl font-bold mb-4" style={{ color: "var(--color-primary)" }}>
              שיעורים
            </h2>
            <div className="divider mb-5" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {videos.map((v: any) => <VideoCard key={v._id} {...v} />)}
            </div>
          </section>
        )}

        {/* מאמרים */}
        {posts.length > 0 && (
          <section>
            <h2 className="text-xl font-bold mb-4" style={{ color: "var(--color-primary)" }}>
              מאמרים ודברי תורה
            </h2>
            <div className="divider mb-5" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {posts.map((p: any) => <BlogCard key={p._id} {...p} />)}
            </div>
          </section>
        )}

        {videos.length === 0 && posts.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg">תוכן יתווסף בקרוב לנושא זה</p>
          </div>
        )}
      </div>
    </>
  );
}
