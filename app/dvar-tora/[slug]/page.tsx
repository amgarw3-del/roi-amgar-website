import { client, queries } from "@/sanity/client";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";

interface Props {
  params: Promise<{ slug: string }>;
}

export const revalidate = 3600;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const item = await client.fetch(queries.divarToraBySlug(slug)).catch(() => null);
  if (!item) return { title: "לא נמצא" };
  return {
    title: `${item.title} — הרב רועי אמגר`,
    description: item.teaser ?? "",
  };
}

export default async function DivarToraSlugPage({ params }: Props) {
  const { slug } = await params;
  const item = await client.fetch(queries.divarToraBySlug(slug)).catch(() => null);
  if (!item) notFound();

  const date = item.publishedAt
    ? new Date(item.publishedAt).toLocaleDateString("he-IL", { day: "numeric", month: "long", year: "numeric" })
    : null;

  return (
    <div className="container py-10 max-w-2xl">
      {/* חזרה */}
      <Link
        href="/dvar-tora"
        className="inline-flex items-center gap-1 text-sm font-semibold mb-6"
        style={{ color: "var(--color-primary)" }}
      >
        <ArrowRight size={16} />
        כל דברי התורה
      </Link>

      {/* כותרת */}
      <div className="mb-6">
        {item.category && (
          <span className="badge mb-3 inline-block">{item.category.hebrewName}</span>
        )}
        <h1 className="text-3xl font-bold leading-snug mb-2" style={{ color: "var(--color-primary)" }}>
          {item.title}
        </h1>
        {date && <p className="text-sm text-gray-400">{item.hebrewDate ?? date}</p>}
      </div>

      <div className="divider" />

      {/* תקציר */}
      {item.teaser && (
        <p
          className="text-lg font-semibold leading-relaxed my-6 pr-4 border-r-4"
          style={{ color: "var(--color-primary)", borderColor: "var(--color-accent)" }}
        >
          {item.teaser}
        </p>
      )}

      {/* תוכן */}
      <div className="prose-hebrew whitespace-pre-line leading-loose text-gray-800">
        {item.content}
      </div>

      {/* שיתוף */}
      <div className="mt-10 pt-6 border-t border-gray-100 flex items-center gap-3">
        <BookOpen size={18} style={{ color: "var(--color-accent)" }} />
        <p className="text-sm text-gray-500">
          הרב רועי אמגר —{" "}
          <Link href="/dvar-tora" className="underline" style={{ color: "var(--color-primary)" }}>
            עוד דברי תורה
          </Link>
        </p>
      </div>
    </div>
  );
}
