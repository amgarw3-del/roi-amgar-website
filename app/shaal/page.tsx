import { client, queries } from "@/sanity/client";
import QnACard from "@/components/QnACard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "שאל את הרב",
  description: "שלח שאלה לרב רועי אמגר וקבל תשובה. ארכיון שאלות ותשובות הלכתיות הניתן לחיפוש.",
};

export const dynamic = "force-dynamic";

const ERROR_MESSAGES: Record<string, string> = {
  short: "השאלה קצרה מדי — נסה לכתוב לפחות 10 תווים.",
  spam: "לא ניתן לכלול קישורים בשאלה.",
  invalid: "שליחת השאלה נכשלה. בדוק את השדות ונסה שוב.",
  rate: "שלחת יותר מדי שאלות. נסה שוב מאוחר יותר.",
  server: "אירעה שגיאה בשרת. נסה שוב בעוד מספר רגעים.",
};

export default async function ShaalPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; error?: string }>;
}) {
  const { sent, error } = await searchParams;
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
          <h1 className="text-3xl font-bold mb-3" style={{ color: "var(--color-bg-paper)" }}>שאל את הרב</h1>
          <p className="text-white/80 text-lg max-w-lg mx-auto">
            שלח שאלה לרב רועי אמגר. שאלות נבחרות יפורסמו בארכיון לתועלת הציבור.
          </p>
        </div>
      </section>

      {/* טופס שאלה */}
      <section className="section" style={{ background: "var(--color-warm)" }}>
        <div className="container">
          <div className="max-w-xl mx-auto card p-8">
            {sent === "1" && (
              <div className="mb-5 p-4 rounded-xl text-sm font-semibold text-green-800 border border-green-200" style={{ background: "#ecfdf5" }}>
                ✅ תודה! השאלה התקבלה ונשלחה לרב. תיענה בעז&quot;ה בקרוב.
              </div>
            )}
            {error && (
              <div className="mb-5 p-4 rounded-xl text-sm font-semibold text-red-800 border border-red-200" style={{ background: "#fef2f2" }}>
                ⚠️ {ERROR_MESSAGES[error] ?? "אירעה שגיאה. נסה שוב."}
              </div>
            )}

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
                <label className="block text-sm font-semibold text-gray-700 mb-1">מספר טלפון / וואטסאפ</label>
                <input
                  name="phone"
                  type="tel"
                  placeholder="05x-xxxxxxx"
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary focus:outline-none"
                  dir="ltr"
                />
                <p className="text-xs text-gray-400 mt-1 text-right">
                  אם שאלתך אישית ואינה מיועדת לפרסום — חשוב להשאיר מספר כדי שהרב יוכל לענות לך בפרטי.
                </p>
              </div>

              <button type="submit" className="btn-primary w-full">
                שלח שאלה
              </button>
            </form>

            <div
              className="mt-4 p-3 rounded-lg text-xs text-gray-500"
              style={{ background: "#fef9e7" }}
            >
              ⚠️ לא כל השאלות מפורסמות באתר — לפעמים הרב משיב בפרטי ישירות לשואל. לפסיקה למעשה בנסיבות אישיות — פנה לרב ישירות.
            </div>
            <a
              href="https://wa.me/972504305525"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ background: "#25d366" }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              שאל ישירות בוואטסאפ
            </a>
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
