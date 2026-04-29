import { createClient } from "@sanity/client";
import type { Metadata } from "next";
import CategoriesList, { type CategoryItem } from "@/components/admin/CategoriesList";

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
  const [categories, refs] = await Promise.all([
    sanity.fetch<CategoryItem[]>(
      `*[_type == "category"] | order(name asc) { _id, name, hebrewName, slug, description }`
    ),
    sanity.fetch<{ category: string | null }[]>(
      `*[_type in ["video","divarTora","blogPost","qna"] && defined(category)] {
        "category": category->slug.current
      }`
    ),
  ]);

  const countMap: Record<string, number> = {};
  for (const r of refs) {
    if (r.category) countMap[r.category] = (countMap[r.category] ?? 0) + 1;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold" style={{ color: "var(--color-primary)" }}>
          קטגוריות
        </h1>
        <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-600">
          {categories.length} קטגוריות
        </span>
      </div>
      <CategoriesList categories={categories} countMap={countMap} />
    </div>
  );
}
