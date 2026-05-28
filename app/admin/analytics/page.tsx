import { adminClient } from "@/sanity/client";
import KpiCard from "@/components/admin/analytics/KpiCard";
import DownloadsBarChart from "@/components/admin/analytics/DownloadsBarChart";
import VideoViewsBarChart from "@/components/admin/analytics/VideoViewsBarChart";
import QuestionsLineChart from "@/components/admin/analytics/QuestionsLineChart";
import SubscribersLineChart from "@/components/admin/analytics/SubscribersLineChart";
import TopPdfTable from "@/components/admin/analytics/TopPdfTable";
import DvarViewsBarChart from "@/components/admin/analytics/DvarViewsBarChart";
import CategoryBarChart from "@/components/admin/analytics/CategoryBarChart";
import TrafficKpiCards from "@/components/admin/analytics/TrafficKpis";
import TrafficLineChart from "@/components/admin/analytics/TrafficLineChart";
import TopPagesTable from "@/components/admin/analytics/TopPagesTable";
import DeviceBarChart from "@/components/admin/analytics/DeviceBarChart";
import TrafficSourcesBarChart from "@/components/admin/analytics/TrafficSourcesBarChart";
import {
  isGa4Configured,
  getTrafficKpis,
  getTrafficByDay,
  getTopPages,
  getDeviceBreakdown,
  getTrafficSources,
} from "@/lib/ga4";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const HEBREW_MONTHS = [
  "ינו׳", "פבר׳", "מרץ", "אפר׳", "מאי", "יוני",
  "יולי", "אוג׳", "ספט׳", "אוק׳", "נוב׳", "דצמ׳",
];

function buildMonthlyBuckets(
  docs: { _createdAt?: string; createdAt?: string }[],
  field: "_createdAt" | "createdAt" = "_createdAt"
): { month: string; count: number }[] {
  const now = new Date();
  const buckets: Record<string, number> = {};
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    buckets[key] = 0;
  }
  docs.forEach((doc) => {
    const dateStr = field === "createdAt" ? doc.createdAt : doc._createdAt;
    if (!dateStr) return;
    const key = dateStr.slice(0, 7);
    if (key in buckets) buckets[key]++;
  });
  return Object.entries(buckets).map(([key, count]) => {
    const [, mm] = key.split("-");
    return { month: HEBREW_MONTHS[parseInt(mm) - 1], count };
  });
}

export default async function AnalyticsDashboard() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const yearStart = new Date(now.getFullYear() - 1, now.getMonth(), 1).toISOString();
  const ga4Active = isGa4Configured();

  const [
    kpis, topDvars, topVideos, topDvarsByViews, recentQna, recentSubs, topPdfs, categoryStats,
    gaKpis, gaByDay, gaTopPages, gaDevices, gaSources,
  ] = await Promise.all([
    adminClient.fetch<{
      totalDivarDownloads: number;
      totalDivarViews: number;
      totalShares: number;
      questionsThisMonth: number;
      totalSubscribers: number;
      totalVideoViews: number;
      chatCount: number;
    }>(
      `{
        "totalDivarDownloads": math::sum(*[_type == "divarTora" && defined(downloadCount)].downloadCount),
        "totalDivarViews": math::sum(*[_type == "divarTora" && defined(viewCount)].viewCount),
        "totalShares": math::sum(*[_type == "divarTora" && defined(shareCount)].shareCount),
        "questionsThisMonth": count(*[_type == "qna" && _createdAt >= $monthStart]),
        "totalSubscribers": count(*[_type == "subscriber"]),
        "totalVideoViews": math::sum(*[_type == "video" && defined(viewCount)].viewCount),
        "chatCount": *[_type == "siteStats"][0].chatCount
      }`,
      { monthStart }
    ),
    adminClient.fetch<{ title: string; downloadCount: number; category?: { hebrewName?: string } }[]>(
      `*[_type == "divarTora" && defined(downloadCount) && downloadCount > 0]
       | order(downloadCount desc) [0...10] {
         title, downloadCount, category->{hebrewName}
       }`
    ),
    adminClient.fetch<{ title: string; viewCount: number; category?: { hebrewName?: string } }[]>(
      `*[_type == "video" && defined(viewCount) && viewCount > 0]
       | order(viewCount desc) [0...10] {
         title, viewCount, category->{hebrewName}
       }`
    ),
    adminClient.fetch<{ title: string; viewCount: number }[]>(
      `*[_type == "divarTora" && defined(viewCount) && viewCount > 0]
       | order(viewCount desc) [0...10] {
         title, viewCount
       }`
    ),
    adminClient.fetch<{ _createdAt: string }[]>(
      `*[_type == "qna" && _createdAt >= $yearStart] { _createdAt }`,
      { yearStart }
    ),
    adminClient.fetch<{ createdAt: string }[]>(
      `*[_type == "subscriber" && defined(createdAt) && createdAt >= $yearStart] { createdAt }`,
      { yearStart }
    ),
    adminClient.fetch<{ _id: string; title: string; downloadCount: number }[]>(
      `*[_type == "pdfSummary" && defined(downloadCount) && downloadCount > 0]
       | order(downloadCount desc) [0...5] {
         _id, title, downloadCount
       }`
    ),
    adminClient.fetch<{ hebrewName: string; count: number }[]>(
      `*[_type == "category"] {
        hebrewName,
        "count": count(*[_type in ["divarTora","video","blogPost","qna"] && (
          references(^._id)
        )])
      }`
    ),
    ga4Active ? getTrafficKpis(30) : Promise.resolve(null),
    ga4Active ? getTrafficByDay(30) : Promise.resolve([]),
    ga4Active ? getTopPages(30, 10) : Promise.resolve([]),
    ga4Active ? getDeviceBreakdown(30) : Promise.resolve([]),
    ga4Active ? getTrafficSources(30) : Promise.resolve([]),
  ]);

  const qnaByMonth = buildMonthlyBuckets(recentQna, "_createdAt");
  const subsByMonth = buildMonthlyBuckets(recentSubs, "createdAt");

  return (
    <div className="p-6 space-y-10" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--color-primary)" }}>
          אנליטיקס
        </h1>
        <p className="text-sm text-gray-500 mt-1">מעקב אחרי שימוש באתר — נתונים בזמן אמת</p>
      </div>

      {/* ─── סקשן GA4 ─── */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="text-lg font-bold text-gray-800">🌐 תעבורת אתר</h2>
          <span className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{
              background: ga4Active ? "color-mix(in srgb, #16a34a 15%, transparent)" : "color-mix(in srgb, #f59e0b 15%, transparent)",
              color: ga4Active ? "#16a34a" : "#b45309",
            }}>
            {ga4Active ? "Google Analytics" : "לא מחובר"}
          </span>
          <div className="flex gap-2 mr-auto">
            <a
              href="https://analytics.google.com/analytics/web/#/a284461573p536541799/report/realtime-overview"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs px-3 py-1 rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 transition-colors font-medium"
            >
              ⚡ Realtime
            </a>
            <a
              href="https://analytics.google.com/analytics/web/#/a284461573p536541799/report/defaultoview"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs px-3 py-1 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors font-medium"
            >
              📊 דוחות מלאים
            </a>
          </div>
        </div>

        {!ga4Active && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <p className="font-semibold mb-1">GA4 לא מחובר</p>
            <p>
              כדי לראות נתוני תנועה אמיתיים, הגדר את משתני הסביבה:
              <br />
              <code className="text-xs bg-amber-100 px-1 rounded">NEXT_PUBLIC_GA_MEASUREMENT_ID</code>,{" "}
              <code className="text-xs bg-amber-100 px-1 rounded">GA4_PROPERTY_ID</code>,{" "}
              <code className="text-xs bg-amber-100 px-1 rounded">GA4_SA_CLIENT_EMAIL</code>,{" "}
              <code className="text-xs bg-amber-100 px-1 rounded">GA4_SA_PRIVATE_KEY</code>
            </p>
          </div>
        )}

        {gaKpis && <TrafficKpiCards data={gaKpis} />}

        {ga4Active && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TrafficLineChart data={gaByDay} />
            <TrafficSourcesBarChart data={gaSources} />
            <DeviceBarChart data={gaDevices} />
            <TopPagesTable data={gaTopPages} />
          </div>
        )}
      </section>

      <hr className="border-gray-100" />

      {/* ─── סקשן Sanity ─── */}
      <section className="space-y-6">
        <h2 className="text-lg font-bold text-gray-800">📚 פעילות תוכן</h2>

        {/* KPI cards — שורה ראשונה (דברי תורה) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label="צפיות בדברי תורה"
            value={kpis.totalDivarViews ?? 0}
            icon="👁"
            color="var(--color-accent)"
          />
          <KpiCard
            label="הורדות דברי תורה"
            value={kpis.totalDivarDownloads ?? 0}
            icon="📥"
          />
          <KpiCard
            label="שיתופים סה״כ"
            value={kpis.totalShares ?? 0}
            icon="🔗"
            color="#a855f7"
          />
          <KpiCard
            label="צפיות בסרטונים"
            value={kpis.totalVideoViews ?? 0}
            icon="🎬"
            color="#6366f1"
          />
        </div>

        {/* KPI cards — שורה שנייה (אינטראקציות) */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <KpiCard
            label="שאלות לרב החודש"
            value={kpis.questionsThisMonth ?? 0}
            icon="❓"
            color="var(--color-ochre)"
          />
          <KpiCard
            label="שאלות AI Chat (סה״כ)"
            value={kpis.chatCount ?? 0}
            icon="🤖"
            color="#0ea5e9"
          />
          <KpiCard
            label="מנויי ניוזלטר"
            value={kpis.totalSubscribers ?? 0}
            icon="📧"
            color="#16a34a"
          />
        </div>

        {/* Charts grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DvarViewsBarChart data={topDvarsByViews} />
          <DownloadsBarChart data={topDvars} />
          <VideoViewsBarChart data={topVideos} />
          <CategoryBarChart data={categoryStats} />
          <QuestionsLineChart data={qnaByMonth} />
          <SubscribersLineChart data={subsByMonth} />
        </div>

        {/* PDF table */}
        <div className="max-w-lg">
          <TopPdfTable data={topPdfs} />
        </div>
      </section>
    </div>
  );
}
