"use client";

import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import type { DayPoint } from "@/lib/ga4";

export default function TrafficLineChart({ data }: { data: DayPoint[] }) {
  return (
    <div className="card p-5">
      <h2 className="font-bold text-base mb-4" style={{ color: "var(--color-primary)" }}>
        📈 תנועה יומית
      </h2>
      {data.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">אין נתונים עדיין</p>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={data} margin={{ right: 10, left: 0 }}>
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10 }}
              interval={Math.floor(data.length / 6)}
            />
            <YAxis tick={{ fontSize: 11 }} width={35} />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="users"
              name="משתמשים"
              stroke="var(--color-primary)"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="sessions"
              name="סשנים"
              stroke="#6366f1"
              strokeWidth={2}
              dot={false}
              strokeDasharray="4 2"
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
