"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUp, ArrowDown, Eye, EyeOff, Upload } from "lucide-react";
import type { HomepageDoc } from "@/app/admin/content/homepage/page";

const BLOCK_LABELS: Record<string, string> = {
  hero: "Hero (כותרת ראשית)",
  donation: "תרומה",
  subscribe: "באנר הרשמה",
  categories: "תחומי לימוד",
  videos: "סרטונים אחרונים",
  shorts: "רואים תורה (קצרים)",
  lecturesStrip: "פס הרצאות",
  divreiTora: "דברי תורה",
  blog: "מאמרים",
  qna: "שאל את הרב",
  newsletter: "ניוזלטר",
  social: "רשתות חברתיות",
};

export const DEFAULT_BLOCKS = [
  "hero", "donation", "subscribe", "categories", "videos", "shorts",
  "newsletter", "lecturesStrip", "blog", "qna", "social",
];

type Block = { type: string; enabled: boolean };

export default function HomepageEditor({ initial }: { initial: HomepageDoc | null }) {
  const router = useRouter();
  const [heroTitle, setHeroTitle] = useState(initial?.heroTitle ?? "");
  const [heroSubtitle, setHeroSubtitle] = useState(initial?.heroSubtitle ?? "");
  const [heroCtaLabel, setHeroCtaLabel] = useState(initial?.heroCtaLabel ?? "");
  const [heroCtaHref, setHeroCtaHref] = useState(initial?.heroCtaHref ?? "");
  const [heroImageAssetId, setHeroImageAssetId] = useState<string | null | undefined>(undefined);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initial?.heroImageUrl ?? null);

  const initialBlocks: Block[] =
    initial?.blocks && initial.blocks.length > 0
      ? initial.blocks.map((b) => ({ type: b.type, enabled: b.enabled !== false }))
      : DEFAULT_BLOCKS.map((t) => ({ type: t, enabled: true }));

  const [blocks, setBlocks] = useState<Block[]>(initialBlocks);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");

  function move(idx: number, dir: -1 | 1) {
    const target = idx + dir;
    if (target < 0 || target >= blocks.length) return;
    const copy = [...blocks];
    [copy[idx], copy[target]] = [copy[target], copy[idx]];
    setBlocks(copy);
  }

  function toggle(idx: number) {
    const copy = [...blocks];
    copy[idx] = { ...copy[idx], enabled: !copy[idx].enabled };
    setBlocks(copy);
  }

  async function handleHeroFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreviewUrl(URL.createObjectURL(file));
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/admin/upload-image", { method: "POST", body: fd });
    const data = await res.json();
    if (!res.ok) { alert(data.error ?? "שגיאה"); return; }
    setHeroImageAssetId(data.assetId);
  }

  function clearHeroImage() {
    setPreviewUrl(null);
    setHeroImageAssetId(null);
  }

  async function save() {
    setSaving(true);
    setSavedMsg("");
    try {
      const res = await fetch("/api/admin/save-homepage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          heroTitle, heroSubtitle, heroCtaLabel, heroCtaHref,
          heroImageAssetId,
          blocks,
        }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error ?? "שגיאה"); return; }
      setSavedMsg("נשמר בהצלחה");
      router.refresh();
      setTimeout(() => setSavedMsg(""), 2500);
    } finally { setSaving(false); }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <section className="card p-5">
        <h2 className="font-bold mb-4" style={{ color: "var(--color-primary)" }}>
          Hero — כותרת ראשית
        </h2>
        <div className="flex flex-col gap-3">
          <input className="input" placeholder="כותרת ראשית" value={heroTitle} onChange={(e) => setHeroTitle(e.target.value)} />
          <textarea className="input" rows={3} placeholder="כותרת משנית" value={heroSubtitle} onChange={(e) => setHeroSubtitle(e.target.value)} />
          <div className="grid grid-cols-2 gap-2">
            <input className="input" placeholder="טקסט כפתור" value={heroCtaLabel} onChange={(e) => setHeroCtaLabel(e.target.value)} />
            <input className="input" placeholder="קישור כפתור" value={heroCtaHref} onChange={(e) => setHeroCtaHref(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">תמונת רקע</label>
            {previewUrl && <img src={previewUrl} alt="" className="w-full h-32 object-cover rounded-lg mb-2" />}
            <div className="flex gap-2">
              <label className="inline-flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg text-sm cursor-pointer hover:bg-gray-50">
                <Upload size={14} /> {previewUrl ? "החלף תמונה" : "העלה תמונה"}
                <input type="file" accept="image/*" onChange={handleHeroFile} className="hidden" />
              </label>
              {previewUrl && (
                <button onClick={clearHeroImage} className="text-xs text-gray-500 hover:text-red-500">הסר</button>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-1">אם ריק — ישתמש ב-Hero ברירת המחדל של האתר</p>
          </div>
        </div>
      </section>

      <section className="card p-5">
        <h2 className="font-bold mb-4" style={{ color: "var(--color-primary)" }}>
          סדר בלוקים בעמוד
        </h2>
        <p className="text-xs text-gray-500 mb-3">
          השתמש בחיצים כדי לשנות את סדר התצוגה. לחיצה על העין מסתירה/מציגה את הבלוק.
        </p>
        <div className="flex flex-col gap-1.5">
          {blocks.map((b, i) => (
            <div
              key={`${b.type}-${i}`}
              className={`flex items-center gap-2 p-2.5 rounded-lg border ${
                b.enabled ? "border-gray-200 bg-white" : "border-gray-100 bg-gray-50 opacity-60"
              }`}
            >
              <span className="text-xs text-gray-400 w-5 text-center">{i + 1}</span>
              <span className="flex-1 text-sm font-medium">
                {BLOCK_LABELS[b.type] ?? b.type}
              </span>
              <button
                onClick={() => toggle(i)}
                className="p-1.5 rounded hover:bg-gray-100 text-gray-500"
                title={b.enabled ? "הסתר" : "הצג"}
              >
                {b.enabled ? <Eye size={14} /> : <EyeOff size={14} />}
              </button>
              <button
                onClick={() => move(i, -1)}
                disabled={i === 0}
                className="p-1.5 rounded hover:bg-gray-100 text-gray-500 disabled:opacity-30"
              >
                <ArrowUp size={14} />
              </button>
              <button
                onClick={() => move(i, 1)}
                disabled={i === blocks.length - 1}
                className="p-1.5 rounded hover:bg-gray-100 text-gray-500 disabled:opacity-30"
              >
                <ArrowDown size={14} />
              </button>
            </div>
          ))}
        </div>
      </section>

      <div className="lg:col-span-2 flex items-center gap-3 sticky bottom-4 bg-white p-3 rounded-xl shadow-md border">
        <button
          onClick={save}
          disabled={saving}
          className="px-6 py-2.5 rounded-xl font-bold text-sm text-white disabled:opacity-50"
          style={{ background: "var(--color-primary)" }}
        >
          {saving ? "שומר..." : "שמור הגדרות"}
        </button>
        {savedMsg && <span className="text-sm text-green-600 font-medium">{savedMsg}</span>}
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-gray-500 hover:underline mr-auto"
        >
          צפה באתר ←
        </a>
      </div>

      <style jsx>{`
        .input { width: 100%; padding: 0.5rem 0.75rem; border: 1px solid #e5e7eb; border-radius: 0.75rem; font-size: 0.875rem; }
      `}</style>
    </div>
  );
}
