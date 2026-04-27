import { createClient } from "@sanity/client";
import type { Metadata } from "next";
import DivreiToraList from "@/components/admin/DivreiToraList";

export const metadata: Metadata = { title: "ניהול דברי תורה" };
export const dynamic = "force-dynamic";

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  token: process.env.SANITY_API_TOKEN,
  apiVersion: "2024-01-01",
  useCdn: false,
});

export interface DivarToraItem {
  _id: string;
  title: string;
  teaser?: string;
  content?: string;
  status: string;
  sourceType?: string;
  publishedAt?: string;
  _createdAt: string;
  category?: { _id: string; hebrewName: string };
  extraCategories?: { _id: string; hebrewName: string }[];
  subTopics?: { _id: string; hebrewName: string }[];
}

export default async function AdminDivreiToraPage() {
  const [drafts, published, categories, subTopics] = await Promise.all([
    sanity.fetch<DivarToraItem[]>(
      `*[_type == "divarTora" && status == "draft"] | order(_createdAt desc) [0...80] {
        _id, title, teaser, content, status, sourceType, _createdAt,
        category->{_id, hebrewName},
        extraCategories[]->{_id, hebrewName},
        subTopics[]->{_id, hebrewName}
      }`
    ),
    sanity.fetch<DivarToraItem[]>(
      `*[_type == "divarTora" && status == "published"] | order(publishedAt desc) [0...80] {
        _id, title, teaser, content, status, publishedAt, _createdAt,
        category->{_id, hebrewName},
        extraCategories[]->{_id, hebrewName},
        subTopics[]->{_id, hebrewName}
      }`
    ),
    sanity.fetch<{ _id: string; hebrewName: string; slug: { current: string } }[]>(
      `*[_type == "category"] | order(name asc) { _id, hebrewName, slug }`
    ),
    sanity.fetch<{ _id: string; hebrewName: string; slug: { current: string }; group?: string }[]>(
      `*[_type == "subTopic"] | order(group asc, order asc) { _id, hebrewName, slug, group }`
    ),
  ]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold" style={{ color: "var(--color-primary)" }}>
          ניהול דברי תורה
        </h1>
        <div className="flex gap-3 text-sm">
          <span className="px-3 py-1 bg-yellow-50 text-yellow-700 rounded-full font-medium">
            {drafts.length} טיוטות
          </span>
          <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full font-medium">
            {published.length} מפורסמים
          </span>
        </div>
      </div>

      <DivreiToraList drafts={drafts} published={published} categories={categories} subTopics={subTopics} />
    </div>
  );
}
