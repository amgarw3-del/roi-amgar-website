import { createClient } from "@sanity/client";
import type { Metadata } from "next";
import HomepageEditor from "@/components/admin/HomepageEditor";

export const metadata: Metadata = { title: "ניהול עמוד הבית" };
export const dynamic = "force-dynamic";

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  token: process.env.SANITY_API_TOKEN,
  apiVersion: "2024-01-01",
  useCdn: false,
});

export interface HomepageDoc {
  heroTitle?: string;
  heroSubtitle?: string;
  heroCtaLabel?: string;
  heroCtaHref?: string;
  heroImageUrl?: string | null;
  blocks?: { _key?: string; type: string; enabled?: boolean }[];
}

export default async function AdminHomepagePage() {
  const doc = await sanity.fetch<HomepageDoc | null>(
    `*[_id == "homepage-singleton"][0] {
      heroTitle, heroSubtitle, heroCtaLabel, heroCtaHref,
      "heroImageUrl": heroImage.asset->url,
      blocks
    }`
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold" style={{ color: "var(--color-primary)" }}>
          ניהול עמוד הבית
        </h1>
      </div>
      <HomepageEditor initial={doc} />
    </div>
  );
}
