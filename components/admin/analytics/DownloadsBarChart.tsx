"use client";

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

interface Item {
  title: string;
  downloadCount: number;
  category?: { hebrewName?: string };
}

export default function DownloadsBarChart({ data }: { data: Item[] }) {
  const chartData = data.map((d) => ({
    label: d.title.length > 22 ? d.title.slice(0, 22) + "…" : d.title,
    count: d.downloadCount ?? 0,
  }));

  return (
    <div className="card p-5">
      <h2 className="font-bold text-base mb-4" style={{ color: "var(--color-primary)" }}>
        📥 Top 10 דברי תורה שהורדו
      </h2>
      {chartData.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">אין נתונים עדיין</p>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} layout="vertical" margin={{ right: 30, left: 10 }}>
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="label" width={130} tick={{ fontSize: 11, textAnchor: "end" }} />
            <Tooltip formatter={(v) => [`${v} הורדות`, ""]} />
            <Bar dataKey="count" radius={[0, 4, 4, 0]}>
              {chartData.map((_, i) => (
                <Cell key={i} fill="var(--color-primary)" opacity={1 - i * 0.07} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
