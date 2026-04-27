import { createClient } from "@sanity/client";
import type { Metadata } from "next";
import NewsletterCompose from "@/components/admin/NewsletterCompose";

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
  const subscribers = await sanity.fetch<{ _id: string; email: string; name?: string; createdAt?: string }[]>(
    `*[_type == "subscriber" && defined(email)] | order(createdAt desc) { _id, email, name, createdAt }`
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

      {/* רשימת מנויים */}
      <section className="card p-5 mb-6">
        <h2 className="font-bold mb-3 text-sm text-gray-500 uppercase tracking-wide">מנויים</h2>
        {subscribers.length === 0 ? (
          <p className="text-gray-400 text-sm">אין מנויים עדיין</p>
        ) : (
          <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto">
            {subscribers.map((s) => (
              <div key={s._id} className="flex items-center justify-between text-sm py-1 border-b border-gray-50">
                <span className="font-medium">{s.name || "—"}</span>
                <span className="text-gray-400 text-xs">{s.email}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* עורך ניוזלטר */}
      <NewsletterCompose subscriberCount={subscribers.length} />
    </div>
  );
}
