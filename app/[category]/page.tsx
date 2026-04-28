import { client, queries } from "@/sanity/client";
import VideoCard from "@/components/VideoCard";
import BlogCard from "@/components/BlogCard";
import DivarToraCard from "@/components/DivarToraCard";
import SubTopicSidebar from "@/components/SubTopicSidebar";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ category: string }>;
}

const categoryMap: Record<string, { hebrewName: string; desc: string }> = {
  parasha: { hebrewName: "פרשת שבוע", desc: "שיעורים וסיכומים לפרשת השבוע" },
  halacha: { hebrewName: "הלכה", desc: "שאלות ותשובות הלכתיות" },
  emuna: { hebrewName: "אמונה", desc: "מחשבה ועומק רוחני" },
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

  const CATEGORY_SUBTOPIC_GROUPS: Record<string, string[]> = {
    parasha: ["parasha"],
    moadim: ["moed", "fast", "national"],
  };

  const subtopicGroups = CATEGORY_SUBTOPIC_GROUPS[category] ?? null;
  const hasSidebar = subtopicGroups !== null;

  const [videos, posts, divarTora, subTopics] = await Promise.all([
    client.fetch(queries.byCategory(category, "video")).catch(() => []),
    client.fetch(queries.byCategory(category, "blogPost")).catch(() => []),
    client.fetch(queries.divarToraByCategory(category)).catch(() => []),
    hasSidebar ? client.fetch(queries.allSubTopics).catch(() => []) : Promise.resolve([]),
  ]);

  const mainContent = (
    <>
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

      {/* דברי תורה */}
      {divarTora.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-bold mb-4" style={{ color: "var(--color-primary)" }}>
            דברי תורה
          </h2>
          <div className="divider mb-5" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {divarTora.map((d: any) => <DivarToraCard key={d._id} {...d} />)}
          </div>
        </section>
      )}

      {videos.length === 0 && posts.length === 0 && divarTora.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">תוכן יתווסף בקרוב לנושא זה</p>
        </div>
      )}
    </>
  );

  const sidebarLabel =
    category === "parasha" ? "ניווט לפי פרשה" : "ניווט לפי נושא";
  const allLabel =
    category === "parasha" ? "כל פרשות השבוע" : `כל ${info.hebrewName}`;
  const allHref = `/${category}`;

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

      {hasSidebar && subTopics.length > 0 ? (
        <>
          {/* Mobile: collapsible filter */}
          <div className="md:hidden container pt-4">
            <details className="border rounded-xl overflow-hidden">
              <summary
                className="px-4 py-3 font-semibold cursor-pointer select-none"
                style={{ color: "var(--color-primary)" }}
              >
                {sidebarLabel}
              </summary>
              <div className="px-4 pb-4 pt-2 max-h-72 overflow-y-auto">
                <SubTopicSidebar
                  subTopics={subTopics}
                  activeSub={null}
                  filterGroups={subtopicGroups!}
                  allHref={allHref}
                  allLabel={allLabel}
                />
              </div>
            </details>
          </div>

          {/* Desktop: sidebar layout */}
          <div className="container py-8">
            <div className="flex gap-6" dir="rtl">
              <aside className="hidden md:block flex-none w-52 self-start sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto">
                <SubTopicSidebar
                  subTopics={subTopics}
                  activeSub={null}
                  filterGroups={subtopicGroups!}
                  allHref={allHref}
                  allLabel={allLabel}
                />
              </aside>
              <div className="flex-1 min-w-0" dir="rtl">
                {mainContent}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="container py-10">
          {mainContent}
        </div>
      )}
    </>
  );
}
