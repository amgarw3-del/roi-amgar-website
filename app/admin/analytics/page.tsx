import { client } from "@/sanity/client";
import KpiCard from "@/components/admin/analytics/KpiCard";
import DownloadsBarChart from "@/components/admin/analytics/DownloadsBarChart";
import VideoViewsBarChart from "@/components/admin/analytics/VideoViewsBarChart";
import QuestionsLineChart from "@/components/admin/analytics/QuestionsLineChart";
import SubscribersLineChart from "@/components/admin/analytics/SubscribersLineChart";
import TopPdfTable from "@/components/admin/analytics/TopPdfTable";

export const dynamic = "force-dynamic";

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

  const [kpis, topDvars, topVideos, recentQna, recentSubs, topPdfs] = await Promise.all([
    client.fetch<{
      totalDivarDownloads: number;
      questionsThisMonth: number;
      totalSubscribers: number;
      totalVideoViews: number;
    }>(
      `{
        "totalDivarDownloads": math::sum(*[_type == "divarTora" && defined(downloadCount)].downloadCount),
        "questionsThisMonth": count(*[_type == "qna" && _createdAt >= $monthStart]),
        "totalSubscribers": count(*[_type == "subscriber"]),
        "totalVideoViews": math::sum(*[_type == "video" && defined(viewCount)].viewCount)
      }`,
      { monthStart }
    ),
    client.fetch<{ title: string; downloadCount: number; category?: { hebrewName?: string } }[]>(
      `*[_type == "divarTora" && defined(downloadCount) && downloadCount > 0]
       | order(downloadCount desc) [0...10] {
         title, downloadCount, category->{hebrewName}
       }`
    ),
    client.fetch<{ title: string; viewCount: number; category?: { hebrewName?: string } }[]>(
      `*[_type == "video" && defined(viewCount) && viewCount > 0]
       | order(viewCount desc) [0...10] {
         title, viewCount, category->{hebrewName}
       }`
    ),
    client.fetch<{ _createdAt: string }[]>(
      `*[_type == "qna" && _createdAt >= $yearStart] { _createdAt }`,
      { yearStart }
    ),
    client.fetch<{ createdAt: string }[]>(
      `*[_type == "subscriber" && defined(createdAt) && createdAt >= $yearStart] { createdAt }`,
      { yearStart }
    ),
    client.fetch<{ _id: string; title: string; downloadCount: number }[]>(
      `*[_type == "pdfSummary" && defined(downloadCount) && downloadCount > 0]
       | order(downloadCount desc) [0...5] {
         _id, title, downloadCount
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

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="הורדות דברי תורה (סה״כ)"
          value={kpis.totalDivarDownloads ?? 0}
          icon="📥"
        />
        <KpiCard
          label="שאלות לרב החודש"
          value={kpis.questionsThisMonth ?? 0}
          icon="❓"
          color="var(--color-ochre)"
        />
        <KpiCard
          label="מנויי ניוזלטר"
          value={kpis.totalSubscribers ?? 0}
          icon="📧"
          color="#16a34a"
        />
        <KpiCard
          label="צפיות בסרטונים (סה״כ)"
          value={kpis.totalVideoViews ?? 0}
          icon="🎬"
          color="#6366f1"
        />
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DownloadsBarChart data={topDvars} />
        <VideoViewsBarChart data={topVideos} />
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
