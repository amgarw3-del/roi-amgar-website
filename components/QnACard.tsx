"use client";

import { useState } from "react";
import { HelpCircle, CheckCircle2, ChevronDown } from "lucide-react";

interface QnACardProps {
  _id: string;
  question: string;
  answer: string;
  slug?: { current: string };
  category?: { hebrewName: string; slug: { current: string } };
  publishedAt?: string;
  answerType?: string;
}

export default function QnACard({
  question,
  answer,
  category,
  answerType,
}: QnACardProps) {
  const [expanded, setExpanded] = useState(false);
  const isLong = answer.length > 200;
  const shortAnswer = isLong ? answer.slice(0, 200) + "..." : answer;

  return (
    <div className="card block p-5">
      {/* Question */}
      <div className="flex gap-3 mb-4">
        <HelpCircle
          size={20}
          className="flex-shrink-0 mt-0.5"
          style={{ color: "var(--color-accent)" }}
        />
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            {category && <span className="badge text-xs">{category.hebrewName}</span>}
            {answerType === "practical" && (
              <span className="badge text-xs" style={{ background: "#fef3c7", color: "#92400e" }}>
                למעשה
              </span>
            )}
          </div>
          <p className="font-bold text-gray-900 leading-snug">{question}</p>
        </div>
      </div>

      {/* Answer */}
      <div className="flex gap-3">
        <CheckCircle2
          size={20}
          className="flex-shrink-0 mt-0.5"
          style={{ color: "var(--color-primary)" }}
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold mb-1" style={{ color: "var(--color-primary)" }}>
            תשובת הרב:
          </p>
          <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
            {expanded ? answer : shortAnswer}
          </p>
          {isLong && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="mt-2 inline-flex items-center gap-1 text-sm font-semibold hover:underline"
              style={{ color: "var(--color-primary)" }}
              aria-expanded={expanded}
            >
              {expanded ? "הסתר" : "קרא תשובה מלאה"}
              <ChevronDown
                size={16}
                style={{
                  transition: "transform 0.2s",
                  transform: expanded ? "rotate(180deg)" : "rotate(0)",
                }}
              />
            </button>
          )}
        </div>
      </div>

      {/* Attribution */}
      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
        <p className="text-xs text-gray-400">
          נכתב ע"י הרב רועי אמגר
        </p>
        {answerType === "for-learning" && (
          <p className="text-xs text-gray-400">לצורך לימוד בלבד</p>
        )}
      </div>
    </div>
  );
}
