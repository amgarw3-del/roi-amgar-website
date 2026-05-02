"use client";

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

interface Item {
  hebrewName: string;
  count: number;
}

export default function CategoryBarChart({ data }: { data: Item[] }) {
  const chartData = data
    .filter((d) => d.count > 0)
    .map((d) => ({ label: d.hebrewName ?? "—", count: d.count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return (
    <div className="card p-5">
      <h2 className="font-bold text-base mb-4" style={{ color: "var(--color-primary)" }}>
        🏷 פופולריות קטגוריות
      </h2>
      {chartData.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">אין נתונים עדיין</p>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} layout="vertical" margin={{ right: 30, left: 10 }}>
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="label" width={130} tick={{ fontSize: 11, textAnchor: "end" }} />
            <Tooltip formatter={(v) => [`${v} פריטים`, ""]} />
            <Bar dataKey="count" radius={[0, 4, 4, 0]}>
              {chartData.map((_, i) => (
                <Cell key={i} fill="#16a34a" opacity={1 - i * 0.07} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
