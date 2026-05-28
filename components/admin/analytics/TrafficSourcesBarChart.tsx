"use client";

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import type { SourceRow } from "@/lib/ga4";

const COLORS = [
  "var(--color-primary)", "#6366f1", "#0ea5e9", "#16a34a", "#f59e0b", "#a855f7",
];

export default function TrafficSourcesBarChart({ data }: { data: SourceRow[] }) {
  return (
    <div className="card p-5">
      <h2 className="font-bold text-base mb-4" style={{ color: "var(--color-primary)" }}>
        🌐 מקורות תנועה
      </h2>
      {data.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">אין נתונים עדיין</p>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} layout="vertical" margin={{ right: 30, left: 10 }}>
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="channel" width={110} tick={{ fontSize: 12, textAnchor: "end" }} />
            <Tooltip formatter={(v) => [`${v} סשנים`, ""]} />
            <Bar dataKey="sessions" radius={[0, 4, 4, 0]}>
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
