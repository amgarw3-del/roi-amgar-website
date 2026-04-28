import { client, queries } from "@/sanity/client";
import DivarToraCard from "@/components/DivarToraCard";
import SubTopicSidebar from "@/components/SubTopicSidebar";
import type { Metadata } from "next";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "דברי תורה — הרב רועי אמגר",
  description: "דברי תורה קצרים וממוקדים לשולחן שבת, לדרשה ולחיי היום יום — הרב רועי אמגר",
};

interface Props {
  searchParams: Promise<{ sub?: string }>;
}

export default async function DivarToraPage({ searchParams }: Props) {
  const { sub } = await searchParams;

  const [subTopics, items] = await Promise.all([
    client.fetch(queries.allSubTopics).catch(() => []),
    sub
      ? client.fetch(queries.divarToraBySubTopic(sub, 24)).catch(() => [])
      : client.fetch(queries.latestDivarTora(24)).catch(() => []),
  ]);

  // מציאת שם תת-הנושא הפעיל לכותרת
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const activeSubTopic = sub ? subTopics.find((st: any) => st.slug?.current === sub) : null;

  return (
    <>
      <section
        className="py-10"
        style={{ background: "linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%)" }}
      >
        <div className="container text-center">
          <h1 className="text-3xl font-bold mb-2" style={{ color: "var(--color-bg-paper)" }}>דברי תורה</h1>
          <p style={{ color: "rgba(250,243,226,0.8)" }}>
            {activeSubTopic
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              ? `דברי תורה על: ${(activeSubTopic as any).hebrewName}`
              : "דברי תורה קצרים וממוקדים — לשולחן שבת, לדרשה, ולחיי היום יום"}
          </p>
        </div>
      </section>

      {/* Mobile: collapsible filter */}
      <div className="md:hidden container pt-4">
        <details className="border rounded-xl overflow-hidden">
          <summary
            className="px-4 py-3 font-semibold cursor-pointer select-none flex items-center justify-between"
            style={{ color: "var(--color-primary)" }}
          >
            <span>סינון לפי נושא{sub ? ` — ${activeSubTopic ? (activeSubTopic as any).hebrewName : sub}` : ""}</span>
            <span className="text-xs text-gray-400">▼</span>
          </summary>
          <div className="px-4 pb-4 pt-2 max-h-72 overflow-y-auto">
            <SubTopicSidebar subTopics={subTopics} activeSub={sub ?? null} />
          </div>
        </details>
      </div>

      <div className="container py-8">
        <div className="flex gap-6" dir="rtl">
          {/* Sidebar — right side (desktop only) */}
          <aside className="hidden md:block flex-none w-52 self-start sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto">
            <SubTopicSidebar subTopics={subTopics} activeSub={sub ?? null} />
          </aside>

          {/* Cards */}
          <div className="flex-1 min-w-0" dir="rtl">
            {items.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {items.map((item: any) => (
                  <DivarToraCard key={item._id} {...item} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 text-gray-400">
                <p className="text-xl mb-2">
                  {sub ? `אין עדיין דברי תורה על ${activeSubTopic ? (activeSubTopic as any).hebrewName : sub}` : "דברי תורה יתווספו בקרוב"}
                </p>
                <p className="text-sm">חזרו שוב בקרוב</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
