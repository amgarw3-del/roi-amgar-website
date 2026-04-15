import Link from "next/link";
import { HelpCircle, CheckCircle2 } from "lucide-react";

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
  slug,
  category,
  answerType,
}: QnACardProps) {
  const shortAnswer = answer.length > 200 ? answer.slice(0, 200) + "..." : answer;
  const href = slug ? `/shaal/${slug.current}` : "#";

  return (
    <Link href={href} className="card block group p-5">
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

      {/* Answer preview */}
      <div className="flex gap-3">
        <CheckCircle2
          size={20}
          className="flex-shrink-0 mt-0.5"
          style={{ color: "var(--color-primary)" }}
        />
        <div>
          <p className="text-sm font-semibold mb-1" style={{ color: "var(--color-primary)" }}>
            תשובת הרב:
          </p>
          <p className="text-gray-600 text-sm leading-relaxed">{shortAnswer}</p>
          {answer.length > 200 && (
            <span
              className="text-sm font-semibold mt-2 inline-block"
              style={{ color: "var(--color-primary)" }}
            >
              קרא תשובה מלאה ←
            </span>
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
    </Link>
  );
}
