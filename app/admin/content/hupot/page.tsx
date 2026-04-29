import { createClient } from "@sanity/client";
import type { Metadata } from "next";
import HupotPanel from "@/components/admin/HupotPanel";

export const metadata: Metadata = { title: "ניהול עריכת חופות" };
export const dynamic = "force-dynamic";

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  token: process.env.SANITY_API_TOKEN,
  apiVersion: "2024-01-01",
  useCdn: false,
});

export interface WeddingTestimonialItem {
  _id: string;
  quote: string;
  name: string;
  role?: string;
  order?: number;
  photoUrl?: string;
}

export interface WeddingGalleryItem {
  _id: string;
  caption?: string;
  order?: number;
  imageUrl?: string;
}

export default async function AdminHupotPage() {
  const [testimonials, gallery] = await Promise.all([
    sanity.fetch<WeddingTestimonialItem[]>(
      `*[_type == "weddingTestimonial"] | order(order asc, _createdAt desc) {
        _id, quote, name, role, order, "photoUrl": photo.asset->url
      }`
    ),
    sanity.fetch<WeddingGalleryItem[]>(
      `*[_type == "weddingGalleryImage"] | order(order asc, _createdAt desc) {
        _id, caption, order, "imageUrl": image.asset->url
      }`
    ),
  ]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold" style={{ color: "var(--color-primary)" }}>
          ניהול עריכת חופות
        </h1>
      </div>
      <HupotPanel testimonials={testimonials} gallery={gallery} />
    </div>
  );
}
