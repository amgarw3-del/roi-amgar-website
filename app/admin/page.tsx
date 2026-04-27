import { createClient } from "@sanity/client";
import Link from "next/link";
import { Video, BookOpen, HelpCircle, RefreshCw, ExternalLink } from "lucide-react";

export const dynamic = "force-dynamic";

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  token: process.env.SANITY_API_TOKEN,
  apiVersion: "2024-01-01",
  useCdn: false,
});

export default async function AdminDashboard() {
  const [videoStats, divarStats, qnaStats] = await Promise.all([
    sanity.fetch<{ total: number; pending: number; hidden: number }>(`{
      "total": count(*[_type == "video"]),
      "pending": count(*[_type == "video" && status == "draft" && hidden != true]),
      "hidden": count(*[_type == "video" && hidden == true])
    }`),
    sanity.fetch<{ total: number; drafts: number }>(`{
      "total": count(*[_type == "divarTora" && status == "published"]),
      "drafts": count(*[_type == "divarTora" && status == "draft"])
    }`),
    sanity.fetch<{ unanswered: number; total: number }>(`{
      "unanswered": count(*[_type == "qna" && !defined(answer)]),
      "total": count(*[_type == "qna"])
    }`),
  ]);

  const kpis = [
    {
      label: "סרטונים",
      value: videoStats.total,
      sub: videoStats.pending > 0 ? `${videoStats.pending} ממתינים לאישור` : "הכל מעודכן",
      warn: videoStats.pending > 0,
      href: "/admin/content/videos",
      icon: Video,
    },
    {
      label: "דברי תורה",
      value: divarStats.total,
      sub: divarStats.drafts > 0 ? `${divarStats.drafts} טיוטות` : "הכל פורסם",
      warn: divarStats.drafts > 0,
      href: "/admin/content/divrei-tora",
      icon: BookOpen,
    },
    {
      label: "שאלות",
      value: qnaStats.total,
      sub: qnaStats.unanswered > 0 ? `${qnaStats.unanswered} ללא תשובה` : "הכל נענה",
      warn: qnaStats.unanswered > 0,
      href: "/admin/content/qna",
      icon: HelpCircle,
    },
  ];

  return (
    <div>
      <h1 className="text-xl font-bold mb-6" style={{ color: "var(--color-primary)" }}>
        שלום! מה עושים היום?
      </h1>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {kpis.map(({ label, value, sub, warn, href, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="card px-5 py-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-500">{label}</span>
              <Icon size={18} style={{ color: "var(--color-primary)" }} />
            </div>
            <p className="text-3xl font-bold mb-1" style={{ color: "var(--color-primary)" }}>
              {value}
            </p>
            <p className={`text-xs font-medium ${warn ? "text-amber-600" : "text-gray-400"}`}>
              {sub}
            </p>
          </Link>
        ))}
      </div>

      {/* פעולות מהירות */}
      <h2 className="font-bold mb-4 text-gray-600">פעולות מהירות</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
        <Link
          href="/admin/content/divrei-tora"
          className="card px-5 py-4 hover:shadow-md transition-shadow flex items-center gap-3"
          style={{ borderRight: "3px solid var(--color-accent)" }}
        >
          <BookOpen size={20} style={{ color: "var(--color-accent)" }} />
          <div>
            <p className="font-semibold text-sm">דבר תורה חדש</p>
            <p className="text-xs text-gray-400">כתוב או הדבק חומר גלם → AI יסכם</p>
          </div>
        </Link>

        <Link
          href="/admin/content/videos"
          className="card px-5 py-4 hover:shadow-md transition-shadow flex items-center gap-3"
          style={{ borderRight: "3px solid var(--color-primary)" }}
        >
          <Video size={20} style={{ color: "var(--color-primary)" }} />
          <div>
            <p className="font-semibold text-sm">אשר סרטונים</p>
            <p className="text-xs text-gray-400">סקור ופרסם סרטונים חדשים מיוטיוב</p>
          </div>
        </Link>

        <Link
          href="/admin/content/qna"
          className="card px-5 py-4 hover:shadow-md transition-shadow flex items-center gap-3"
          style={{ borderRight: "3px solid #ef4444" }}
        >
          <HelpCircle size={20} className="text-red-400" />
          <div>
            <p className="font-semibold text-sm">ענה לשאלות</p>
            <p className="text-xs text-gray-400">
              {qnaStats.unanswered > 0 ? `${qnaStats.unanswered} שאלות מחכות` : "אין שאלות פתוחות"}
            </p>
          </div>
        </Link>

        <a
          href={`${process.env.NEXT_PUBLIC_BASE_URL ?? ""}`}
          target="_blank"
          rel="noopener noreferrer"
          className="card px-5 py-4 hover:shadow-md transition-shadow flex items-center gap-3"
          style={{ borderRight: "3px solid #6b7280" }}
        >
          <ExternalLink size={20} className="text-gray-400" />
          <div>
            <p className="font-semibold text-sm">פתח את האתר</p>
            <p className="text-xs text-gray-400">ראה איך האתר נראה</p>
          </div>
        </a>
      </div>

      {/* מצב סנכרון */}
      {videoStats.hidden > 0 && (
        <div className="card px-5 py-3 flex items-center gap-3">
          <RefreshCw size={16} className="text-gray-400 shrink-0" />
          <p className="text-sm text-gray-500">
            {videoStats.hidden} סרטונים מוסתרים מהאתר — הסנכרון ממשיך אוטומטית
          </p>
        </div>
      )}
    </div>
  );
}
