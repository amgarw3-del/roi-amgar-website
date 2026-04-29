"use client";

import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";

interface MonthBucket {
  month: string;
  count: number;
}

export default function QuestionsLineChart({ data }: { data: MonthBucket[] }) {
  return (
    <div className="card p-5">
      <h2 className="font-bold text-base mb-4" style={{ color: "var(--color-primary)" }}>
        ❓ שאלות לרב — 12 חודשים אחרונים
      </h2>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data} margin={{ right: 20, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="month" tick={{ fontSize: 11 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
          <Tooltip formatter={(v) => [`${v} שאלות`, ""]} />
          <Line
            type="monotone"
            dataKey="count"
            stroke="var(--color-primary)"
            strokeWidth={2}
            dot={{ r: 4, fill: "var(--color-primary)" }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
