import { client, queries } from "@/sanity/client";
import LectureCard from "@/components/lectures/LectureCard";
import TestimonialCard from "@/components/lectures/TestimonialCard";
import GalleryGrid from "@/components/lectures/GalleryGrid";
import LectureFAQ from "@/components/lectures/LectureFAQ";
import { buildLectureInquiryUrl } from "@/lib/whatsapp";
import {
  Users,
  CalendarDays,
  Building2,
  HeartHandshake,
  PartyPopper,
} from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "הרצאות",
  description:
    "הזמינו את הרב רועי אמגר להרצאה בבית הכנסת, בקהילה או באירוע — מגוון נושאים, התאמה אישית.",
};

export const revalidate = 3600;

const audiences = [
  { icon: Building2, label: "בתי כנסת", desc: "דרשות שבת ושיעור שבועי" },
  { icon: CalendarDays, label: "שבתות עיון", desc: "סדרת שיעורים מחוברת" },
  { icon: Users, label: "ועדי קהילה", desc: "אירועי חג ותוכן ייחודי" },
  { icon: HeartHandshake, label: "ארגונים ועמותות", desc: "כנסים וימי עיון" },
  { icon: PartyPopper, label: "אירועים משפחתיים", desc: "בר מצווה, שבע ברכות ועוד" },
];

export default async function LecturesPage() {
  const [lectures, testimonials, gallery] = await Promise.all([
    client.fetch(queries.allLectures).catch(() => []),
    client.fetch(queries.allTestimonials).catch(() => []),
    client.fetch(queries.allLectureGallery).catch(() => []),
  ]);

  const heroWhatsapp = buildLectureInquiryUrl();

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
            ◆ הרצאות הרב רועי אמגר
          </div>
          <h1
            className="text-3xl md:text-5xl font-bold mb-4 leading-tight"
            style={{
              fontFamily: "'Frank Ruhl Libre', var(--font-frank), serif",
              color: "var(--color-bg-paper)",
            }}
          >
            הרצאה שתישאר בלב הקהילה
          </h1>
          <p className="text-white/80 text-lg md:text-xl max-w-2xl mx-auto mb-8 leading-relaxed">
            הרב רועי אמגר מגיע אליכם — לשיעור, להרצאה או לשבת עיון
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <a
              href={heroWhatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg px-6 py-3 font-semibold inline-flex items-center gap-2"
              style={{ background: "#25D366", color: "white" }}
            >
              להזמנה ישירה בוואטסאפ
            </a>
            <a
              href="#lectures-list"
              className="rounded-lg px-6 py-3 font-semibold border"
              style={{
                borderColor: "var(--color-ochre)",
                color: "var(--color-ochre)",
              }}
            >
              לרשימת ההרצאות ↓
            </a>
          </div>
        </div>
      </section>

      {/* למי מתאים */}
      <section className="container py-12 md:py-16">
        <h2
          className="text-2xl md:text-3xl font-bold text-center mb-8"
          style={{ color: "var(--color-navy)" }}
        >
          למי מתאים
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {audiences.map((a) => {
            const Icon = a.icon;
            return (
              <div key={a.label} className="card p-4 text-center">
                <Icon
                  size={32}
                  className="mx-auto mb-3"
                  style={{ color: "var(--color-ochre)" }}
                />
                <div
                  className="font-bold mb-1"
                  style={{ color: "var(--color-navy)" }}
                >
                  {a.label}
                </div>
                <div className="text-xs text-gray-600">{a.desc}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* רשימת הרצאות */}
      <section id="lectures-list" className="container py-12 md:py-16 scroll-mt-20">
        <h2
          className="text-2xl md:text-3xl font-bold text-center mb-8"
          style={{ color: "var(--color-navy)" }}
        >
          הרצאות זמינות להזמנה
        </h2>
        {lectures.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lectures.map(
              (l: {
                _id: string;
                title: string;
                summary: string;
                flyer: { asset: { _ref: string }; alt?: string };
              }) => (
                <LectureCard key={l._id} {...l} />
              )
            )}
          </div>
        ) : (
          <p className="text-center text-gray-500">
            הפלאיירים יועלו בקרוב. בינתיים — מוזמנים ליצור קשר ישיר.
          </p>
        )}
      </section>

      {/* גלריה */}
      {gallery.length > 0 && (
        <section className="container py-12 md:py-16">
          <h2
            className="text-2xl md:text-3xl font-bold text-center mb-8"
            style={{ color: "var(--color-navy)" }}
          >
            רגעים מהרצאות בעבר
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
              ממליצים על הרצאות הרב
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

      {/* FAQ */}
      <section className="container py-12 md:py-16">
        <h2
          className="text-2xl md:text-3xl font-bold text-center mb-8"
          style={{ color: "var(--color-navy)" }}
        >
          שאלות נפוצות
        </h2>
        <div className="max-w-2xl mx-auto">
          <LectureFAQ />
        </div>
      </section>

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
            רוצים להזמין הרצאה?
          </h2>
          <p className="text-white/80 mb-6">
            לחצו לשליחת הודעה ישירה בוואטסאפ — נחזור אליכם עם פרטים.
          </p>
          <a
            href={heroWhatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block rounded-lg px-8 py-3.5 font-semibold text-lg"
            style={{ background: "#25D366", color: "white" }}
          >
            לתיאום הרצאה ←
          </a>
        </div>
      </section>
    </div>
  );
}
