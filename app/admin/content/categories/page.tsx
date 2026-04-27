import { createClient } from "@sanity/client";
import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink } from "lucide-react";

export const metadata: Metadata = { title: "קטגוריות" };
export const dynamic = "force-dynamic";

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  token: process.env.SANITY_API_TOKEN,
  apiVersion: "2024-01-01",
  useCdn: false,
});

export default async function AdminCategoriesPage() {
  const [categories, counts] = await Promise.all([
    sanity.fetch<{ _id: string; name: string; hebrewName: string; slug: { current: string }; description?: string }[]>(
      `*[_type == "category"] | order(name asc) { _id, name, hebrewName, slug, description }`
    ),
    sanity.fetch<{ category: string; count: number }[]>(
      `*[_type in ["video","divarTora","blogPost","qna"] && defined(category)] {
        "category": category->slug.current
      } | {
        "category": category,
        "count": count(*)
      }`
    ),
  ]);

  const countMap: Record<string, number> = {};
  for (const { category } of (counts as { category: string }[])) {
    countMap[category] = (countMap[category] ?? 0) + 1;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold" style={{ color: "var(--color-primary)" }}>
          קטגוריות
        </h1>
        <a
          href={`https://www.sanity.io/manage/project/${process.env.NEXT_PUBLIC_SANITY_PROJECT_ID}/dataset/production`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 hover:bg-gray-50"
        >
          <ExternalLink size={13} />
          ערוך ב-Sanity
        </a>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {categories.map((cat) => (
          <div key={cat._id} className="card px-4 py-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-bold" style={{ color: "var(--color-primary)" }}>
                  {cat.hebrewName}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">/{cat.slug.current}</p>
                {cat.description && (
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{cat.description}</p>
                )}
              </div>
              <div className="text-left shrink-0">
                <span className="text-2xl font-bold" style={{ color: "var(--color-accent)" }}>
                  {countMap[cat.slug.current] ?? 0}
                </span>
                <p className="text-xs text-gray-400">פריטים</p>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <Link
                href={`/${cat.slug.current}`}
                target="_blank"
                className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 inline-flex items-center gap-1"
              >
                <ExternalLink size={11} />
                צפה באתר
              </Link>
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-400 mt-6">
        * לעריכת קטגוריות (שם, slug, תיאור) — השתמש ב-Sanity Studio
      </p>
    </div>
  );
}
