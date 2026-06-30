import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { BookOpen, MessageCircleQuestion, Users } from "lucide-react";

export const metadata: Metadata = {
  title: "אודות הרב רועי אמגר",
  description: "הרב רועי אמגר — ביוגרפיה, תחומי עיסוק, ורבותיו. שיעורי תורה, הלכה, אמונה וזוגיות.",
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "הרב רועי אמגר",
  jobTitle: "רב ומרצה",
  description: "רב ומרצה בתחומי הלכה, אמונה וזוגיות",
  url: "https://roiamgar.co.il",
  sameAs: [
    "https://youtube.com/@roiamgar",
    "https://instagram.com/roiamgar",
    "https://facebook.com/roiamgar",
    "https://tiktok.com/@roiamgar",
  ],
  knowsAbout: ["הלכה", "אמונה", "זוגיות", "פרשת שבוע", "מחשבת ישראל"],
  inLanguage: "he",
  addressCountry: "IL",
  affiliation: {
    "@type": "NGO",
    name: 'עמותת "סיגלהיות" ע"ש סיגל אמגר ע"ה',
    alternateName: "סיגלהיות - מרכז לזוגיות, חינוך, חסד ותורה",
    url: "https://www.guidestar.org.il/organization/580752954",
    identifier: "580752954",
  },
};

export default function AboutPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      {/* Hero */}
      <section
        className="py-16"
        style={{ background: "linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%)" }}
      >
        <div className="container">
          <div className="flex flex-col md:flex-row items-center gap-8 max-w-3xl mx-auto">
            <div
              className="w-40 h-40 rounded-full border-4 border-white/30 flex items-center justify-center text-6xl flex-shrink-0"
              style={{ background: "var(--color-primary-dark)" }}
            >
              👨‍🏫
            </div>
            <div className="text-center md:text-right">
              <h1 className="text-3xl font-bold text-white mb-2">הרב רועי אמגר</h1>
              <p className="text-white/80 text-lg">רב, מרצה ומחנך</p>
              <p className="text-white/70 text-sm mt-2">
                תחומי עיסוק: הלכה | אמונה | זוגיות | פרשת שבוע
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="container py-12 max-w-3xl mx-auto">
        {/* ביוגרפיה */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-3" style={{ color: "var(--color-primary)" }}>
            קצת עלי
          </h2>
          <div className="divider mb-5" />
          <div className="prose-hebrew text-gray-700">
            <p>
              [הרב רועי אמגר — הכנס ביוגרפיה אישית כאן. מה למדת, אצל מי, מה הדרייב שלך, למה אתה עושה את מה שאתה עושה.]
            </p>
            <p>
              [ניתן לכתוב כמה פסקאות אישיות שמדברות ישירות לקהל שלך — גם קהל צעיר וגם מבוגר.]
            </p>
          </div>
        </section>

        {/* העמותה */}
        <section className="mb-12 card p-6">
          <h2 className="text-xl font-bold mb-4" style={{ color: "var(--color-primary)" }}>
            הפעילות התורנית מתקיימת תחת עמותת &quot;סיגלהיות&quot;
          </h2>
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="w-32 h-32 flex-shrink-0 relative">
              <Image
                src="/images/sigaliyot-logo.png"
                alt='לוגו עמותת סיגלהיות ע"ש סיגל אמגר ע"ה'
                fill
                className="object-contain"
              />
            </div>
            <div className="text-gray-700 text-sm space-y-2">
              <p>
                כל שיעורי התורה, ההרצאות והפעילות החינוכית של הרב רועי אמגר מתקיימים
                ופועלים תחת עמותת <strong>&quot;סיגלהיות&quot; ע&quot;ש סיגל אמגר ע&quot;ה</strong> —
                מרכז לזוגיות, חינוך, חסד ותורה, עמותה רשומה כדין ברשם העמותות.
              </p>
              <p>
                מספר עמותה: <strong>580752954</strong>
              </p>
              <p>
                ניתן לצפות בפרטי הרישום הציבוריים של העמותה באתר רשם העמותות (גיידסטאר):{" "}
                <a
                  href="https://www.guidestar.org.il/organization/580752954"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                  style={{ color: "var(--color-primary)" }}
                >
                  עמוד העמותה בגיידסטאר
                </a>
              </p>
            </div>
          </div>
        </section>

        {/* רבותיו */}
        <section className="mb-12 card p-6">
          <h2 className="text-xl font-bold mb-4" style={{ color: "var(--color-primary)" }}>
            יחוס תורני
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
            <div>
              <p className="font-semibold text-gray-900">בית המדרש / ישיבה</p>
              <p>[שם המוסד]</p>
            </div>
            <div>
              <p className="font-semibold text-gray-900">רבותיו המרכזיים</p>
              <p>[שמות הרבנים]</p>
            </div>
            <div>
              <p className="font-semibold text-gray-900">תחומי התמחות</p>
              <p>הלכה, אמונה, זוגיות, מחשבת ישראל</p>
            </div>
            <div>
              <p className="font-semibold text-gray-900">קהילה</p>
              <p>[שם הקהילה / מוסד]</p>
            </div>
          </div>
        </section>

        {/* פעילות */}
        <section className="mb-12">
          <h2 className="text-xl font-bold mb-4" style={{ color: "var(--color-primary)" }}>
            פעילות
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: BookOpen, title: "שיעורים", desc: "שיעורים שבועיים בפרשת שבוע, הלכה ואמונה" },
              { icon: MessageCircleQuestion, title: "שאלות ותשובות", desc: "מענה לשאלות הלכתיות ואישיות" },
              { icon: Users, title: "הרצאות", desc: "הרצאות לקהילות, ישיבות ומוסדות" },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="card p-5 text-center">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
                  style={{ background: "var(--color-warm)" }}
                >
                  <Icon size={22} style={{ color: "var(--color-primary)" }} />
                </div>
                <h3 className="font-bold mb-1" style={{ color: "var(--color-primary)" }}>{title}</h3>
                <p className="text-gray-500 text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div className="flex flex-wrap gap-3 justify-center">
          <Link href="/shaal" className="btn-primary">שאל את הרב שאלה</Link>
          <Link href="/shiurim" className="btn-secondary">לשיעורים</Link>
        </div>
      </div>
    </>
  );
}
