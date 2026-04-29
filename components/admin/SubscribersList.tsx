"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Download, X } from "lucide-react";

export interface Subscriber {
  _id: string;
  email: string;
  name?: string;
  phone?: string;
  createdAt?: string;
}

export default function SubscribersList({ subscribers }: { subscribers: Subscriber[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState("");

  async function add() {
    if (!name || !email) { alert("שם ואימייל חובה"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/save-subscriber", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error ?? "שגיאה"); return; }
      setName(""); setEmail(""); setPhone("");
      setShowForm(false);
      router.refresh();
    } finally { setSaving(false); }
  }

  async function remove(id: string) {
    if (!confirm("למחוק מנוי?")) return;
    await fetch("/api/admin/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ _id: id }),
    });
    router.refresh();
  }

  const filtered = subscribers.filter((s) => {
    const q = filter.toLowerCase();
    return !q || s.email.toLowerCase().includes(q) || (s.name ?? "").toLowerCase().includes(q);
  });

  return (
    <section className="card p-5 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold text-sm text-gray-500 uppercase tracking-wide">
          מנויים ({subscribers.length})
        </h2>
        <div className="flex gap-2">
          <a
            href="/api/admin/export-subscribers"
            className="text-xs inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50"
          >
            <Download size={12} /> ייצא CSV
          </a>
          <button
            onClick={() => setShowForm((s) => !s)}
            className="text-xs inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-white"
            style={{ background: "var(--color-accent)" }}
          >
            <Plus size={12} /> הוסף מנוי
          </button>
        </div>
      </div>

      {showForm && (
        <div className="mb-4 p-3 border border-dashed rounded-lg flex flex-col gap-2">
          <div className="flex justify-between">
            <span className="font-semibold text-sm">מנוי חדש</span>
            <button onClick={() => setShowForm(false)} className="text-gray-400"><X size={14} /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <input className="input" placeholder="שם *" value={name} onChange={(e) => setName(e.target.value)} />
            <input className="input" placeholder="אימייל *" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input className="input" placeholder="טלפון" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <button
            onClick={add}
            disabled={saving}
            className="self-start px-4 py-1.5 rounded-lg text-sm text-white disabled:opacity-50"
            style={{ background: "var(--color-primary)" }}
          >
            {saving ? "שומר..." : "הוסף"}
          </button>
        </div>
      )}

      <input
        className="input mb-2"
        placeholder="חיפוש (שם או אימייל)"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      />

      {filtered.length === 0 ? (
        <p className="text-gray-400 text-sm py-4">אין תוצאות</p>
      ) : (
        <div className="flex flex-col gap-1.5 max-h-96 overflow-y-auto">
          {filtered.map((s) => (
            <div key={s._id} className="flex items-center justify-between text-sm py-1.5 px-2 border-b border-gray-50 hover:bg-gray-50 rounded">
              <div className="flex-1 min-w-0">
                <span className="font-medium">{s.name || "—"}</span>
                <span className="text-gray-400 text-xs ml-2">{s.email}</span>
                {s.phone && <span className="text-gray-400 text-xs ml-2">· {s.phone}</span>}
              </div>
              <button
                onClick={() => remove(s._id)}
                className="p-1.5 rounded hover:bg-red-50 text-gray-300 hover:text-red-400"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
      <style jsx>{`
        .input { width: 100%; padding: 0.4rem 0.6rem; border: 1px solid #e5e7eb; border-radius: 0.5rem; font-size: 0.875rem; }
      `}</style>
    </section>
  );
}
