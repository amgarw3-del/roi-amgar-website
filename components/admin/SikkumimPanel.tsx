"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Pencil, Plus, X, Upload, FileText } from "lucide-react";
import type { SummaryItem } from "@/app/admin/content/sikkumim/page";

const categoryLabels: Record<string, string> = {
  general: "כללי",
  shabbat: "הלכות שבת",
  kashrut: "הלכות כשרות",
  nidda: "הלכות נידה",
  evelut: "הלכות אבלות",
  "yoreh-deah": "הלכות יורה דעה",
};

async function uploadPdf(file: File): Promise<string | null> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/admin/upload-pdf", { method: "POST", body: fd });
  const data = await res.json();
  if (!res.ok) {
    alert(data.error ?? "שגיאה בהעלאת PDF");
    return null;
  }
  return data.assetId as string;
}

async function deleteDoc(id: string, label: string, refresh: () => void) {
  if (!confirm(`למחוק ${label}?`)) return;
  await fetch("/api/admin/delete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ _id: id }),
  });
  refresh();
}

export default function SikkumimPanel({ summaries }: { summaries: SummaryItem[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<SummaryItem | null>(null);
  const [showForm, setShowForm] = useState(false);

  return (
    <div>
      <button
        onClick={() => { setEditing(null); setShowForm(true); }}
        className="mb-4 flex items-center gap-1 px-4 py-2 rounded-xl font-semibold text-sm text-white"
        style={{ background: "var(--color-accent)" }}
      >
        <Plus size={16} /> סיכום חדש
      </button>

      {showForm && (
        <SummaryForm
          initial={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSaved={() => { setShowForm(false); setEditing(null); router.refresh(); }}
        />
      )}

      <div className="flex flex-col gap-2">
        {summaries.map((it) => (
          <div key={it._id} className="card p-4 flex gap-3 items-start">
            <div
              className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ background: "color-mix(in srgb, var(--color-ochre) 15%, transparent)" }}
            >
              <FileText size={18} style={{ color: "var(--color-ochre)" }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">{it.title}</p>
              {it.category && (
                <span className="text-xs text-gray-500">{categoryLabels[it.category] ?? it.category}</span>
              )}
              {it.description && <p className="text-xs text-gray-600 mt-1 line-clamp-2">{it.description}</p>}
              <p className="text-xs text-gray-400 mt-1">
                סדר: {it.order ?? 0} · {it.published ? "מפורסם" : "מוסתר"}
                {it.pdfUrl && (
                  <> · <a href={it.pdfUrl} target="_blank" rel="noopener" className="underline">פתח PDF</a></>
                )}
              </p>
            </div>
            <div className="flex flex-col gap-1">
              <button
                onClick={() => { setEditing(it); setShowForm(true); }}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={() => deleteDoc(it._id, "סיכום", () => router.refresh())}
                className="p-2 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-400"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
        {summaries.length === 0 && <p className="text-gray-400 text-sm py-4">אין סיכומים עדיין</p>}
      </div>
    </div>
  );
}

function SummaryForm({
  initial,
  onClose,
  onSaved,
}: {
  initial: SummaryItem | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [category, setCategory] = useState(initial?.category ?? "general");
  const [order, setOrder] = useState<number>(initial?.order ?? 0);
  const [published, setPublished] = useState<boolean>(initial?.published ?? true);
  const [pdfAssetId, setPdfAssetId] = useState<string | null>(null);
  const [pdfFileName, setPdfFileName] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPdfFileName(file.name);
    const id = await uploadPdf(file);
    if (id) setPdfAssetId(id);
  }

  async function save() {
    if (!title) { alert("כותרת היא שדה חובה"); return; }
    if (!initial && !pdfAssetId) { alert("יש להעלות קובץ PDF"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/save-pdf-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          _id: initial?._id,
          title, description, category, order, published, pdfAssetId,
        }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error ?? "שגיאה"); return; }
      onSaved();
    } finally { setSaving(false); }
  }

  return (
    <div className="card p-5 mb-4 border-2" style={{ borderColor: "var(--color-accent)" }}>
      <div className="flex justify-between mb-3">
        <h3 className="font-bold">{initial ? "עריכת סיכום" : "סיכום חדש"}</h3>
        <button onClick={onClose} className="text-gray-400"><X size={18} /></button>
      </div>
      <div className="flex flex-col gap-3">
        <input className="input" placeholder="כותרת *" value={title} onChange={(e) => setTitle(e.target.value)} />
        <textarea className="input" rows={2} placeholder="תיאור קצר" value={description} onChange={(e) => setDescription(e.target.value)} />
        <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="general">כללי</option>
          <option value="shabbat">הלכות שבת</option>
          <option value="kashrut">הלכות כשרות</option>
          <option value="nidda">הלכות נידה</option>
          <option value="evelut">הלכות אבלות</option>
          <option value="yoreh-deah">הלכות יורה דעה</option>
        </select>
        <div className="flex gap-3 items-center">
          <input type="number" className="input w-24" value={order} onChange={(e) => setOrder(Number(e.target.value))} />
          <label className="text-sm">סדר</label>
          <label className="flex items-center gap-1 text-sm">
            <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} />
            מפורסם
          </label>
        </div>
        <div>
          <label className="text-sm font-medium block mb-1">קובץ PDF {!initial && "*"}</label>
          {(pdfFileName || initial?.pdfUrl) && (
            <p className="text-xs text-gray-500 mb-1">
              {pdfFileName ?? "קובץ קיים"} {initial?.pdfUrl && !pdfFileName && (
                <a href={initial.pdfUrl} target="_blank" rel="noopener" className="underline">פתח</a>
              )}
            </p>
          )}
          <label className="inline-flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg text-sm cursor-pointer hover:bg-gray-50">
            <Upload size={14} /> {pdfFileName || initial?.pdfUrl ? "החלף PDF" : "העלה PDF"}
            <input type="file" accept=".pdf,application/pdf" onChange={handleFile} className="hidden" />
          </label>
        </div>
        <div className="flex gap-2">
          <button onClick={save} disabled={saving} className="btn-primary disabled:opacity-50">
            {saving ? "שומר..." : "שמור"}
          </button>
          <button onClick={onClose} className="btn-ghost">ביטול</button>
        </div>
      </div>
      <style jsx>{`
        .input { width: 100%; padding: 0.5rem 0.75rem; border: 1px solid #e5e7eb; border-radius: 0.75rem; font-size: 0.875rem; }
        .btn-primary { padding: 0.5rem 1.25rem; border-radius: 0.75rem; font-weight: 700; font-size: 0.875rem; color: white; background: var(--color-primary); }
        .btn-ghost { padding: 0.5rem 1.25rem; border-radius: 0.75rem; font-weight: 500; font-size: 0.875rem; color: #6b7280; }
        .btn-ghost:hover { background: #f3f4f6; }
      `}</style>
    </div>
  );
}
