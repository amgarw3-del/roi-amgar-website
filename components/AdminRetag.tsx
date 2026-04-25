"use client";

import { useState } from "react";
import { Tags, Loader2 } from "lucide-react";

interface RetagResult {
  total: number;
  updated: number;
  results: string[];
}

export default function AdminRetag() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RetagResult | null>(null);

  async function handleRetag() {
    if (!confirm(`תשייך מחדש את כל דברי התורה ללא תתי-נושאים בעזרת AI?\nפעולה זו לוקחת זמן (קריאה ל-Claude לכל דבר תורה).`)) return;
    setLoading(true);
    setResult(null);
    const res = await fetch("/api/admin/retag-subtopics", { method: "POST" });
    const data = await res.json().catch(() => null);
    setLoading(false);
    if (data) setResult(data);
  }

  return (
    <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <h3 className="font-bold text-sm" style={{ color: "var(--color-primary)" }}>
            שיוך חכם לתת-נושאים
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            משייך בעזרת AI את כל דברי התורה ללא תיוג לנושאים מתאימים (מקסימום 3)
          </p>
        </div>
        <button
          onClick={handleRetag}
          disabled={loading}
          className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg font-semibold transition-opacity hover:opacity-80 disabled:opacity-40 text-white"
          style={{ background: "var(--color-primary)" }}
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Tags size={14} />}
          {loading ? "מעבד..." : "הפעל שיוך"}
        </button>
      </div>

      {result && (
        <div className="text-xs bg-white rounded-lg p-3 border max-h-40 overflow-y-auto">
          <p className="font-bold mb-1">
            עודכנו {result.updated} מתוך {result.total}
          </p>
          {result.results.map((r, i) => (
            <p key={i} className="text-gray-600 leading-5">{r}</p>
          ))}
        </div>
      )}
    </div>
  );
}
