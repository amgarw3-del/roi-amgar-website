import { createClient } from "@sanity/client";
import type { Metadata } from "next";
import BlogList from "@/components/admin/BlogList";

export const metadata: Metadata = { title: "ניהול מאמרים" };
export const dynamic = "force-dynamic";

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  token: process.env.SANITY_API_TOKEN,
  apiVersion: "2024-01-01",
  useCdn: false,
});

export interface BlogItem {
  _id: string;
  title: string;
  publishedAt?: string;
  level?: string;
  source?: string;
  category?: { hebrewName: string };
}

export default async function AdminBlogPage() {
  const [posts, categories] = await Promise.all([
    sanity.fetch<BlogItem[]>(
      `*[_type == "blogPost"] | order(publishedAt desc) [0...100] {
        _id, title, publishedAt, level, source, category->{hebrewName}
      }`
    ),
    sanity.fetch<{ _id: string; hebrewName: string }[]>(
      `*[_type == "category"] | order(name asc) { _id, hebrewName }`
    ),
  ]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold" style={{ color: "var(--color-primary)" }}>
          מאמרים ופוסטים
        </h1>
        <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-600">
          {posts.length} מאמרים
        </span>
      </div>
      <BlogList posts={posts} categories={categories} />
    </div>
  );
}
