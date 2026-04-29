import { createClient } from "@sanity/client";
import type { Metadata } from "next";
import LecturesPanel from "@/components/admin/LecturesPanel";

export const metadata: Metadata = { title: "ניהול הרצאות" };
export const dynamic = "force-dynamic";

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  token: process.env.SANITY_API_TOKEN,
  apiVersion: "2024-01-01",
  useCdn: false,
});

export interface LectureItem {
  _id: string;
  title: string;
  summary: string;
  order?: number;
  published?: boolean;
  flyerUrl?: string;
}
export interface TestimonialItem {
  _id: string;
  quote: string;
  name: string;
  role?: string;
  order?: number;
  photoUrl?: string;
}
export interface GalleryItem {
  _id: string;
  caption?: string;
  order?: number;
  imageUrl?: string;
}
export interface FaqItem {
  _id: string;
  question: string;
  answer: string;
  order?: number;
  published?: boolean;
}

export default async function AdminLecturesPage() {
  const [lectures, testimonials, gallery, faqs] = await Promise.all([
    sanity.fetch<LectureItem[]>(
      `*[_type == "lecture"] | order(order asc, _createdAt desc) {
        _id, title, summary, order, published, "flyerUrl": flyer.asset->url
      }`
    ),
    sanity.fetch<TestimonialItem[]>(
      `*[_type == "testimonial"] | order(order asc, _createdAt desc) {
        _id, quote, name, role, order, "photoUrl": photo.asset->url
      }`
    ),
    sanity.fetch<GalleryItem[]>(
      `*[_type == "lectureGalleryImage"] | order(order asc, _createdAt desc) {
        _id, caption, order, "imageUrl": image.asset->url
      }`
    ),
    sanity.fetch<FaqItem[]>(
      `*[_type == "lectureFaq"] | order(order asc, _createdAt desc) {
        _id, question, answer, order, published
      }`
    ),
  ]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold" style={{ color: "var(--color-primary)" }}>
          ניהול הרצאות
        </h1>
      </div>
      <LecturesPanel
        lectures={lectures}
        testimonials={testimonials}
        gallery={gallery}
        faqs={faqs}
      />
    </div>
  );
}
