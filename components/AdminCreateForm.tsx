"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function AdminCreateForm() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ title: "", teaser: "", content: "", status: "draft" });
  const router = useRouter();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/admin/create-dvar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (res.ok) {
      setForm({ title: "", teaser: "", content: "", status: "draft" });
      setOpen(false);
      router.refresh();
    } else {
      const d = await res.json().catch(() => ({}));
      alert(d.error ?? "שגיאה");
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full py-3 rounded-xl font-bold transition-opacity hover:opacity-80"
        style={{ background: "var(--color-primary)", color: "#fff" }}
      >
        + צור דבר תורה חדש
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 p-5 bg-gray-50 rounded-xl border border-gray-200">
      <div className="flex justify-between items-center">
        <h3 className="font-bold" style={{ color: "var(--color-primary)" }}>דבר תורה חדש</h3>
        <button type="button" onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
      </div>
      <input
        required
        placeholder="כותרת *"
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
        className="px-3 py-2 rounded-lg border border-gray-200 text-right focus:outline-none focus:ring-1"
      />
      <input
        placeholder="תקציר (אופציונלי)"
        value={form.teaser}
        onChange={(e) => setForm({ ...form, teaser: e.target.value })}
        className="px-3 py-2 rounded-lg border border-gray-200 text-right focus:outline-none focus:ring-1"
      />
      <textarea
        required
        placeholder="תוכן דבר התורה *"
        rows={8}
        value={form.content}
        onChange={(e) => setForm({ ...form, content: e.target.value })}
        className="px-3 py-2 rounded-lg border border-gray-200 text-right focus:outline-none focus:ring-1 resize-y"
      />
      <div className="flex items-center gap-3">
        <label className="text-sm font-semibold">סטטוס:</label>
        <select
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value })}
          className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none"
        >
          <option value="draft">טיוטה</option>
          <option value="published">פרסם מיד</option>
        </select>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="py-2.5 rounded-xl font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        style={{ background: "var(--color-primary)" }}
      >
        {loading ? <Loader2 className="animate-spin mx-auto" size={18} /> : "צור"}
      </button>
    </form>
  );
}
