import { createClient } from "@sanity/client";
import type { Metadata } from "next";
import QnaList from "@/components/admin/QnaList";

export const metadata: Metadata = { title: "שאל את הרב" };
export const dynamic = "force-dynamic";

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  token: process.env.SANITY_API_TOKEN,
  apiVersion: "2024-01-01",
  useCdn: false,
});

export interface QnaItem {
  _id: string;
  question: string;
  answer?: string;
  askerName?: string;
  questionType?: string;
  isPublic: boolean;
  publishedAt?: string;
  _createdAt: string;
  category?: { _id: string; hebrewName: string };
  extraCategories?: { _id: string; hebrewName: string }[];
  subTopics?: { _id: string; hebrewName: string }[];
}

export default async function AdminQnaPage() {
  const [all, categories, subTopics] = await Promise.all([
    sanity.fetch<QnaItem[]>(
      `*[_type == "qna"] | order(_createdAt desc) [0...100] {
        _id, question, answer, askerName, questionType, isPublic, publishedAt, _createdAt,
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

  const unanswered = all.filter((q) => !q.answer);
  const answered = all.filter((q) => q.answer && !q.isPublic);
  const published = all.filter((q) => q.isPublic);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold" style={{ color: "var(--color-primary)" }}>
          שאל את הרב
        </h1>
        <div className="flex gap-2 text-sm">
          <span className="px-3 py-1 bg-red-50 text-red-600 rounded-full font-medium">
            {unanswered.length} ללא תשובה
          </span>
          <span className="px-3 py-1 bg-yellow-50 text-yellow-700 rounded-full font-medium">
            {answered.length} ממתינים לפרסום
          </span>
          <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full font-medium">
            {published.length} מפורסמים
          </span>
        </div>
      </div>

      <QnaList
        unanswered={unanswered}
        answered={answered}
        published={published}
        categories={categories}
        subTopics={subTopics}
      />
    </div>
  );
}
