"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, Globe, GlobeLock, Pencil, Trash2, X } from "lucide-react";
import type { QnaItem } from "@/app/admin/content/qna/page";
import CategoryGrid, { type CategoryItem, type SubTopicItem } from "@/components/admin/CategoryGrid";
import MarkdownEditor from "@/components/admin/MarkdownEditor";
import DivarToraContent from "@/components/DivarToraContent";

interface Props {
  unanswered: QnaItem[];
  answered: QnaItem[];
  published: QnaItem[];
  categories: CategoryItem[];
  subTopics: SubTopicItem[];
}

function EditQnaModal({
  item,
  categories,
  subTopics,
  onClose,
  onSaved,
  onSubTopicAdded,
  onSubTopicUpdated,
}: {
  item: QnaItem;
  categories: CategoryItem[];
  subTopics: SubTopicItem[];
  onClose: () => void;
  onSaved: () => void;
  onSubTopicAdded?: (sub: SubTopicItem) => void;
  onSubTopicUpdated?: (sub: SubTopicItem) => void;
}) {
  const [question, setQuestion] = useState(item.question ?? "");
  const [answer, setAnswer] = useState(item.answer ?? "");
  const [selectedCats, setSelectedCats] = useState<string[]>(() => {
    const cats: string[] = [];
    if (item.category?._id) cats.push(item.category._id);
    if (item.extraCategories) cats.push(...item.extraCategories.map((c) => c._id));
    return cats;
  });
  const [selectedSubs, setSelectedSubs] = useState<string[]>(
    item.subTopics?.map((s) => s._id) ?? []
  );
  const [isPublic, setIsPublic] = useState<boolean>(item.isPublic);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!question.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/update-qna", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: item._id,
          question,
          answer,
          categoryIds: selectedCats,
          subTopicIds: selectedSubs,
          isPublic,
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
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-bold text-lg flex items-center gap-2" style={{ color: "var(--color-primary)" }}>
            <Pencil size={18} /> עריכת שאלה
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X size={18} />
          </button>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-600 block mb-1">שאלה *</label>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-600 block mb-1">תשובה</label>
          <MarkdownEditor value={answer} onChange={setAnswer} rows={8} placeholder="הכנס תשובה..." />
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
          <label className="text-sm font-medium text-gray-600 block mb-1">סטאטוס פרסום</label>
          <select
            value={isPublic ? "public" : "private"}
            onChange={(e) => setIsPublic(e.target.value === "public")}
            disabled={!answer.trim()}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none disabled:opacity-50"
          >
            <option value="private">לא מפורסם</option>
            <option value="public">מפורסם באתר</option>
          </select>
          {!answer.trim() && (
            <p className="text-xs text-gray-400 mt-1">חייב להזין תשובה לפני פרסום</p>
          )}
        </div>

        <div className="flex gap-3 pt-1">
          <button
            onClick={handleSave}
            disabled={saving || !question.trim()}
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

function QnaRow({
  item,
  onAnswerSave,
  onTogglePublish,
  onDelete,
  onEdit,
}: {
  item: QnaItem;
  onAnswerSave: (id: string, answer: string) => Promise<void>;
  onTogglePublish: (id: string, pub: boolean) => Promise<void>;
  onDelete: (id: string) => void;
  onEdit: (item: QnaItem) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editingInline, setEditingInline] = useState(false);
  const [answerText, setAnswerText] = useState(item.answer ?? "");
  const [busy, startTransition] = useTransition();

  const statusColor = item.isPublic
    ? "bg-green-50 text-green-700"
    : item.answer
    ? "bg-yellow-50 text-yellow-700"
    : "bg-red-50 text-red-600";

  const statusLabel = item.isPublic ? "מפורסם" : item.answer ? "נענה" : "ממתין לתשובה";

  const allCats = [
    ...(item.category ? [item.category] : []),
    ...(item.extraCategories ?? []),
  ];

  return (
    <div className="card">
      <div className="px-4 py-3 flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor}`}>
              {statusLabel}
            </span>
            {item.askerName && (
              <span className="text-xs text-gray-400">{item.askerName}</span>
            )}
            <span className="text-xs text-gray-300">
              {new Date(item._createdAt).toLocaleDateString("he-IL")}
            </span>
          </div>
          <p className="text-sm font-medium leading-snug">{item.question}</p>
          {(allCats.length > 0 || (item.subTopics && item.subTopics.length > 0)) && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {allCats.map((c) => (
                <span
                  key={c._id}
                  className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                  style={{ background: "var(--color-warm)", color: "var(--color-primary)" }}
                >
                  {c.hebrewName}
                </span>
              ))}
              {item.subTopics?.map((s) => (
                <span
                  key={s._id}
                  className="text-[10px] px-2 py-0.5 rounded-full font-medium text-white"
                  style={{ background: "var(--color-accent)" }}
                >
                  {s.hebrewName}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => startTransition(() => onTogglePublish(item._id, !item.isPublic))}
            disabled={busy || !item.answer}
            title={item.isPublic ? "הסתר מהאתר" : "פרסם באתר"}
            className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30"
          >
            {item.isPublic ? <GlobeLock size={15} className="text-green-600" /> : <Globe size={15} className="text-gray-400" />}
          </button>
          <button
            onClick={() => onEdit(item)}
            disabled={busy}
            className="p-2 rounded-lg hover:bg-blue-50 text-gray-300 hover:text-blue-500 disabled:opacity-40"
            title="ערוך / שייך קטגוריות"
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={() => { if (confirm("למחוק שאלה זו?")) startTransition(() => onDelete(item._id)); }}
            disabled={busy}
            className="p-2 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-400 disabled:opacity-40"
            title="מחק שאלה"
          >
            <Trash2 size={15} />
          </button>
          <button
            onClick={() => setExpanded((e) => !e)}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-400"
          >
            {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-100 pt-3">
          {!editingInline ? (
            <>
              {item.answer ? (
                <div className="text-sm text-gray-600 mb-3">
                  <DivarToraContent content={item.answer} />
                </div>
              ) : (
                <p className="text-sm text-gray-300 mb-3">טרם נענה</p>
              )}
              <button
                onClick={() => setEditingInline(true)}
                className="text-xs px-3 py-1.5 rounded-lg font-medium text-white"
                style={{ background: "var(--color-primary)" }}
              >
                {item.answer ? "ערוך תשובה" : "הוסף תשובה"}
              </button>
            </>
          ) : (
            <>
              <div className="mb-3">
                <MarkdownEditor value={answerText} onChange={setAnswerText} rows={6} placeholder="הכנס תשובה..." />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    startTransition(() =>
                      onAnswerSave(item._id, answerText).then(() => setEditingInline(false))
                    )
                  }
                  disabled={busy}
                  className="text-xs px-3 py-1.5 rounded-lg font-medium text-white disabled:opacity-50"
                  style={{ background: "var(--color-primary)" }}
                >
                  שמור
                </button>
                <button
                  onClick={() => setEditingInline(false)}
                  className="text-xs px-3 py-1.5 rounded-lg font-medium text-gray-500 hover:bg-gray-100"
                >
                  ביטול
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function QnaList({ unanswered, answered, published, categories, subTopics }: Props) {
  const router = useRouter();
  const [editingItem, setEditingItem] = useState<QnaItem | null>(null);
  const [localSubTopics, setLocalSubTopics] = useState<SubTopicItem[]>(subTopics);

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
    setLocalSubTopics((prev) => prev.map((s) => (s._id === sub._id ? { ...s, ...sub } : s)));
  }

  async function saveAnswer(id: string, answer: string) {
    await fetch("/api/admin/answer-qna", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, answer }),
    });
    router.refresh();
  }

  async function togglePublish(id: string, pub: boolean) {
    await fetch("/api/admin/answer-qna", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, publish: pub }),
    });
    router.refresh();
  }

  async function deleteItem(id: string) {
    await fetch("/api/admin/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    router.refresh();
  }

  function handleEditSaved() {
    setEditingItem(null);
    router.refresh();
  }

  const Section = ({ title, items }: { title: string; items: QnaItem[] }) =>
    items.length === 0 ? null : (
      <section className="mb-8">
        <h2 className="font-bold mb-3" style={{ color: "var(--color-primary)" }}>{title} ({items.length})</h2>
        <div className="flex flex-col gap-2">
          {items.map((item) => (
            <QnaRow
              key={item._id}
              item={item}
              onAnswerSave={saveAnswer}
              onTogglePublish={togglePublish}
              onDelete={deleteItem}
              onEdit={setEditingItem}
            />
          ))}
        </div>
      </section>
    );

  return (
    <div>
      {editingItem && (
        <EditQnaModal
          item={editingItem}
          categories={categories}
          subTopics={localSubTopics}
          onClose={() => setEditingItem(null)}
          onSaved={handleEditSaved}
          onSubTopicAdded={handleSubTopicAdded}
          onSubTopicUpdated={handleSubTopicUpdated}
        />
      )}
      <Section title="ממתינים לתשובה" items={unanswered} />
      <Section title="נענו — ממתינים לפרסום" items={answered} />
      <Section title="מפורסמים" items={published} />
    </div>
  );
}
