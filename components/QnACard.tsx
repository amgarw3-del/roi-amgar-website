"use client";

import Link from "next/link";
import { useState } from "react";
import { HelpCircle, CheckCircle2, ChevronDown, Share2, Link as LinkIcon, Check } from "lucide-react";

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
  _id,
  question,
  answer,
  slug,
  category,
  answerType,
}: QnACardProps) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const isLong = answer.length > 200;
  const shortAnswer = isLong ? answer.slice(0, 200) + "..." : answer;

  const pageHref = `/shaal/${slug?.current ?? _id}`;
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.haravroiamgar.com";
  const shareUrl = `${SITE_URL}${pageHref}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(`${question}\n\n${shareUrl}`)}`;

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

      {/* Actions: open page + share */}
      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-2 flex-wrap">
        <Link
          href={pageHref}
          className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border hover:bg-gray-50"
          style={{ color: "var(--color-primary)", borderColor: "var(--color-primary)" }}
        >
          פתח בעמוד נפרד ←
        </Link>
        <button
          type="button"
          onClick={handleCopyLink}
          className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
          aria-label="העתק קישור לתשובה"
        >
          {copied ? <Check size={14} /> : <LinkIcon size={14} />}
          {copied ? "הועתק" : "העתק קישור"}
        </button>
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg text-white"
          style={{ background: "#25d366" }}
          aria-label="שתף בוואטסאפ"
        >
          <Share2 size={14} />
          שתף
        </a>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <p className="text-xs text-gray-400">נכתב ע"י הרב רועי אמגר</p>
        {answerType === "for-learning" && (
          <p className="text-xs text-gray-400">לצורך לימוד בלבד</p>
        )}
      </div>
    </div>
  );
}
