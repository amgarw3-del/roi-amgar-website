import { createClient } from "@sanity/client";
import type { Metadata } from "next";
import SikkumimPanel from "@/components/admin/SikkumimPanel";

export const metadata: Metadata = { title: "ניהול סיכומי רבנות" };
export const dynamic = "force-dynamic";

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  token: process.env.SANITY_API_TOKEN,
  apiVersion: "2024-01-01",
  useCdn: false,
});

export interface SummaryItem {
  _id: string;
  title: string;
  description?: string;
  category?: string;
  order?: number;
  published?: boolean;
  pdfUrl?: string;
}

export default async function AdminSikkumimPage() {
  const summaries = await sanity.fetch<SummaryItem[]>(
    `*[_type == "pdfSummary"] | order(order asc, _createdAt desc) {
      _id, title, description, category, order, published, "pdfUrl": pdfFile.asset->url
    }`
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold" style={{ color: "var(--color-primary)" }}>
          ניהול סיכומי רבנות
        </h1>
      </div>
      <SikkumimPanel summaries={summaries} />
    </div>
  );
}
