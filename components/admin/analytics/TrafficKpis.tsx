import KpiCard from "./KpiCard";
import type { TrafficKpis } from "@/lib/ga4";

function fmtTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return m > 0 ? `${m}:${String(s).padStart(2, "0")}` : `${s}ש׳`;
}

export default function TrafficKpiCards({ data }: { data: TrafficKpis }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
      <KpiCard label="משתמשים" value={data.users} icon="👥" color="var(--color-primary)" />
      <KpiCard label="מבקרים חדשים" value={data.newUsers} icon="✨" color="#0ea5e9" />
      <KpiCard label="סשנים" value={data.sessions} icon="🔄" color="#6366f1" />
      <KpiCard label="עמודים נצפו" value={data.pageViews} icon="📄" color="var(--color-accent)" />
      <KpiCard label="זמן ממוצע בסשן" value={fmtTime(data.avgEngagementTimeSec)} icon="⏱" color="#16a34a" />
      <KpiCard
        label="שיעור נטישה"
        value={`${(data.bounceRate * 100).toFixed(1)}%`}
        icon="🚪"
        color="#f59e0b"
      />
    </div>
  );
}
