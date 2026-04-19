import { client, queries } from "@/sanity/client";
import DivarToraCard from "@/components/DivarToraCard";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "דברי תורה — הרב רועי אמגר",
  description: "דברי תורה קצרים וממוקדים לשולחן שבת, לדרשה ולחיי היום יום — הרב רועי אמגר",
};

const topics = [
  { slug: "parasha", label: "פרשת שבוע" },
  { slug: "halacha", label: "הלכה" },
  { slug: "emuna", label: "אמונה" },
  { slug: "zugiyut", label: "זוגיות" },
  { slug: "moadim", label: "מועדים" },
];

export default async function DivarToraPage() {
  const items = await client.fetch(queries.latestDivarTora(24)).catch(() => []);

  return (
    <>
      <section
        className="py-10"
        style={{ background: "linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%)" }}
      >
        <div className="container text-center">
          <h1 className="text-3xl font-bold text-white mb-2">דברי תורה</h1>
          <p className="text-white/80">
            דברי תורה קצרים וממוקדים — לשולחן שבת, לדרשה, ולחיי היום יום
          </p>
        </div>
      </section>

      <div className="container py-10">
        {/* סינון לפי נושא */}
        <div className="flex flex-wrap gap-2 mb-8" style={{ direction: "rtl" }}>
          <Link
            href="/dvar-tora"
            className="px-4 py-1.5 rounded-full text-sm font-semibold border-2 transition-colors"
            style={{ background: "var(--color-primary)", color: "white", borderColor: "var(--color-primary)" }}
          >
            הכל
          </Link>
          {topics.map((t) => (
            <Link
              key={t.slug}
              href={`/dvar-tora?topic=${t.slug}`}
              className="px-4 py-1.5 rounded-full text-sm font-semibold border-2 transition-colors"
              style={{ background: "white", color: "var(--color-primary)", borderColor: "var(--color-primary)" }}
            >
              {t.label}
            </Link>
          ))}
        </div>

        {items.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {items.map((item: any) => (
              <DivarToraCard key={item._id} {...item} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-gray-400">
            <p className="text-xl mb-2">דברי תורה יתווספו בקרוב</p>
            <p className="text-sm">חזרו שוב בקרוב</p>
          </div>
        )}
      </div>
    </>
  );
}
