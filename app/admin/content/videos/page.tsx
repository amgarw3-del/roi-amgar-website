import { createClient } from "@sanity/client";
import type { Metadata } from "next";
import VideosList from "@/components/admin/VideosList";

export const metadata: Metadata = { title: "ניהול סרטונים" };
export const dynamic = "force-dynamic";

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  token: process.env.SANITY_API_TOKEN,
  apiVersion: "2024-01-01",
  useCdn: false,
});

interface VideoItem {
  _id: string;
  title: string;
  youtubeId: string;
  status: string;
  hidden: boolean;
  publishedAt: string;
  category?: { hebrewName: string };
}

export default async function AdminVideosPage() {
  const videos = await sanity.fetch<VideoItem[]>(
    `*[_type == "video"] | order(publishedAt desc) [0...100] {
      _id, title, youtubeId, status, hidden, publishedAt, category->{hebrewName}
    }`
  );

  const pending = videos.filter((v) => v.status === "draft" && !v.hidden);
  const published = videos.filter((v) => v.status === "published" && !v.hidden);
  const hidden = videos.filter((v) => v.hidden);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold" style={{ color: "var(--color-primary)" }}>
          ניהול סרטונים
        </h1>
        <div className="flex gap-3 text-sm">
          <span className="px-3 py-1 bg-yellow-50 text-yellow-700 rounded-full font-medium">
            {pending.length} ממתינים
          </span>
          <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full font-medium">
            {published.length} מפורסמים
          </span>
          <span className="px-3 py-1 bg-gray-100 text-gray-500 rounded-full font-medium">
            {hidden.length} מוסתרים
          </span>
        </div>
      </div>

      <VideosList
        pending={pending}
        published={published}
        hidden={hidden}
      />
    </div>
  );
}
