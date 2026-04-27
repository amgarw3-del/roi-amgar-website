"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, Globe, GlobeLock } from "lucide-react";
import type { QnaItem } from "@/app/admin/content/qna/page";

function QnaRow({ item, onAnswerSave, onTogglePublish }: {
  item: QnaItem;
  onAnswerSave: (id: string, answer: string) => Promise<void>;
  onTogglePublish: (id: string, pub: boolean) => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [answerText, setAnswerText] = useState(item.answer ?? "");
  const [busy, startTransition] = useTransition();

  const statusColor = item.isPublic
    ? "bg-green-50 text-green-700"
    : item.answer
    ? "bg-yellow-50 text-yellow-700"
    : "bg-red-50 text-red-600";

  const statusLabel = item.isPublic ? "מפורסם" : item.answer ? "נענה" : "ממתין לתשובה";

  return (
    <div className="card">
      <div className="px-4 py-3 flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
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
            onClick={() => setExpanded((e) => !e)}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-400"
          >
            {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-100 pt-3">
          {!editing ? (
            <>
              {item.answer ? (
                <p className="text-sm text-gray-600 whitespace-pre-wrap mb-3">{item.answer}</p>
              ) : (
                <p className="text-sm text-gray-300 mb-3">טרם נענה</p>
              )}
              <button
                onClick={() => setEditing(true)}
                className="text-xs px-3 py-1.5 rounded-lg font-medium text-white"
                style={{ background: "var(--color-primary)" }}
              >
                {item.answer ? "ערוך תשובה" : "הוסף תשובה"}
              </button>
            </>
          ) : (
            <>
              <textarea
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
                rows={6}
                placeholder="הכנס תשובה..."
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-200 mb-3"
              />
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    startTransition(() =>
                      onAnswerSave(item._id, answerText).then(() => setEditing(false))
                    )
                  }
                  disabled={busy}
                  className="text-xs px-3 py-1.5 rounded-lg font-medium text-white disabled:opacity-50"
                  style={{ background: "var(--color-primary)" }}
                >
                  שמור
                </button>
                <button
                  onClick={() => setEditing(false)}
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

export default function QnaList({ unanswered, answered, published }: {
  unanswered: QnaItem[];
  answered: QnaItem[];
  published: QnaItem[];
}) {
  const router = useRouter();

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

  const Section = ({ title, items }: { title: string; items: QnaItem[] }) =>
    items.length === 0 ? null : (
      <section className="mb-8">
        <h2 className="font-bold mb-3" style={{ color: "var(--color-primary)" }}>{title} ({items.length})</h2>
        <div className="flex flex-col gap-2">
          {items.map((item) => (
            <QnaRow key={item._id} item={item} onAnswerSave={saveAnswer} onTogglePublish={togglePublish} />
          ))}
        </div>
      </section>
    );

  return (
    <div>
      <Section title="ממתינים לתשובה" items={unanswered} />
      <Section title="נענו — ממתינים לפרסום" items={answered} />
      <Section title="מפורסמים" items={published} />
    </div>
  );
}
