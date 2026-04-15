import { client, queries } from "@/sanity/client";
import QnACard from "@/components/QnACard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "שאל את הרב",
  description: "שלח שאלה לרב רועי אמגר וקבל תשובה. ארכיון שאלות ותשובות הלכתיות הניתן לחיפוש.",
};

export const revalidate = 3600;

export default async function ShaalPage() {
  const qnas = await client.fetch(queries.latestQna(20)).catch(() => []);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: qnas.map((q: { question: string; answer: string }) => ({
      "@type": "Question",
      name: q.question,
      acceptedAnswer: { "@type": "Answer", text: q.answer },
    })),
  };

  return (
    <>
      {qnas.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      )}

      {/* Hero */}
      <section
        className="py-12 text-center"
        style={{ background: "linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%)" }}
      >
        <div className="container">
          <h1 className="text-3xl font-bold text-white mb-3">שאל את הרב</h1>
          <p className="text-white/80 text-lg max-w-lg mx-auto">
            שלח שאלה לרב רועי אמגר. שאלות נבחרות יפורסמו בארכיון לתועלת הציבור.
          </p>
        </div>
      </section>

      {/* טופס שאלה */}
      <section className="section" style={{ background: "var(--color-warm)" }}>
        <div className="container">
          <div className="max-w-xl mx-auto card p-8">
            <h2 className="text-xl font-bold mb-2" style={{ color: "var(--color-primary)" }}>
              שלח שאלה
            </h2>
            <p className="text-gray-500 text-sm mb-6">
              הרב עונה בתוך מספר ימים. שאלות מתאימות יפורסמו בארכיון ללא שם השואל.
            </p>

            <form action="/api/ask" method="POST" className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">שמך (אופציונלי)</label>
                <input
                  name="name"
                  type="text"
                  placeholder="שם פרטי"
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary focus:outline-none"
                  dir="rtl"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">שאלתך *</label>
                <textarea
                  name="question"
                  required
                  rows={5}
                  placeholder="כתוב את שאלתך כאן..."
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary focus:outline-none resize-none"
                  dir="rtl"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">סוג שאלה</label>
                <select
                  name="questionType"
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:outline-none"
                  dir="rtl"
                >
                  <option value="general">כללית (לצורך לימוד)</option>
                  <option value="practical-ruling">למעשה</option>
                  <option value="personal">אישית (לא לפרסום)</option>
                </select>
              </div>

              <button type="submit" className="btn-primary w-full">
                שלח שאלה
              </button>
            </form>

            <div
              className="mt-4 p-3 rounded-lg text-xs text-gray-500"
              style={{ background: "#fef9e7" }}
            >
              ⚠️ תשובות מפורסמות ניתנות לצורך לימוד בלבד. לפסיקה למעשה בנסיבות אישיות — פנה לרב ישירות.
            </div>
          </div>
        </div>
      </section>

      {/* ארכיון שו"ת */}
      <section className="section">
        <div className="container">
          <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--color-primary)" }}>
            ארכיון שאלות ותשובות
          </h2>
          <div className="divider mb-6" />

          {qnas.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {qnas.map((q: any) => <QnACard key={q._id} {...q} />)}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <p className="text-lg">שאלות ותשובות יתווספו בקרוב</p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
