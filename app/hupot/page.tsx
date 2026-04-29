import { client, queries } from "@/sanity/client";
import TestimonialCard from "@/components/lectures/TestimonialCard";
import GalleryGrid from "@/components/lectures/GalleryGrid";
import { buildWeddingInquiryUrl } from "@/lib/whatsapp";
import { Heart, Music, BookOpen, Clock, MapPin, Sparkles } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "עריכת חופות",
  description:
    "הרב רועי אמגר עורך חופות — בחיבור, בשמחה ובקדושה. לתיאום ושאלות — פנו ישירות בוואטסאפ.",
};

export const revalidate = 3600;

const qualities = [
  { icon: Heart, label: "אישיות חמה", desc: "חיבור אמיתי לזוג ולמשפחה" },
  { icon: BookOpen, label: "הכנה מעמיקה", desc: "פגישות הכנה לפני החופה" },
  { icon: Music, label: "אווירה מרגשת", desc: "טקס שיישאר בזיכרון לנצח" },
  { icon: Clock, label: "גמישות מלאה", desc: "התאמה לשעה ולסגנון שלכם" },
  { icon: MapPin, label: "כיסוי ארצי", desc: "מגיע לכל מקום בארץ" },
  { icon: Sparkles, label: "ניסיון רב", desc: "עשרות זוגות מרוצים" },
];

export default async function HupotPage() {
  const [gallery, testimonials] = await Promise.all([
    client.fetch(queries.allWeddingGallery).catch(() => []),
    client.fetch(queries.allWeddingTestimonials).catch(() => []),
  ]);

  const weddingWhatsapp = buildWeddingInquiryUrl();

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section
        className="py-16 md:py-24"
        style={{
          background:
            "linear-gradient(135deg, var(--color-navy) 0%, #1a3050 100%)",
        }}
      >
        <div className="container text-center">
          <div
            className="inline-block text-xs font-semibold mb-4 tracking-wider"
            style={{ color: "var(--color-ochre)" }}
          >
            ◆ עריכת חופות — הרב רועי אמגר
          </div>
          <h1
            className="text-3xl md:text-5xl font-bold mb-4 leading-tight"
            style={{
              fontFamily: "'Frank Ruhl Libre', var(--font-frank), serif",
              color: "var(--color-bg-paper)",
            }}
          >
            חופה שתישאר בלב לנצח
          </h1>
          <p className="text-white/80 text-lg md:text-xl max-w-2xl mx-auto mb-8 leading-relaxed">
            הרב רועי אמגר מלווה זוגות מהטקס ועד הריקוד — בחיבור, בשמחה ובקדושה
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <a
              href={weddingWhatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg px-6 py-3 font-semibold inline-flex items-center gap-2"
              style={{ background: "#25D366", color: "white" }}
            >
              לתיאום בוואטסאפ
            </a>
            {gallery.length > 0 && (
              <a
                href="#gallery"
                className="rounded-lg px-6 py-3 font-semibold border"
                style={{
                  borderColor: "var(--color-ochre)",
                  color: "var(--color-ochre)",
                }}
              >
                לתמונות ↓
              </a>
            )}
          </div>
        </div>
      </section>

      {/* למה לבחור */}
      <section className="container py-12 md:py-16">
        <h2
          className="text-2xl md:text-3xl font-bold text-center mb-8"
          style={{ color: "var(--color-navy)" }}
        >
          למה לבחור ברב רועי?
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {qualities.map((q) => {
            const Icon = q.icon;
            return (
              <div key={q.label} className="card p-4 text-center">
                <Icon
                  size={32}
                  className="mx-auto mb-3"
                  style={{ color: "var(--color-ochre)" }}
                />
                <div className="font-bold mb-1" style={{ color: "var(--color-navy)" }}>
                  {q.label}
                </div>
                <div className="text-xs text-gray-600">{q.desc}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* גלריה */}
      {gallery.length > 0 && (
        <section id="gallery" className="container py-12 md:py-16 scroll-mt-20">
          <h2
            className="text-2xl md:text-3xl font-bold text-center mb-8"
            style={{ color: "var(--color-navy)" }}
          >
            רגעים מחופות בעבר
          </h2>
          <GalleryGrid images={gallery} />
        </section>
      )}

      {/* המלצות */}
      {testimonials.length > 0 && (
        <section
          className="py-12 md:py-16"
          style={{ background: "var(--color-cream, #faf6ed)" }}
        >
          <div className="container">
            <h2
              className="text-2xl md:text-3xl font-bold text-center mb-8"
              style={{ color: "var(--color-navy)" }}
            >
              מה אמרו זוגות שחגגו איתנו
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl mx-auto">
              {testimonials.map(
                (t: {
                  _id: string;
                  quote: string;
                  name: string;
                  role?: string;
                  photo?: { asset: { _ref: string } };
                }) => (
                  <TestimonialCard key={t._id} {...t} />
                )
              )}
            </div>
          </div>
        </section>
      )}

      {/* CTA סופי */}
      <section
        className="py-16"
        style={{
          background:
            "linear-gradient(135deg, var(--color-navy) 0%, #1a3050 100%)",
        }}
      >
        <div className="container text-center">
          <h2
            className="text-2xl md:text-3xl font-bold mb-4"
            style={{
              fontFamily: "'Frank Ruhl Libre', var(--font-frank), serif",
              color: "var(--color-bg-paper)",
            }}
          >
            רוצים שנעדוך את החופה?
          </h2>
          <p className="text-white/80 mb-6">
            שלחו הודעה ונשמח לתאם פגישת היכרות.
          </p>
          <a
            href={weddingWhatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block rounded-lg px-8 py-3.5 font-semibold text-lg"
            style={{ background: "#25D366", color: "white" }}
          >
            לתיאום עריכת חופה ←
          </a>
        </div>
      </section>
    </div>
  );
}
