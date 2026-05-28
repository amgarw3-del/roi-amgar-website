"use client";

import { useState } from "react";
import { BookOpen, Tag, Pencil, Plus } from "lucide-react";

export type CategoryItem = { _id: string; hebrewName: string; slug: { current: string } };
export type SubTopicItem = { _id: string; hebrewName: string; slug: { current: string }; group?: string };

export const SUBTOPIC_GROUPS = [
  { value: "moed", title: "מועדים" },
  { value: "parasha", title: "פרשיות" },
  { value: "fast", title: "צומות" },
  { value: "national", title: "מועדים לאומיים" },
  { value: "general", title: "כללי" },
] as const;

export default function CategoryGrid({
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

  const groups = subTopics.reduce<Record<string, SubTopicItem[]>>((acc, st) => {
    const g = st.group ?? "כללי";
    if (!acc[g]) acc[g] = [];
    acc[g].push(st);
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-3">
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
