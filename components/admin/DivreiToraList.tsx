"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Trash2, CheckCircle, Sparkles, ChevronDown, ChevronUp,
  Share2, X, Copy, Check, Plus, Minus, Upload, BookOpen, Tag, Pencil
} from "lucide-react";
import type { DivarToraItem } from "@/app/admin/content/divrei-tora/page";
import MarkdownEditor from "@/components/admin/MarkdownEditor";

type CategoryItem = { _id: string; hebrewName: string; slug: { current: string } };
type SubTopicItem = { _id: string; hebrewName: string; slug: { current: string }; group?: string };

interface Props {
  drafts: DivarToraItem[];
  published: DivarToraItem[];
  categories: CategoryItem[];
  subTopics: SubTopicItem[];
}

interface AiResult {
  title: string;
  teaser: string;
  content: string;
  category?: string;
}

// ─── כפתור העתקה ───────────────────────────────────────────────────────────
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button onClick={handleCopy} className="p-1.5 rounded hover:bg-gray-100 text-gray-400">
      {copied ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
    </button>
  );
}

// ─── גריד בחירת קטגוריות + תתי-קטגוריות ───────────────────────────────────
const SUBTOPIC_GROUPS = [
  { value: "moed", title: "מועדים" },
  { value: "parasha", title: "פרשיות" },
  { value: "fast", title: "צומות" },
  { value: "national", title: "מועדים לאומיים" },
  { value: "general", title: "כללי" },
] as const;

function CategoryGrid({
  categories,
  subTopics,
  selectedCatIds,
  selectedSubIds,
  onChangeCats,
  onChangeSubs,
  onSubTopicAdded,
  onSubTopicUpdated,
}: {
  categories: CategoryItem[];
  subTopics: SubTopicItem[];
  selectedCatIds: string[];
  selectedSubIds: string[];
  onChangeCats: (ids: string[]) => void;
  onChangeSubs: (ids: string[]) => void;
  onSubTopicAdded?: (sub: SubTopicItem) => void;
  onSubTopicUpdated?: (sub: SubTopicItem) => void;
}) {
  const [showSubs, setShowSubs] = useState(false);
  const [showAddSub, setShowAddSub] = useState(false);
  const [newSubName, setNewSubName] = useState("");
  const [newSubGroup, setNewSubGroup] = useState<string>("general");
  const [savingSub, setSavingSub] = useState(false);
  const [editingSub, setEditingSub] = useState<SubTopicItem | null>(null);

  async function handleAddSub() {
    if (!newSubName.trim()) return;
    setSavingSub(true);
    try {
      const res = await fetch("/api/admin/save-subtopic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hebrewName: newSubName.trim(), group: newSubGroup }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(`שגיאה: ${data.error ?? res.status}`);
        return;
      }
      const newSub: SubTopicItem = {
        _id: data._id,
        hebrewName: data.hebrewName ?? newSubName.trim(),
        slug: { current: data.slug?.current ?? "" },
        group: data.group ?? newSubGroup,
      };
      onSubTopicAdded?.(newSub);
      onChangeSubs([...selectedSubIds, newSub._id]);
      setNewSubName("");
      setShowAddSub(false);
    } catch (err) {
      alert(`שגיאת רשת: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSavingSub(false);
    }
  }

  async function handleUpdateSub() {
    if (!editingSub || !editingSub.hebrewName.trim()) return;
    setSavingSub(true);
    try {
      const res = await fetch("/api/admin/save-subtopic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          _id: editingSub._id,
          hebrewName: editingSub.hebrewName.trim(),
          group: editingSub.group,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(`שגיאה: ${data.error ?? res.status}`);
        return;
      }
      const updated: SubTopicItem = {
        _id: data._id,
        hebrewName: data.hebrewName ?? editingSub.hebrewName,
        slug: { current: data.slug?.current ?? editingSub.slug.current },
        group: data.group ?? editingSub.group,
      };
      onSubTopicUpdated?.(updated);
      setEditingSub(null);
    } catch (err) {
      alert(`שגיאת רשת: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSavingSub(false);
    }
  }

  function toggleCat(id: string) {
    if (selectedCatIds.includes(id)) {
      onChangeCats(selectedCatIds.filter((x) => x !== id));
    } else if (selectedCatIds.length < 3) {
      onChangeCats([...selectedCatIds, id]);
    }
  }

  function toggleSub(id: string) {
    if (selectedSubIds.includes(id)) {
      onChangeSubs(selectedSubIds.filter((x) => x !== id));
    } else {
      onChangeSubs([...selectedSubIds, id]);
    }
  }

  // קבץ תתי-נושאים לפי group
  const groups = subTopics.reduce<Record<string, SubTopicItem[]>>((acc, st) => {
    const g = st.group ?? "כללי";
    if (!acc[g]) acc[g] = [];
    acc[g].push(st);
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-3">
      {/* מודאל עריכת תת-נושא */}
      {editingSub && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40" onClick={() => setEditingSub(null)}>
          <div className="bg-white rounded-2xl p-5 w-72 shadow-2xl" dir="rtl" onClick={(e) => e.stopPropagation()}>
            <p className="font-bold mb-3 text-sm" style={{ color: "var(--color-primary)" }}>עריכת תת-נושא</p>
            <input
              autoFocus
              className="border border-gray-200 rounded-lg px-3 py-2 w-full mb-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              value={editingSub.hebrewName}
              onChange={(e) => setEditingSub({ ...editingSub, hebrewName: e.target.value })}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleUpdateSub(); } if (e.key === "Escape") setEditingSub(null); }}
              placeholder="שם תת-נושא"
            />
            <select
              className="border border-gray-200 rounded-lg px-3 py-2 w-full mb-3 text-sm focus:outline-none"
              value={editingSub.group ?? "general"}
              onChange={(e) => setEditingSub({ ...editingSub, group: e.target.value })}
            >
              {SUBTOPIC_GROUPS.map((g) => (
                <option key={g.value} value={g.value}>{g.title}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleUpdateSub}
                disabled={savingSub || !editingSub.hebrewName.trim()}
                className="flex-1 text-xs py-2 rounded-lg font-bold text-white disabled:opacity-50"
                style={{ background: "var(--color-primary)" }}
              >
                {savingSub ? "שומר..." : "✓ שמור"}
              </button>
              <button
                type="button"
                onClick={() => setEditingSub(null)}
                className="flex-1 text-xs py-2 rounded-lg font-medium text-gray-500 border hover:bg-gray-50"
              >
                בטל
              </button>
            </div>
          </div>
        </div>
      )}

      {/* קטגוריות ראשיות */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-600">שיוך לקטגוריות (עד 3)</label>
          <span className="text-xs text-gray-400">{selectedCatIds.length}/3 נבחרו</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {categories.map((c) => {
            const isSelected = selectedCatIds.includes(c._id);
            const order = selectedCatIds.indexOf(c._id) + 1;
            const disabled = !isSelected && selectedCatIds.length >= 3;
            return (
              <button
                key={c._id}
                type="button"
                onClick={() => toggleCat(c._id)}
                disabled={disabled}
                className={`relative flex items-center gap-2 px-3 py-3 rounded-xl border-2 text-right transition-all ${
                  isSelected
                    ? "shadow-sm"
                    : disabled
                    ? "opacity-40 cursor-not-allowed border-gray-100"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}
                style={isSelected ? { borderColor: "var(--color-primary)", background: "var(--color-warm)" } : {}}
              >
                <div
                  className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center"
                  style={{ background: isSelected ? "var(--color-primary)" : "var(--color-warm)" }}
                >
                  <BookOpen size={14} style={{ color: isSelected ? "white" : "var(--color-primary)" }} />
                </div>
                <span className="font-semibold text-sm flex-1 truncate" style={{ color: "var(--color-primary)" }}>
                  {c.hebrewName}
                </span>
                {isSelected && (
                  <span
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                    style={{ background: "var(--color-accent)" }}
                  >
                    {order}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* תתי-נושאים */}
      <div>
        <button
          type="button"
          onClick={() => setShowSubs((s) => !s)}
          className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-800 w-full mb-2"
        >
          <Tag size={14} style={{ color: "var(--color-accent)" }} />
          תתי-נושאים
          {selectedSubIds.length > 0 && (
            <span
              className="text-xs px-1.5 py-0.5 rounded-full text-white font-bold"
              style={{ background: "var(--color-accent)" }}
            >
              {selectedSubIds.length}
            </span>
          )}
          <span className="mr-auto text-gray-400">{showSubs ? "▲" : "▼"}</span>
        </button>

        {showSubs && (
          <div className="flex flex-col gap-3 p-3 rounded-xl border border-gray-200 bg-gray-50">
            {Object.entries(groups).map(([groupName, items]) => (
              <div key={groupName}>
                {Object.keys(groups).length > 1 && (
                  <p className="text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">
                    {SUBTOPIC_GROUPS.find((g) => g.value === groupName)?.title ?? groupName}
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  {items.map((st) => {
                    const isSelected = selectedSubIds.includes(st._id);
                    return (
                      <div key={st._id} className="flex items-center gap-0.5">
                        <button
                          type="button"
                          onClick={() => toggleSub(st._id)}
                          className={`text-xs px-3 py-1.5 rounded-full border transition-all font-medium ${
                            isSelected ? "text-white border-transparent" : "border-gray-300 text-gray-600 hover:border-gray-400"
                          }`}
                          style={isSelected ? { background: "var(--color-accent)", borderColor: "var(--color-accent)" } : {}}
                        >
                          {st.hebrewName}
                          {isSelected && " ✓"}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setEditingSub({ ...st }); }}
                          className="p-1 rounded-full text-gray-300 hover:text-blue-400 hover:bg-blue-50 transition-colors"
                          title="ערוך תת-נושא"
                        >
                          <Pencil size={10} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* טופס הוספת תת-נושא inline */}
            <div className="border-t border-gray-200 pt-3 mt-1">
              {!showAddSub ? (
                <button
                  type="button"
                  onClick={() => setShowAddSub(true)}
                  className="text-xs px-3 py-1.5 rounded-full border-2 border-dashed border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-700 font-medium flex items-center gap-1"
                >
                  <Plus size={12} />
                  הוסף תת-נושא חדש
                </button>
              ) : (
                <div className="flex flex-col gap-2 p-3 rounded-lg bg-white border border-gray-200">
                  <p className="text-xs font-semibold text-gray-600">תת-נושא חדש</p>
                  <input
                    autoFocus
                    value={newSubName}
                    onChange={(e) => setNewSubName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") { e.preventDefault(); handleAddSub(); }
                      if (e.key === "Escape") setShowAddSub(false);
                    }}
                    placeholder="שם תת-נושא (לדוגמה: ל״ג בעומר)"
                    className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                  <select
                    value={newSubGroup}
                    onChange={(e) => setNewSubGroup(e.target.value)}
                    className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none"
                  >
                    {SUBTOPIC_GROUPS.map((g) => (
                      <option key={g.value} value={g.value}>{g.title}</option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleAddSub}
                      disabled={savingSub || !newSubName.trim()}
                      className="text-xs px-3 py-1.5 rounded-lg font-bold text-white disabled:opacity-50"
                      style={{ background: "var(--color-primary)" }}
                    >
                      {savingSub ? "שומר..." : "✓ הוסף"}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowAddSub(false); setNewSubName(""); }}
                      className="text-xs px-3 py-1.5 rounded-lg font-medium text-gray-500 hover:bg-gray-100"
                    >
                      בטל
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── modal שיתוף ────────────────────────────────────────────────────────────
function ShareModal({ item, onClose }: { item: DivarToraItem; onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ whatsapp: string; instagram: string } | null>(null);

  async function generate() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/social-adapt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: item.title, content: item.content, teaser: item.teaser }),
      });
      setResult(await res.json() as { whatsapp: string; instagram: string });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-bold" style={{ color: "var(--color-primary)" }}>שתף ברשתות חברתיות</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100"><X size={18} /></button>
        </div>
        <div className="p-5">
          <p className="text-sm text-gray-600 mb-4 font-medium truncate">{item.title}</p>
          {!result ? (
            <button
              onClick={generate}
              disabled={loading || !item.content}
              className="w-full py-3 rounded-xl font-semibold text-white disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: "var(--color-primary)" }}
            >
              <Sparkles size={16} />
              {loading ? "מייצר גרסאות..." : "צור גרסאות עם AI"}
            </button>
          ) : (
            <div className="flex flex-col gap-5">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-green-700">📱 וואטסאפ</span>
                  <CopyButton text={result.whatsapp} />
                </div>
                <pre className="text-sm whitespace-pre-wrap bg-green-50 rounded-xl p-3 text-gray-700 font-sans">{result.whatsapp}</pre>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-purple-700">📸 אינסטגרם</span>
                  <CopyButton text={result.instagram} />
                </div>
                <pre className="text-sm whitespace-pre-wrap bg-purple-50 rounded-xl p-3 text-gray-700 font-sans">{result.instagram}</pre>
              </div>
              <button onClick={generate} className="text-xs text-gray-400 hover:text-gray-600 text-center">↺ צור שוב</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── מודל עריכת דבר תורה קיים ────────────────────────────────────────────────
function EditModal({ item, categories, subTopics, onClose, onSaved, onSubTopicAdded, onSubTopicUpdated }: {
  item: DivarToraItem;
  categories: CategoryItem[];
  subTopics: SubTopicItem[];
  onClose: () => void;
  onSaved: () => void;
  onSubTopicAdded?: (sub: SubTopicItem) => void;
  onSubTopicUpdated?: (sub: SubTopicItem) => void;
}) {
  const [title, setTitle] = useState(item.title);
  const [teaser, setTeaser] = useState(item.teaser ?? "");
  const [content, setContent] = useState(item.content ?? "");
  const [selectedCats, setSelectedCats] = useState<string[]>(() => {
    const cats: string[] = [];
    if (item.category?._id) cats.push(item.category._id);
    if (item.extraCategories) cats.push(...item.extraCategories.map((c) => c._id));
    return cats;
  });
  const [selectedSubs, setSelectedSubs] = useState<string[]>(
    item.subTopics?.map((s) => s._id) ?? []
  );
  const [status, setStatus] = useState<"draft" | "published">(
    item.status === "published" ? "published" : "draft"
  );
  const [saving, setSaving] = useState(false);
  const [teaserLoading, setTeaserLoading] = useState(false);

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;

  async function generateTeaser() {
    if (!content.trim()) return;
    setTeaserLoading(true);
    try {
      const res = await fetch("/api/admin/gen-teaser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const data = await res.json() as { teaser?: string; error?: string };
      if (data.teaser) setTeaser(data.teaser);
      else alert(`שגיאה: ${data.error ?? "לא ידוע"}`);
    } catch (err) {
      alert(`שגיאת רשת: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setTeaserLoading(false);
    }
  }

  async function handleSave() {
    if (!title.trim() || !content.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/update-dvar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: item._id,
          title,
          teaser,
          content,
          categoryIds: selectedCats,
          subTopicIds: selectedSubs,
          status,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(`שגיאה בשמירה: ${err.error ?? res.status}`);
        return;
      }
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto"
      style={{ background: "rgba(0,0,0,0.45)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-6 mx-4 p-6 flex flex-col gap-4">
        {/* כותרת המודל */}
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-bold text-lg flex items-center gap-2" style={{ color: "var(--color-primary)" }}>
            <Pencil size={18} /> עריכת דבר תורה
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X size={18} />
          </button>
        </div>

        {/* כותרת */}
        <div>
          <label className="text-sm font-medium text-gray-600 block mb-1">כותרת *</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>

        {/* טיזר */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm font-medium text-gray-600">תקציר</label>
            <button
              type="button"
              onClick={generateTeaser}
              disabled={teaserLoading || !content.trim()}
              className="flex items-center gap-1 text-xs font-medium disabled:opacity-40"
              style={{ color: "var(--color-accent)" }}
            >
              <Sparkles size={12} />
              {teaserLoading ? "מייצר..." : "✨ צור אוטומטי"}
            </button>
          </div>
          <textarea
            value={teaser}
            onChange={(e) => setTeaser(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>

        {/* תוכן */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm font-medium text-gray-600">תוכן *</label>
            <span className="text-xs text-gray-400">{wordCount} מילים</span>
          </div>
          <MarkdownEditor value={content} onChange={setContent} rows={14} />
        </div>

        {/* קטגוריות */}
        <CategoryGrid
          categories={categories}
          subTopics={subTopics}
          selectedCatIds={selectedCats}
          selectedSubIds={selectedSubs}
          onChangeCats={setSelectedCats}
          onChangeSubs={setSelectedSubs}
          onSubTopicAdded={onSubTopicAdded}
          onSubTopicUpdated={onSubTopicUpdated}
        />

        {/* סטאטוס */}
        <div>
          <label className="text-sm font-medium text-gray-600 block mb-1">סטאטוס</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as "draft" | "published")}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none"
          >
            <option value="draft">טיוטה</option>
            <option value="published">מפורסם</option>
          </select>
        </div>

        {/* כפתורות */}
        <div className="flex gap-3 pt-1">
          <button
            onClick={handleSave}
            disabled={saving || !title.trim() || !content.trim()}
            className="px-5 py-2.5 rounded-xl font-bold text-sm text-white disabled:opacity-50"
            style={{ background: "var(--color-primary)" }}
          >
            {saving ? "שומר..." : "✓ שמור שינויים"}
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl font-medium text-sm text-gray-500 hover:bg-gray-100"
          >
            ביטול
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── שורת דבר תורה קיים ─────────────────────────────────────────────────────
function DivarRow({ item, canPublish, onPublish, onDelete, onEdit }: {
  item: DivarToraItem;
  canPublish?: boolean;
  onPublish: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (item: DivarToraItem) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [busy, startTransition] = useTransition();

  return (
    <div className="card">
      {showShare && <ShareModal item={item} onClose={() => setShowShare(false)} />}
      <div className="px-4 py-3 flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">{item.title}</p>
          {item.teaser && <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{item.teaser}</p>}
          <p className="text-xs text-gray-300 mt-1">
            {item.category?.hebrewName ?? "—"} ·{" "}
            {item.sourceType === "shiur" ? "מתמלול" : item.sourceType === "uploaded" ? "הועלה" : "ידני"} ·{" "}
            {new Date(item.publishedAt ?? item._createdAt).toLocaleDateString("he-IL")}
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {item.content && (
            <button onClick={() => setExpanded((e) => !e)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400" title="הצג תוכן">
              {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>
          )}
          {item.status === "published" && item.content && (
            <button
              onClick={() => {
                setShowShare(true);
                fetch("/api/track-share", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ _id: item._id }),
                }).catch(() => {});
              }}
              className="p-2 rounded-lg hover:bg-purple-50 text-gray-400 hover:text-purple-500"
              title="שתף ברשתות"
            >
              <Share2 size={15} />
            </button>
          )}
          {canPublish && (
            <button
              onClick={() => startTransition(() => onPublish(item._id))}
              disabled={busy}
              className="text-xs px-3 py-1.5 rounded-lg font-medium text-white disabled:opacity-50"
              style={{ background: "var(--color-primary)" }}
            >
              <CheckCircle size={13} className="inline ml-1" />פרסם
            </button>
          )}
          <button
            onClick={() => onEdit(item)}
            disabled={busy}
            className="p-2 rounded-lg hover:bg-blue-50 text-gray-300 hover:text-blue-500 disabled:opacity-40"
            title="ערוך"
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={() => { if (confirm("למחוק דבר תורה זה?")) startTransition(() => onDelete(item._id)); }}
            disabled={busy}
            className="p-2 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-400 disabled:opacity-40"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
      {expanded && item.content && (
        <div className="px-4 pb-4 text-sm text-gray-600 border-t border-gray-100 pt-3 whitespace-pre-wrap leading-relaxed">
          {item.content}
        </div>
      )}
    </div>
  );
}

// ─── כרטיסיית AI: עריכה + שמירה עם בחירת קטגוריות ───────────────────────
function AiPreviewCard({
  result, index, categories, subTopics, onSave, onDiscard, onSubTopicAdded, onSubTopicUpdated,
}: {
  result: AiResult;
  index: number;
  categories: CategoryItem[];
  subTopics: SubTopicItem[];
  onSave: (data: { title: string; teaser: string; content: string; categoryIds: string[]; subTopicIds: string[]; status: "draft" | "published" }) => Promise<void>;
  onDiscard: () => void;
  onSubTopicAdded?: (sub: SubTopicItem) => void;
  onSubTopicUpdated?: (sub: SubTopicItem) => void;
}) {
  const [title, setTitle] = useState(result.title);
  const [teaser, setTeaser] = useState(result.teaser);
  const [content, setContent] = useState(result.content);
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [selectedSubs, setSelectedSubs] = useState<string[]>([]);
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [saving, setSaving] = useState(false);

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;

  async function handleSave() {
    setSaving(true);
    try {
      await onSave({ title, teaser, content, categoryIds: selectedCats, subTopicIds: selectedSubs, status });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="border-2 rounded-2xl p-4 mb-4" style={{ borderColor: "var(--color-accent)", background: "#fffdf9" }}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ background: "var(--color-accent)" }}>
          דבר תורה {index + 1}
        </span>
        <span className="text-xs text-gray-400">{wordCount} מילים</span>
      </div>

      <div className="flex flex-col gap-3">
        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1">כותרת</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1">תקציר</label>
          <textarea value={teaser} onChange={(e) => setTeaser(e.target.value)} rows={2}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-200" />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1">תוכן</label>
          <MarkdownEditor value={content} onChange={setContent} rows={10} />
        </div>
        <CategoryGrid
          categories={categories}
          subTopics={subTopics}
          selectedCatIds={selectedCats}
          selectedSubIds={selectedSubs}
          onChangeCats={setSelectedCats}
          onChangeSubs={setSelectedSubs}
          onSubTopicAdded={onSubTopicAdded}
          onSubTopicUpdated={onSubTopicUpdated}
        />
        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1">פרסום</label>
          <select value={status} onChange={(e) => setStatus(e.target.value as "draft" | "published")}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none">
            <option value="draft">שמור כטיוטה</option>
            <option value="published">פרסם עכשיו</option>
          </select>
        </div>
        <div className="flex gap-2 pt-1">
          <button onClick={handleSave} disabled={saving || !title || !content}
            className="px-4 py-2 rounded-xl text-sm font-bold text-white disabled:opacity-50"
            style={{ background: "var(--color-primary)" }}>
            {saving ? "שומר..." : status === "published" ? "✓ פרסם" : "✓ שמור טיוטה"}
          </button>
          <button onClick={onDiscard} className="px-4 py-2 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-100">
            ✕ בטל
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── טופס AI (Gemini/Anthropic) ────────────────────────────────────────────
function AiMode({ categories, subTopics, onClose, onSaved, onSubTopicAdded, onSubTopicUpdated }: {
  categories: CategoryItem[];
  subTopics: SubTopicItem[];
  onClose: () => void;
  onSaved: () => void;
  onSubTopicAdded?: (sub: SubTopicItem) => void;
  onSubTopicUpdated?: (sub: SubTopicItem) => void;
}) {
  const [rawText, setRawText] = useState("");
  const [count, setCount] = useState(1);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResults, setAiResults] = useState<AiResult[]>([]);

  async function runAI() {
    if (!rawText.trim()) return;
    setAiLoading(true);
    setAiResults([]);
    try {
      const res = await fetch("/api/admin/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: rawText, count }),
      });
      const raw = await res.text();
      let data: { items?: AiResult[]; error?: string } & AiResult;
      try { data = JSON.parse(raw); }
      catch {
        alert(`שגיאה ${res.status}: ${raw.slice(0, 300) || "תגובה ריקה"}`);
        return;
      }
      if (!res.ok) {
        alert(`שגיאה ${res.status}: ${data.error ?? "לא ידוע"}`);
        return;
      }
      const items: AiResult[] = data.items ?? [{
        title: data.title, teaser: data.teaser, content: data.content, category: data.category
      }];
      if (!items[0]?.content) {
        alert("AI לא החזיר תוכן");
        return;
      }
      setAiResults(items);
    } catch (err) {
      alert(`שגיאת רשת: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setAiLoading(false);
    }
  }

  async function saveItem(index: number, data: { title: string; teaser: string; content: string; categoryIds: string[]; subTopicIds: string[]; status: "draft" | "published" }) {
    const res = await fetch("/api/admin/create-dvar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, sourceType: "shiur" }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(`שגיאה בשמירה: ${err.error ?? res.status}`);
      return;
    }
    setAiResults((prev) => prev.filter((_, i) => i !== index));
    onSaved();
  }

  function discardItem(index: number) {
    setAiResults((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div className="card p-5 mb-8 border-2" style={{ borderColor: "var(--color-accent)" }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold flex items-center gap-2" style={{ color: "var(--color-primary)" }}>
          <Sparkles size={18} /> ייצור עם AI
        </h3>
        <button onClick={onClose} className="text-sm text-gray-400 hover:text-gray-600">✕ סגור</button>
      </div>

      <div className="mb-4">
        <label className="text-sm font-medium text-gray-600 block mb-1.5">
          חומר גלם — תמליל שיעור, סיכום, או נקודות מפתח
        </label>
        <textarea value={rawText} onChange={(e) => setRawText(e.target.value)}
          placeholder="הדבק כאן תמליל מיוטיוב, טקסט חופשי, או כמה נקודות מפתח..."
          rows={6}
          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-200 leading-relaxed" />
      </div>

      <div className="flex items-center gap-4 mb-4">
        <span className="text-sm font-medium text-gray-600">כמה דברי תורה לייצר?</span>
        <div className="flex items-center gap-2">
          <button onClick={() => setCount((c) => Math.max(1, c - 1))}
            className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 text-gray-500">
            <Minus size={13} />
          </button>
          <span className="w-6 text-center font-bold text-sm" style={{ color: "var(--color-primary)" }}>{count}</span>
          <button onClick={() => setCount((c) => Math.min(5, c + 1))}
            className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 text-gray-500">
            <Plus size={13} />
          </button>
        </div>
      </div>

      <button onClick={runAI} disabled={aiLoading || !rawText.trim()}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50"
        style={{ background: "var(--color-primary)" }}>
        <Sparkles size={15} />
        {aiLoading ? `מייצר ${count > 1 ? count + " דברי תורה" : "דבר תורה"}...` : "צור עם AI"}
      </button>

      {aiResults.length > 0 && (
        <div className="mt-6">
          <p className="text-sm font-bold mb-3" style={{ color: "var(--color-primary)" }}>
            ✓ AI יצר {aiResults.length} דבר{aiResults.length > 1 ? "י" : ""} תורה — ערוך, בחר קטגוריות ואשר
          </p>
          {aiResults.map((result, i) => (
            <AiPreviewCard key={i} result={result} index={i} categories={categories} subTopics={subTopics}
              onSave={(d) => saveItem(i, d)} onDiscard={() => discardItem(i)} onSubTopicAdded={onSubTopicAdded} onSubTopicUpdated={onSubTopicUpdated} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── טופס העלאה ידנית ──────────────────────────────────────────────────────
function ManualMode({ categories, subTopics, onClose, onSaved, onSubTopicAdded, onSubTopicUpdated }: {
  categories: CategoryItem[];
  subTopics: SubTopicItem[];
  onClose: () => void;
  onSaved: () => void;
  onSubTopicAdded?: (sub: SubTopicItem) => void;
  onSubTopicUpdated?: (sub: SubTopicItem) => void;
}) {
  const [title, setTitle] = useState("");
  const [teaser, setTeaser] = useState("");
  const [content, setContent] = useState("");
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [selectedSubs, setSelectedSubs] = useState<string[]>([]);
  const [status, setStatus] = useState<"draft" | "published">("published");
  const [saving, setSaving] = useState(false);
  const [teaserLoading, setTeaserLoading] = useState(false);

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  const canSave = title.trim() && content.trim() && selectedCats.length > 0 && !saving;

  async function generateTeaser() {
    if (!content.trim()) return;
    setTeaserLoading(true);
    try {
      const res = await fetch("/api/admin/gen-teaser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const data = await res.json() as { teaser?: string; error?: string };
      if (data.teaser) setTeaser(data.teaser);
      else alert(`שגיאה: ${data.error ?? "לא ידוע"}`);
    } catch (err) {
      alert(`שגיאת רשת: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setTeaserLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/create-dvar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title, teaser, content,
          categoryIds: selectedCats,
          subTopicIds: selectedSubs,
          status,
          sourceType: "manual",
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(`שגיאה בשמירה: ${err.error ?? res.status}`);
        return;
      }
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card p-5 mb-8 border-2" style={{ borderColor: "var(--color-primary)" }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold flex items-center gap-2" style={{ color: "var(--color-primary)" }}>
          <Upload size={18} /> העלאת דבר תורה מוכן
        </h3>
        <button onClick={onClose} className="text-sm text-gray-400 hover:text-gray-600">✕ סגור</button>
      </div>

      <div className="flex flex-col gap-4">
        <div>
          <label className="text-sm font-medium text-gray-600 block mb-1">כותרת *</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="לדוגמה: מה שמשה לא יכול להבין"
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm font-medium text-gray-600">תוכן הדבר תורה *</label>
            <span className="text-xs text-gray-400">{wordCount} מילים</span>
          </div>
          <MarkdownEditor
            value={content}
            onChange={setContent}
            rows={14}
            placeholder="הדבק כאן את הדבר תורה המוכן שלך... תומך ב-**מודגש**, *מוטה*, > ציטוט"
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-200 leading-relaxed font-serif"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm font-medium text-gray-600">תקציר</label>
            <button
              type="button"
              onClick={generateTeaser}
              disabled={teaserLoading || !content.trim()}
              className="flex items-center gap-1 text-xs font-medium disabled:opacity-40 transition-opacity"
              style={{ color: "var(--color-accent)" }}
            >
              <Sparkles size={12} />
              {teaserLoading ? "מייצר..." : "✨ צור תקציר אוטומטי"}
            </button>
          </div>
          <textarea value={teaser} onChange={(e) => setTeaser(e.target.value)} rows={2}
            placeholder="1-2 משפטים שמגרים לקרוא (אפשר לצור אוטומטית אחרי הוספת תוכן)"
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-200" />
        </div>

        <CategoryGrid
          categories={categories}
          subTopics={subTopics}
          selectedCatIds={selectedCats}
          selectedSubIds={selectedSubs}
          onChangeCats={setSelectedCats}
          onChangeSubs={setSelectedSubs}
          onSubTopicAdded={onSubTopicAdded}
          onSubTopicUpdated={onSubTopicUpdated}
        />
        {selectedCats.length === 0 && (
          <p className="text-xs text-amber-600">⚠ חובה לבחור לפחות קטגוריה אחת</p>
        )}

        <div>
          <label className="text-sm font-medium text-gray-600 block mb-1">פרסום</label>
          <select value={status} onChange={(e) => setStatus(e.target.value as "draft" | "published")}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none">
            <option value="published">פרסם עכשיו</option>
            <option value="draft">שמור כטיוטה</option>
          </select>
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={handleSave} disabled={!canSave}
            className="px-5 py-2.5 rounded-xl font-bold text-sm text-white disabled:opacity-50"
            style={{ background: "var(--color-primary)" }}>
            {saving ? "שומר..." : status === "published" ? "✓ פרסם" : "✓ שמור טיוטה"}
          </button>
          <button onClick={onClose}
            className="px-5 py-2.5 rounded-xl font-medium text-sm text-gray-500 hover:bg-gray-100">
            ביטול
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── קומפוננטה ראשית ─────────────────────────────────────────────────────────
export default function DivreiToraList({ drafts, published, categories, subTopics }: Props) {
  const router = useRouter();
  const [mode, setMode] = useState<"none" | "ai" | "manual">("none");
  const [editingItem, setEditingItem] = useState<DivarToraItem | null>(null);
  const [localSubTopics, setLocalSubTopics] = useState<SubTopicItem[]>(subTopics);

  // סנכרון עם props אחרי router.refresh — שומר על הוספות מקומיות שטרם נסנכרנו
  useEffect(() => {
    setLocalSubTopics((prev) => {
      const ids = new Set(subTopics.map((s) => s._id));
      const localOnly = prev.filter((s) => !ids.has(s._id));
      return [...subTopics, ...localOnly];
    });
  }, [subTopics]);

  function handleSubTopicAdded(sub: SubTopicItem) {
    setLocalSubTopics((prev) => [...prev, sub]);
  }

  function handleSubTopicUpdated(sub: SubTopicItem) {
    setLocalSubTopics((prev) =>
      prev.map((s) => (s._id === sub._id ? { ...s, ...sub } : s))
    );
  }

  function refresh() {
    setMode("none");
    router.refresh();
  }

  function handleEditSaved() {
    setEditingItem(null);
    router.refresh();
  }

  async function publishItem(id: string) {
    await fetch("/api/admin/publish", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    router.refresh();
  }

  async function deleteItem(id: string) {
    await fetch("/api/admin/delete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    router.refresh();
  }

  return (
    <div>
      {editingItem && (
        <EditModal
          item={editingItem}
          categories={categories}
          subTopics={localSubTopics}
          onClose={() => setEditingItem(null)}
          onSaved={handleEditSaved}
          onSubTopicAdded={handleSubTopicAdded}
          onSubTopicUpdated={handleSubTopicUpdated}
        />
      )}
      {/* בחירת מצב יצירה */}
      {mode === "none" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <button
            onClick={() => setMode("ai")}
            className="card p-5 flex items-start gap-4 text-right hover:shadow-md transition-all border-2 border-transparent hover:border-amber-200"
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: "var(--color-warm)" }}
            >
              <Sparkles size={22} style={{ color: "var(--color-accent)" }} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-base mb-1" style={{ color: "var(--color-primary)" }}>
                ייצור עם AI
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                העלה תמליל / סיכום, ה-AI יכתוב דבר תורה בסגנונך
              </p>
            </div>
          </button>

          <button
            onClick={() => setMode("manual")}
            className="card p-5 flex items-start gap-4 text-right hover:shadow-md transition-all border-2 border-transparent hover:border-blue-200"
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: "var(--color-warm)" }}
            >
              <Upload size={22} style={{ color: "var(--color-primary)" }} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-base mb-1" style={{ color: "var(--color-primary)" }}>
                העלאת דבר תורה מוכן
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                כתבת בעצמך — הדבק, בחר קטגוריות ותתי-נושאים, פרסם
              </p>
            </div>
          </button>
        </div>
      )}

      {mode === "ai" && (
        <AiMode categories={categories} subTopics={localSubTopics} onClose={() => setMode("none")} onSaved={refresh} onSubTopicAdded={handleSubTopicAdded} onSubTopicUpdated={handleSubTopicUpdated} />
      )}
      {mode === "manual" && (
        <ManualMode categories={categories} subTopics={localSubTopics} onClose={() => setMode("none")} onSaved={refresh} onSubTopicAdded={handleSubTopicAdded} onSubTopicUpdated={handleSubTopicUpdated} />
      )}

      {/* טיוטות */}
      {drafts.length > 0 && (
        <section className="mb-8">
          <h2 className="font-bold mb-3" style={{ color: "var(--color-primary)" }}>טיוטות ({drafts.length})</h2>
          <div className="flex flex-col gap-2">
            {drafts.map((item) => (
              <DivarRow key={item._id} item={item} canPublish onPublish={publishItem} onDelete={deleteItem} onEdit={setEditingItem} />
            ))}
          </div>
        </section>
      )}

      {/* מפורסמים */}
      {published.length > 0 && (
        <section>
          <h2 className="font-bold mb-3" style={{ color: "var(--color-primary)" }}>מפורסמים ({published.length})</h2>
          <div className="flex flex-col gap-2">
            {published.map((item) => (
              <DivarRow key={item._id} item={item} onPublish={publishItem} onDelete={deleteItem} onEdit={setEditingItem} />
            ))}
          </div>
        </section>
      )}

      {drafts.length === 0 && published.length === 0 && mode === "none" && (
        <div className="text-center py-12 text-gray-400">
          <p className="text-sm">אין דברי תורה עדיין — בחר מצב ליצירה</p>
        </div>
      )}
    </div>
  );
}
