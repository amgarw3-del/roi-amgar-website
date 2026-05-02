import { adminClient } from "@/sanity/client";
import KpiCard from "@/components/admin/analytics/KpiCard";
import DownloadsBarChart from "@/components/admin/analytics/DownloadsBarChart";
import VideoViewsBarChart from "@/components/admin/analytics/VideoViewsBarChart";
import QuestionsLineChart from "@/components/admin/analytics/QuestionsLineChart";
import SubscribersLineChart from "@/components/admin/analytics/SubscribersLineChart";
import TopPdfTable from "@/components/admin/analytics/TopPdfTable";
import DvarViewsBarChart from "@/components/admin/analytics/DvarViewsBarChart";
import CategoryBarChart from "@/components/admin/analytics/CategoryBarChart";

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

  const [kpis, topDvars, topVideos, topDvarsByViews, recentQna, recentSubs, topPdfs, categoryStats] = await Promise.all([
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
  ]);

  const qnaByMonth = buildMonthlyBuckets(recentQna, "_createdAt");
  const subsByMonth = buildMonthlyBuckets(recentSubs, "createdAt");

  return (
    <div className="p-6 space-y-8" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--color-primary)" }}>
          אנליטיקס
        </h1>
        <p className="text-sm text-gray-500 mt-1">מעקב אחרי שימוש באתר — נתונים בזמן אמת</p>
      </div>

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
    </div>
  );
}
