import { createClient } from "@sanity/client";
import type { Metadata } from "next";
import NewsletterCompose from "@/components/admin/NewsletterCompose";
import SubscribersList, { type Subscriber } from "@/components/admin/SubscribersList";

export const metadata: Metadata = { title: "ניוזלטר" };
export const dynamic = "force-dynamic";

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  token: process.env.SANITY_API_TOKEN,
  apiVersion: "2024-01-01",
  useCdn: false,
});

export default async function AdminNewsletterPage() {
  const subscribers = await sanity.fetch<Subscriber[]>(
    `*[_type == "subscriber" && defined(email)] | order(createdAt desc) { _id, email, name, phone, createdAt }`
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold" style={{ color: "var(--color-primary)" }}>
          ניוזלטר
        </h1>
        <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-700">
          {subscribers.length} מנויים
        </span>
      </div>

      <SubscribersList subscribers={subscribers} />
      <NewsletterCompose subscriberCount={subscribers.length} />
    </div>
  );
}
