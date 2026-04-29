"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const fallbackFaqs = [
  {
    question: "האם הרב מגיע גם מחוץ לאזור המרכז?",
    answer: "הרב מרצה ברחבי הארץ. נשמח לתאם הגעה לכל אזור — צרו קשר ונבדוק זמינות.",
  },
  {
    question: "כמה זמן מראש כדאי לתאם הרצאה?",
    answer: "ככל שמתאמים מוקדם יותר — כך קל יותר למצוא תאריך מתאים. גם הזמנות לטווח קצר אפשריות בכפוף לזמינות.",
  },
  {
    question: "האם ניתן לבקש נושא ספציפי המתאים לקהל שלנו?",
    answer: "בהחלט. הרב מתאים את התוכן לקהל היעד ולמטרת האירוע — בית כנסת, שבת עיון, ועד קהילה או אירוע משפחתי.",
  },
];

export default function LectureFAQ({
  faqs,
}: {
  faqs?: { _id?: string; question: string; answer: string }[];
}) {
  const [open, setOpen] = useState<number | null>(0);
  const items = faqs && faqs.length > 0 ? faqs : fallbackFaqs;

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div
          key={(item as { _id?: string })._id ?? i}
          className="card overflow-hidden"
          style={{ background: "white" }}
        >
          <button
            type="button"
            className="w-full flex items-center justify-between p-5 text-right"
            onClick={() => setOpen(open === i ? null : i)}
          >
            <span className="font-semibold text-gray-900 text-lg">{item.question}</span>
            <ChevronDown
              size={20}
              className="transition-transform flex-shrink-0"
              style={{
                transform: open === i ? "rotate(180deg)" : "rotate(0)",
                color: "var(--color-primary)",
              }}
            />
          </button>
          {open === i && (
            <div className="px-5 pb-5 text-gray-700 leading-relaxed">{item.answer}</div>
          )}
        </div>
      ))}
    </div>
  );
}
