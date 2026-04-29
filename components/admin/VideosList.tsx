"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ExternalLink, RefreshCw, Plus, Pencil, Trash2, X } from "lucide-react";
import type { VideoItem } from "@/app/admin/content/videos/page";

interface Props {
  pending: VideoItem[];
  published: VideoItem[];
  hidden: VideoItem[];
  categories: { _id: string; hebrewName: string }[];
}

export default function VideosList({ pending, published, hidden, categories }: Props) {
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<VideoItem | null>(null);

  async function toggleHidden(id: string, newHidden: boolean) {
    await fetch("/api/admin/toggle-hidden", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, hidden: newHidden }),
    });
    router.refresh();
  }

  async function publishVideo(id: string) {
    await fetch("/api/admin/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    router.refresh();
  }

  async function deleteVideo(id: string) {
    if (!confirm("למחוק סרטון זה לצמיתות?")) return;
    await fetch("/api/admin/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ _id: id }),
    });
    router.refresh();
  }

  async function syncNow() {
    setSyncing(true);
    try {
      await fetch("/api/cron/generate-divrei-tora", {
        method: "GET",
        headers: { "x-cron-secret": "" },
      });
    } finally {
      setSyncing(false);
      router.refresh();
    }
  }

  function startEdit(item: VideoItem) {
    setEditing(item);
    setShowForm(true);
  }

  const Section = ({
    title,
    items,
    showPublish,
  }: {
    title: string;
    items: VideoItem[];
    showPublish?: boolean;
  }) =>
    items.length === 0 ? null : (
      <section className="mb-8">
        <h2 className="font-bold mb-3" style={{ color: "var(--color-primary)" }}>
          {title} ({items.length})
        </h2>
        <div className="flex flex-col gap-2">
          {items.map((item) => (
            <VideoRow
              key={item._id}
              item={item}
              onToggle={toggleHidden}
              onPublish={showPublish ? publishVideo : undefined}
              onEdit={startEdit}
              onDelete={deleteVideo}
            />
          ))}
        </div>
      </section>
    );

  return (
    <div>
      <div className="flex justify-between mb-6 gap-2">
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="inline-flex items-center gap-1 px-4 py-2 rounded-xl font-semibold text-sm text-white"
          style={{ background: "var(--color-accent)" }}
        >
          <Plus size={16} /> סרטון חדש
        </button>
        <button
          onClick={syncNow}
          disabled={syncing}
          className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-xl font-medium border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw size={15} className={syncing ? "animate-spin" : ""} />
          סנכרן עכשיו
        </button>
      </div>

      {showForm && (
        <VideoForm
          initial={editing}
          categories={categories}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSaved={() => { setShowForm(false); setEditing(null); router.refresh(); }}
        />
      )}

      <Section title="ממתינים לאישור" items={pending} showPublish />
      <Section title="מפורסמים" items={published} />
      <Section title="מוסתרים מהאתר" items={hidden} />
    </div>
  );
}

function VideoRow({
  item,
  onToggle,
  onPublish,
  onEdit,
  onDelete,
}: {
  item: VideoItem;
  onToggle: (id: string, hidden: boolean) => void;
  onPublish?: (id: string) => void;
  onEdit: (v: VideoItem) => void;
  onDelete: (id: string) => void;
}) {
  const [busy, startTransition] = useTransition();

  return (
    <div className="card px-4 py-3 flex items-center gap-3">
      {item.youtubeId && (
        <img
          src={`https://img.youtube.com/vi/${item.youtubeId}/default.jpg`}
          alt=""
          className="w-16 h-11 object-cover rounded-lg shrink-0"
        />
      )}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate">{item.title}</p>
        <p className="text-xs text-gray-400 mt-0.5">
          {item.category?.hebrewName ?? "—"}
          {item.publishedAt && (
            <> · {new Date(item.publishedAt).toLocaleDateString("he-IL")}</>
          )}
        </p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {onPublish && (
          <button
            onClick={() => startTransition(() => onPublish(item._id))}
            disabled={busy}
            className="text-xs px-3 py-1.5 rounded-lg font-medium text-white disabled:opacity-50"
            style={{ background: "var(--color-primary)" }}
          >
            פרסם
          </button>
        )}
        <button
          onClick={() => onEdit(item)}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
          title="עריכה"
        >
          <Pencil size={15} />
        </button>
        <button
          onClick={() => startTransition(() => onToggle(item._id, !item.hidden))}
          disabled={busy}
          title={item.hidden ? "הצג באתר" : "הסתר מהאתר"}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 disabled:opacity-40"
        >
          {item.hidden ? <Eye size={16} /> : <EyeOff size={16} />}
        </button>
        {item.youtubeId && (
          <a
            href={`https://youtu.be/${item.youtubeId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-400"
          >
            <ExternalLink size={16} />
          </a>
        )}
        <button
          onClick={() => onDelete(item._id)}
          className="p-2 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-400"
          title="מחיקה"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
}

function VideoForm({
  initial,
  categories,
  onClose,
  onSaved,
}: {
  initial: VideoItem | null;
  categories: { _id: string; hebrewName: string }[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [youtubeId, setYoutubeId] = useState(initial?.youtubeId ?? "");
  const [categoryId, setCategoryId] = useState(initial?.category?._id ?? "");
  const [level, setLevel] = useState(initial?.level ?? "beginner");
  const [platform, setPlatform] = useState(initial?.platform ?? "youtube");
  const [summary, setSummary] = useState(initial?.summary ?? "");
  const [status, setStatus] = useState(initial?.status ?? "draft");
  const [saving, setSaving] = useState(false);

  function extractYoutubeId(input: string): string {
    const m = input.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([A-Za-z0-9_-]{11})/);
    return m ? m[1] : input;
  }

  async function save() {
    if (!title) { alert("כותרת חובה"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/save-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          _id: initial?._id,
          title,
          youtubeId: extractYoutubeId(youtubeId),
          categoryId,
          level,
          platform,
          summary,
          status,
        }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error ?? "שגיאה"); return; }
      onSaved();
    } finally { setSaving(false); }
  }

  return (
    <div className="card p-5 mb-6 border-2" style={{ borderColor: "var(--color-accent)" }}>
      <div className="flex justify-between mb-3">
        <h3 className="font-bold">{initial ? "עריכת סרטון" : "סרטון חדש"}</h3>
        <button onClick={onClose} className="text-gray-400"><X size={18} /></button>
      </div>
      <div className="flex flex-col gap-3">
        <input className="input" placeholder="כותרת *" value={title} onChange={(e) => setTitle(e.target.value)} />
        <input className="input" placeholder="YouTube ID או קישור" value={youtubeId} onChange={(e) => setYoutubeId(e.target.value)} />
        <textarea className="input" rows={2} placeholder="סיכום (אופציונלי)" value={summary} onChange={(e) => setSummary(e.target.value)} />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <select className="input" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">בחר קטגוריה</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>{c.hebrewName}</option>
            ))}
          </select>
          <select className="input" value={level} onChange={(e) => setLevel(e.target.value)}>
            <option value="beginner">מתחיל</option>
            <option value="advanced">מתקדם</option>
            <option value="talmidei-torah">בני תורה</option>
          </select>
          <select className="input" value={platform} onChange={(e) => setPlatform(e.target.value)}>
            <option value="youtube">YouTube</option>
            <option value="instagram">Instagram</option>
            <option value="tiktok">TikTok</option>
            <option value="facebook">Facebook</option>
          </select>
          <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="draft">טיוטה</option>
            <option value="published">מפורסם</option>
          </select>
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
