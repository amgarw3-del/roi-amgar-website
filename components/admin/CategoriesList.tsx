"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExternalLink, Plus, Pencil, Trash2, X } from "lucide-react";

export interface CategoryItem {
  _id: string;
  name?: string;
  hebrewName: string;
  slug: { current: string };
  description?: string;
}

export default function CategoriesList({
  categories,
  countMap,
}: {
  categories: CategoryItem[];
  countMap: Record<string, number>;
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<CategoryItem | null>(null);

  async function deleteCat(cat: CategoryItem) {
    const used = countMap[cat.slug.current] ?? 0;
    const msg = used > 0
      ? `קטגוריה זו משויכת ל-${used} פריטים. למחוק בכל זאת?`
      : "למחוק קטגוריה זו?";
    if (!confirm(msg)) return;
    await fetch("/api/admin/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ _id: cat._id }),
    });
    router.refresh();
  }

  return (
    <div>
      <div className="flex justify-between mb-4">
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="inline-flex items-center gap-1 px-4 py-2 rounded-xl font-semibold text-sm text-white"
          style={{ background: "var(--color-accent)" }}
        >
          <Plus size={16} /> קטגוריה חדשה
        </button>
        <a
          href={`https://www.sanity.io/manage/project/${process.env.NEXT_PUBLIC_SANITY_PROJECT_ID}/dataset/production`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 hover:bg-gray-50"
        >
          <ExternalLink size={13} /> Sanity Studio
        </a>
      </div>

      {showForm && (
        <CategoryForm
          initial={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSaved={() => { setShowForm(false); setEditing(null); router.refresh(); }}
        />
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {categories.map((cat) => (
          <div key={cat._id} className="card px-4 py-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="font-bold" style={{ color: "var(--color-primary)" }}>
                  {cat.hebrewName}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">/{cat.slug.current}</p>
                {cat.description && (
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{cat.description}</p>
                )}
              </div>
              <div className="text-left shrink-0">
                <span className="text-2xl font-bold" style={{ color: "var(--color-accent)" }}>
                  {countMap[cat.slug.current] ?? 0}
                </span>
                <p className="text-xs text-gray-400">פריטים</p>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => { setEditing(cat); setShowForm(true); }}
                className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 inline-flex items-center gap-1"
              >
                <Pencil size={11} /> ערוך
              </button>
              <Link
                href={`/${cat.slug.current}`}
                target="_blank"
                className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 inline-flex items-center gap-1"
              >
                <ExternalLink size={11} /> צפה
              </Link>
              <button
                onClick={() => deleteCat(cat)}
                className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-red-50 text-gray-400 hover:text-red-500 inline-flex items-center gap-1"
              >
                <Trash2 size={11} /> מחק
              </button>
            </div>
          </div>
        ))}
        {categories.length === 0 && (
          <p className="text-gray-400 text-sm py-4 col-span-full">אין קטגוריות עדיין</p>
        )}
      </div>
    </div>
  );
}

function CategoryForm({
  initial,
  onClose,
  onSaved,
}: {
  initial: CategoryItem | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [hebrewName, setHebrewName] = useState(initial?.hebrewName ?? "");
  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug?.current ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!hebrewName) { alert("שם עברי חובה"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/save-category", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ _id: initial?._id, hebrewName, name, slug, description }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error ?? "שגיאה"); return; }
      onSaved();
    } finally { setSaving(false); }
  }

  return (
    <div className="card p-5 mb-6 border-2" style={{ borderColor: "var(--color-accent)" }}>
      <div className="flex justify-between mb-3">
        <h3 className="font-bold">{initial ? "עריכת קטגוריה" : "קטגוריה חדשה"}</h3>
        <button onClick={onClose} className="text-gray-400"><X size={18} /></button>
      </div>
      <div className="flex flex-col gap-3">
        <input className="input" placeholder="שם עברי *" value={hebrewName} onChange={(e) => setHebrewName(e.target.value)} />
        <input className="input" placeholder="שם באנגלית (slug-friendly)" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="input" placeholder="כתובת URL (אופציונלי, ייגזר מהשם)" value={slug} onChange={(e) => setSlug(e.target.value)} />
        <textarea className="input" rows={3} placeholder="תיאור" value={description} onChange={(e) => setDescription(e.target.value)} />
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
