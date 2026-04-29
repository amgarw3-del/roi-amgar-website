"use client";

import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";

interface MonthBucket {
  month: string;
  count: number;
}

export default function SubscribersLineChart({ data }: { data: MonthBucket[] }) {
  return (
    <div className="card p-5">
      <h2 className="font-bold text-base mb-4" style={{ color: "var(--color-primary)" }}>
        📧 מנויי ניוזלטר חדשים — 12 חודשים אחרונים
      </h2>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data} margin={{ right: 20, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="month" tick={{ fontSize: 11 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
          <Tooltip formatter={(v) => [`${v} מנויים חדשים`, ""]} />
          <Line
            type="monotone"
            dataKey="count"
            stroke="#16a34a"
            strokeWidth={2}
            dot={{ r: 4, fill: "#16a34a" }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
