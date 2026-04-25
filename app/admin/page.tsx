import { createClient } from "@sanity/client";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import AdminActions from "@/components/AdminActions";
import AdminCreateForm from "@/components/AdminCreateForm";
import AdminLogout from "@/components/AdminLogout";
import AdminRetag from "@/components/AdminRetag";

export const dynamic = "force-dynamic";

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  token: process.env.SANITY_API_TOKEN,
  apiVersion: "2024-01-01",
  useCdn: false,
});

interface DivarItem { _id: string; title: string; _createdAt: string; status: string }
interface VideoItem { _id: string; title: string; publishedAt: string }

export default async function AdminPage() {
  const [drafts, published, videos] = await Promise.all([
    sanity.fetch<DivarItem[]>(
      `*[_type == "divarTora" && status == "draft"] | order(_createdAt desc) [0...50] { _id, title, _createdAt, status }`
    ),
    sanity.fetch<DivarItem[]>(
      `*[_type == "divarTora" && status == "published"] | order(publishedAt desc) [0...40] { _id, title, publishedAt, status }`
    ),
    sanity.fetch<VideoItem[]>(
      `*[_type == "video"] | order(publishedAt desc) [0...40] { _id, title, publishedAt }`
    ),
  ]);

  return (
    <div className="container py-10 max-w-3xl" dir="rtl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "var(--color-primary)" }}>
          לוח מנהל
        </h1>
        <div className="flex gap-3">
          <Link
            href="/studio"
            target="_blank"
            className="inline-flex items-center gap-1.5 text-sm px-4 py-2 rounded-xl font-semibold transition-opacity hover:opacity-80"
            style={{ background: "var(--color-warm)", color: "var(--color-primary)" }}
          >
            <ExternalLink size={14} />
            פתח Studio
          </Link>
          <AdminLogout />
        </div>
      </div>

      {/* יצירה */}
      <section className="mb-10">
        <AdminCreateForm />
      </section>

      {/* שיוך חכם */}
      <section className="mb-10">
        <AdminRetag />
      </section>

      {/* טיוטות */}
      <section className="mb-10">
        <h2 className="text-lg font-bold mb-4" style={{ color: "var(--color-primary)" }}>
          טיוטות ממתינות ({drafts.length})
        </h2>
        {drafts.length === 0 ? (
          <p className="text-gray-400 text-sm">אין טיוטות כרגע</p>
        ) : (
          <div className="flex flex-col gap-2">
            {drafts.map((item) => (
              <div key={item._id} className="card px-4 py-3 flex items-center justify-between gap-3">
                <span className="font-semibold text-sm flex-1 truncate">{item.title}</span>
                <AdminActions _id={item._id} canPublish />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* דברי תורה מפורסמים */}
      <section className="mb-10">
        <h2 className="text-lg font-bold mb-4" style={{ color: "var(--color-primary)" }}>
          דברי תורה מפורסמים ({published.length})
        </h2>
        <div className="flex flex-col gap-2">
          {published.map((item) => (
            <div key={item._id} className="card px-4 py-3 flex items-center justify-between gap-3">
              <span className="font-semibold text-sm flex-1 truncate">{item.title}</span>
              <AdminActions _id={item._id} />
            </div>
          ))}
        </div>
      </section>

      {/* שיעורים */}
      <section>
        <h2 className="text-lg font-bold mb-4" style={{ color: "var(--color-primary)" }}>
          שיעורים ({videos.length})
        </h2>
        <div className="flex flex-col gap-2">
          {videos.map((item) => (
            <div key={item._id} className="card px-4 py-3 flex items-center justify-between gap-3">
              <span className="font-semibold text-sm flex-1 truncate">{item.title}</span>
              <AdminActions _id={item._id} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
