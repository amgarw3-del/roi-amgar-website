"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Pencil, Plus, X, Upload } from "lucide-react";
import type { WeddingTestimonialItem, WeddingGalleryItem } from "@/app/admin/content/hupot/page";

type Tab = "testimonials" | "gallery";

const tabLabels: Record<Tab, string> = {
  testimonials: "המלצות",
  gallery: "גלריה",
};

async function uploadImage(file: File): Promise<string | null> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/admin/upload-image", { method: "POST", body: fd });
  const data = await res.json();
  if (!res.ok) {
    alert(data.error ?? "שגיאה בהעלאת תמונה");
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

export default function HupotPanel({
  testimonials,
  gallery,
}: {
  testimonials: WeddingTestimonialItem[];
  gallery: WeddingGalleryItem[];
}) {
  const [tab, setTab] = useState<Tab>("testimonials");

  return (
    <div>
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {(Object.keys(tabLabels) as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-semibold transition-colors ${
              tab === t ? "border-b-2 -mb-px" : "text-gray-500 hover:text-gray-800"
            }`}
            style={tab === t ? { color: "var(--color-primary)", borderColor: "var(--color-primary)" } : {}}
          >
            {tabLabels[t]}
          </button>
        ))}
      </div>

      {tab === "testimonials" && <TestimonialsTab items={testimonials} />}
      {tab === "gallery" && <GalleryTab items={gallery} />}
    </div>
  );
}

/* ---------- TESTIMONIALS ---------- */
function TestimonialsTab({ items }: { items: WeddingTestimonialItem[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<WeddingTestimonialItem | null>(null);
  const [showForm, setShowForm] = useState(false);

  return (
    <div>
      <button
        onClick={() => { setEditing(null); setShowForm(true); }}
        className="mb-4 flex items-center gap-1 px-4 py-2 rounded-xl font-semibold text-sm text-white"
        style={{ background: "var(--color-accent)" }}
      >
        <Plus size={16} /> המלצה חדשה
      </button>

      {showForm && (
        <TestimonialForm
          initial={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSaved={() => { setShowForm(false); setEditing(null); router.refresh(); }}
        />
      )}

      <div className="flex flex-col gap-2">
        {items.map((it) => (
          <div key={it._id} className="card p-4 flex gap-3 items-start">
            {it.photoUrl && <img src={it.photoUrl} alt="" className="w-12 h-12 rounded-full object-cover" />}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">{it.name}</p>
              {it.role && <p className="text-xs text-gray-500">{it.role}</p>}
              <p className="text-xs text-gray-600 mt-1 line-clamp-2">{it.quote}</p>
              <p className="text-xs text-gray-400 mt-1">סדר: {it.order ?? 0}</p>
            </div>
            <div className="flex flex-col gap-1">
              <button
                onClick={() => { setEditing(it); setShowForm(true); }}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={() => deleteDoc(it._id, "המלצה", () => router.refresh())}
                className="p-2 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-400"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="text-gray-400 text-sm py-4">אין המלצות עדיין</p>}
      </div>
    </div>
  );
}

function TestimonialForm({
  initial,
  onClose,
  onSaved,
}: {
  initial: WeddingTestimonialItem | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [quote, setQuote] = useState(initial?.quote ?? "");
  const [name, setName] = useState(initial?.name ?? "");
  const [role, setRole] = useState(initial?.role ?? "");
  const [order, setOrder] = useState<number>(initial?.order ?? 0);
  const [photoAssetId, setPhotoAssetId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initial?.photoUrl ?? null);
  const [saving, setSaving] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreviewUrl(URL.createObjectURL(file));
    const id = await uploadImage(file);
    if (id) setPhotoAssetId(id);
  }

  async function save() {
    if (!quote || !name) { alert("שדות חובה"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/save-wedding-testimonial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ _id: initial?._id, quote, name, role, order, photoAssetId }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error ?? "שגיאה"); return; }
      onSaved();
    } finally { setSaving(false); }
  }

  return (
    <div className="card p-5 mb-4 border-2" style={{ borderColor: "var(--color-accent)" }}>
      <div className="flex justify-between mb-3">
        <h3 className="font-bold">{initial ? "עריכת המלצה" : "המלצה חדשה"}</h3>
        <button onClick={onClose} className="text-gray-400"><X size={18} /></button>
      </div>
      <div className="flex flex-col gap-3">
        <textarea className="input" rows={3} placeholder="ציטוט *" value={quote} onChange={(e) => setQuote(e.target.value)} />
        <input className="input" placeholder="שם הזוג *" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="input" placeholder="תאריך / עיר החתונה (אופציונלי)" value={role} onChange={(e) => setRole(e.target.value)} />
        <div className="flex gap-3 items-center">
          <input type="number" className="input w-24" value={order} onChange={(e) => setOrder(Number(e.target.value))} />
          <label className="text-sm">סדר</label>
        </div>
        <div>
          <label className="text-sm font-medium block mb-1">תמונה (אופציונלי)</label>
          {previewUrl && <img src={previewUrl} alt="" className="w-16 h-16 rounded-full object-cover mb-2" />}
          <label className="inline-flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg text-sm cursor-pointer hover:bg-gray-50">
            <Upload size={14} /> {previewUrl ? "החלף תמונה" : "העלה תמונה"}
            <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
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

/* ---------- GALLERY ---------- */
function GalleryTab({ items }: { items: WeddingGalleryItem[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<WeddingGalleryItem | null>(null);
  const [showForm, setShowForm] = useState(false);

  return (
    <div>
      <button
        onClick={() => { setEditing(null); setShowForm(true); }}
        className="mb-4 flex items-center gap-1 px-4 py-2 rounded-xl font-semibold text-sm text-white"
        style={{ background: "var(--color-accent)" }}
      >
        <Plus size={16} /> תמונה חדשה
      </button>

      {showForm && (
        <GalleryForm
          initial={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSaved={() => { setShowForm(false); setEditing(null); router.refresh(); }}
        />
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {items.map((it) => (
          <div key={it._id} className="card p-2">
            {it.imageUrl && <img src={it.imageUrl} alt="" className="w-full h-32 object-cover rounded-lg" />}
            {it.caption && <p className="text-xs text-gray-600 mt-1">{it.caption}</p>}
            <p className="text-xs text-gray-400">סדר: {it.order ?? 0}</p>
            <div className="flex gap-1 mt-1">
              <button
                onClick={() => { setEditing(it); setShowForm(true); }}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
              >
                <Pencil size={12} />
              </button>
              <button
                onClick={() => deleteDoc(it._id, "תמונה", () => router.refresh())}
                className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-400"
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="text-gray-400 text-sm py-4 col-span-full">אין תמונות בגלריה</p>}
      </div>
    </div>
  );
}

function GalleryForm({
  initial,
  onClose,
  onSaved,
}: {
  initial: WeddingGalleryItem | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [caption, setCaption] = useState(initial?.caption ?? "");
  const [order, setOrder] = useState<number>(initial?.order ?? 0);
  const [imageAssetId, setImageAssetId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initial?.imageUrl ?? null);
  const [saving, setSaving] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreviewUrl(URL.createObjectURL(file));
    const id = await uploadImage(file);
    if (id) setImageAssetId(id);
  }

  async function save() {
    if (!initial && !imageAssetId) { alert("יש להעלות תמונה"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/save-wedding-gallery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ _id: initial?._id, caption, order, imageAssetId }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error ?? "שגיאה"); return; }
      onSaved();
    } finally { setSaving(false); }
  }

  return (
    <div className="card p-5 mb-4 border-2" style={{ borderColor: "var(--color-accent)" }}>
      <div className="flex justify-between mb-3">
        <h3 className="font-bold">{initial ? "עריכת תמונה" : "תמונה חדשה"}</h3>
        <button onClick={onClose} className="text-gray-400"><X size={18} /></button>
      </div>
      <div className="flex flex-col gap-3">
        {previewUrl && <img src={previewUrl} alt="" className="w-32 h-32 object-cover rounded-lg" />}
        <label className="inline-flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg text-sm cursor-pointer hover:bg-gray-50 w-fit">
          <Upload size={14} /> {previewUrl ? "החלף תמונה" : "העלה תמונה"}
          <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
        </label>
        <input className="input" placeholder="כיתוב (אופציונלי)" value={caption} onChange={(e) => setCaption(e.target.value)} />
        <div className="flex gap-3 items-center">
          <input type="number" className="input w-24" value={order} onChange={(e) => setOrder(Number(e.target.value))} />
          <label className="text-sm">סדר</label>
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
