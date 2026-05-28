"use client";

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import type { DeviceRow } from "@/lib/ga4";

const COLORS = ["var(--color-primary)", "#6366f1", "#0ea5e9"];

export default function DeviceBarChart({ data }: { data: DeviceRow[] }) {
  return (
    <div className="card p-5">
      <h2 className="font-bold text-base mb-4" style={{ color: "var(--color-primary)" }}>
        📱 פילוח מכשירים
      </h2>
      {data.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">אין נתונים עדיין</p>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} margin={{ right: 10, left: 0 }}>
            <XAxis dataKey="device" tick={{ fontSize: 13 }} />
            <YAxis tick={{ fontSize: 11 }} width={40} />
            <Tooltip formatter={(v) => [`${v} סשנים`, ""]} />
            <Bar dataKey="sessions" radius={[6, 6, 0, 0]}>
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
