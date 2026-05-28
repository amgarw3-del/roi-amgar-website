import { client } from "@/sanity/client";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HelpCircle, CheckCircle2, ArrowRight } from "lucide-react";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

const QNA_BY_SLUG = `*[_type == "qna" && (slug.current == $slug || _id == $slug) && isPublic == true][0]{
  _id, question, answer, questionType, answerType,
  category->{hebrewName, slug},
  publishedAt, hebrewDate
}`;

interface QnaDoc {
  _id: string;
  question: string;
  answer: string;
  questionType?: string;
  answerType?: string;
  category?: { hebrewName: string; slug: { current: string } };
  publishedAt?: string;
  hebrewDate?: string;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);
  const qna = await client
    .fetch<QnaDoc | null>(QNA_BY_SLUG, { slug: decodedSlug })
    .catch(() => null);
  if (!qna) return { title: "שאלה לא נמצאה" };
  return {
    title: qna.question.slice(0, 60),
    description: qna.answer?.slice(0, 160),
  };
}

export default async function QnaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);
  const qna = await client
    .fetch<QnaDoc | null>(QNA_BY_SLUG, { slug: decodedSlug })
    .catch(() => null);
  if (!qna) notFound();

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "QAPage",
    mainEntity: {
      "@type": "Question",
      name: qna.question,
      acceptedAnswer: { "@type": "Answer", text: qna.answer },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <section
        className="py-10"
        style={{ background: "linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%)" }}
      >
        <div className="container">
          <Link
            href="/shaal"
            className="inline-flex items-center gap-1 text-white/80 hover:text-white text-sm mb-3"
          >
            <ArrowRight size={16} />
            חזרה לארכיון שו&quot;ת
          </Link>
          <div className="flex items-center gap-2 flex-wrap mb-2">
            {qna.category && (
              <span className="badge text-xs bg-white/15 text-white border border-white/20">
                {qna.category.hebrewName}
              </span>
            )}
            {qna.answerType === "practical" && (
              <span className="badge text-xs" style={{ background: "#fef3c7", color: "#92400e" }}>
                למעשה
              </span>
            )}
            {qna.hebrewDate && (
              <span className="text-white/70 text-xs">{qna.hebrewDate}</span>
            )}
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white leading-snug">
            {qna.question}
          </h1>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="max-w-3xl mx-auto">
            <div className="card p-6 md:p-8 mb-6">
              <div className="flex items-start gap-3 mb-4">
                <HelpCircle size={22} style={{ color: "var(--color-accent)" }} className="flex-shrink-0 mt-1" />
                <div>
                  <h2 className="text-sm font-bold text-gray-500 mb-1">השאלה</h2>
                  <p className="text-base leading-relaxed whitespace-pre-wrap">{qna.question}</p>
                </div>
              </div>
            </div>

            <div className="card p-6 md:p-8">
              <div className="flex items-start gap-3">
                <CheckCircle2 size={22} style={{ color: "var(--color-primary)" }} className="flex-shrink-0 mt-1" />
                <div>
                  <h2 className="text-sm font-bold text-gray-500 mb-1">תשובת הרב</h2>
                  <div className="text-base leading-relaxed whitespace-pre-wrap">{qna.answer}</div>
                </div>
              </div>
            </div>

            <div className="mt-6 p-3 rounded-lg text-xs text-gray-500" style={{ background: "#fef9e7" }}>
              ⚠️ תשובות מפורסמות ניתנות לצורך לימוד בלבד. לפסיקה למעשה בנסיבות אישיות — פנה לרב ישירות.
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
