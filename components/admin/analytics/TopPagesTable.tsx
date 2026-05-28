import type { PageRow } from "@/lib/ga4";

function fmtTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return m > 0 ? `${m}:${String(s).padStart(2, "0")}` : `${s}ש׳`;
}

export default function TopPagesTable({ data }: { data: PageRow[] }) {
  return (
    <div className="card p-5">
      <h2 className="font-bold text-base mb-4" style={{ color: "var(--color-primary)" }}>
        🔍 דפים מובילים
      </h2>
      {data.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">אין נתונים עדיין</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-right pb-2 font-semibold text-gray-600">#</th>
              <th className="text-right pb-2 font-semibold text-gray-600">נתיב</th>
              <th className="text-left pb-2 font-semibold text-gray-600">צפיות</th>
              <th className="text-left pb-2 font-semibold text-gray-600">זמן ממוצע</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={row.path} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="py-2 pr-1 text-gray-400 font-medium">{i + 1}</td>
                <td className="py-2 text-gray-700 max-w-[160px] truncate" dir="ltr">
                  {row.path}
                </td>
                <td className="py-2 pl-1 font-bold text-left" style={{ color: "var(--color-primary)" }}>
                  {row.pageViews.toLocaleString("he-IL")}
                </td>
                <td className="py-2 pl-1 text-left text-gray-500">{fmtTime(row.avgTimeSec)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
