interface KpiCardProps {
  label: string;
  value: number | string;
  icon: string;
  color?: string;
}

export default function KpiCard({ label, value, icon, color = "var(--color-primary)" }: KpiCardProps) {
  return (
    <div className="card p-5 flex items-center gap-4">
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
        style={{ background: `color-mix(in srgb, ${color} 15%, transparent)` }}
      >
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold" style={{ color }}>
          {typeof value === "number" ? value.toLocaleString("he-IL") : value}
        </p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  );
}
