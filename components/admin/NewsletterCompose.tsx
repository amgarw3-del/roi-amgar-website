"use client";

import { useState } from "react";
import { Send } from "lucide-react";

export default function NewsletterCompose({ subscriberCount }: { subscriberCount: number }) {
  const [subject, setSubject] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ sent: number; failed: number } | null>(null);
  const [error, setError] = useState("");

  async function handleSend() {
    if (!subject.trim() || !body.trim()) {
      setError("נושא ותוכן הם שדות חובה");
      return;
    }
    if (!confirm(`לשלוח ל-${subscriberCount} מנויים?`)) return;

    setSending(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/admin/send-newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, previewText, body }),
      });
      const data = await res.json() as { ok?: boolean; sent?: number; failed?: number; error?: string };
      if (!res.ok) throw new Error(data.error ?? "שגיאה");
      setResult({ sent: data.sent ?? 0, failed: data.failed ?? 0 });
      setSubject("");
      setBody("");
      setPreviewText("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "שגיאה בשליחה");
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="card p-5">
      <h2 className="font-bold mb-4" style={{ color: "var(--color-primary)" }}>
        שלח ניוזלטר
      </h2>

      {result && (
        <div className="mb-4 px-4 py-3 bg-green-50 text-green-700 text-sm rounded-xl">
          ✓ נשלח ל-{result.sent} מנויים{result.failed > 0 ? ` (${result.failed} נכשלו)` : ""}
        </div>
      )}
      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 text-red-600 text-sm rounded-xl">{error}</div>
      )}

      <div className="flex flex-col gap-4">
        <div>
          <label className="text-sm font-medium text-gray-600 block mb-1">נושא המייל *</label>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="לדוגמה: דבר תורה לשבת — פרשת..."
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-600 block mb-1">
            טקסט תצוגה מקדימה <span className="text-gray-400 font-normal">(אופציונלי)</span>
          </label>
          <input
            value={previewText}
            onChange={(e) => setPreviewText(e.target.value)}
            placeholder="משפט קצר שיופיע בתצוגה מקדימה..."
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-600 block mb-1">תוכן המייל *</label>
          <p className="text-xs text-gray-400 mb-1.5">פסקאות מופרדות בשורה ריקה. תומך בטקסט עברי ישיר.</p>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={10}
            placeholder="כתוב את תוכן הניוזלטר כאן...

פסקה שנייה תופרד בשורה ריקה."
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400">
            ישלח ל-{subscriberCount} מנויים דרך Gmail
          </p>
          <button
            onClick={handleSend}
            disabled={sending || subscriberCount === 0}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white disabled:opacity-50"
            style={{ background: "var(--color-primary)" }}
          >
            <Send size={15} />
            {sending ? "שולח..." : "שלח"}
          </button>
        </div>
      </div>
    </section>
  );
}
