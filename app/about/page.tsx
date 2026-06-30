import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { BookOpen, MessageCircleQuestion, Users, Heart, GraduationCap, HandHeart } from "lucide-react";

export const metadata: Metadata = {
  title: 'אודות – עמותת "סיגלהיות" והרב רועי אמגר',
  description:
    'עמותת "סיגלהיות" ע"ש סיגל אמגר ע"ה — מרכז לזוגיות, חינוך, חסד ותורה בנתניה, בניהול הרב רועי אמגר. שיעורי תורה, הלכה, אמונה וזוגיות.',
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "NGO",
  name: 'עמותת "סיגלהיות" ע"ש סיגל אמגר ע"ה',
  alternateName: "סיגלהיות - מרכז לזוגיות, חינוך, חסד ותורה",
  description:
    'מרכז לחיזוק והעצמת זוגיות, חינוך ומשפחה, הפועל בנתניה ובכל הארץ. הוקם לזכרה של הרבנית סיגל אמגר ע"ה.',
  url: "https://www.guidestar.org.il/organization/580752954",
  identifier: "580752954",
  logo: "https://www.haravroiamgar.com/images/sigaliyot-logo.png",
  address: {
    "@type": "PostalAddress",
    addressLocality: "נתניה",
    addressCountry: "IL",
  },
  founder: {
    "@type": "Person",
    name: "הרב רועי אמגר",
    jobTitle: 'מייסד ומנכ"ל',
  },
};

const personStructuredData = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "הרב רועי אמגר",
  jobTitle: 'ראש הגרעין התורני "דביר קדשו" ומייסד ומנכ"ל עמותת "סיגלהיות"',
  description: "רב ומחנך, בעל תואר ראשון בחינוך ותואר שני במדיניות חינוכית",
  url: "https://www.haravroiamgar.com",
  sameAs: [
    "https://youtube.com/@roiamgar",
    "https://instagram.com/roiamgar",
    "https://facebook.com/roiamgar",
    "https://tiktok.com/@roiamgar",
  ],
  knowsAbout: ["הלכה", "אמונה", "זוגיות", "פרשת שבוע", "מחשבת ישראל", "חינוך"],
  inLanguage: "he",
  worksFor: {
    "@type": "NGO",
    name: 'עמותת "סיגלהיות" ע"ש סיגל אמגר ע"ה',
    identifier: "580752954",
  },
};

const activities = [
  {
    icon: Heart,
    title: 'ערבי זוגיות',
    desc: 'ערבי זוגיות חודשיים המשלבים סדנה והרצאה בנושאי זוגיות, חינוך ומשפחה',
  },
  {
    icon: GraduationCap,
    title: 'חינוך לנוער ולהורים',
    desc: 'סדרת הרצאות חורף בנושא חינוך ילדים מגיל הינקות ועד גיל ההתבגרות, והדרכות הורים קבוצתיות',
  },
  {
    icon: Users,
    title: 'בנות סגולה',
    desc: 'מיזם לאמהות ובנות בשנת הבת מצווה — תוכן משמעותי, סדנאות וטיול לירושלים',
  },
  {
    icon: HandHeart,
    title: 'גמ"ח מיטחברת',
    desc: 'השאלת עריסות תינוק בחינם המתחברות למיטת האם — מיזם חברתי של משפחת אמגר',
  },
  {
    icon: BookOpen,
    title: '"השלם זה הבניין"',
    desc: 'כנס קיץ שנתי גדול בנושא זוגיות, בהשתתפות כ-300 תושבים',
  },
  {
    icon: MessageCircleQuestion,
    title: 'ערבי רווקים ורווקות',
    desc: 'מפגשים לרווקים ורווקות לפי קבוצות גיל, עם הרצאות אורח ומעגלי היכרות',
  },
];

export default function AboutPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personStructuredData) }}
      />

      {/* Hero - העמותה במרכז */}
      <section
        className="py-16"
        style={{ background: "linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%)" }}
      >
        <div className="container">
          <div className="flex flex-col items-center gap-6 max-w-2xl mx-auto text-center">
            <div className="w-32 h-32 rounded-2xl bg-white p-3 shadow-lg flex-shrink-0 relative">
              <Image
                src="/images/sigaliyot-logo.png"
                alt='לוגו עמותת "סיגלהיות" ע"ש סיגל אמגר ע"ה'
                fill
                className="object-contain p-2"
              />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                עמותת &quot;סיגלהיות&quot;
              </h1>
              <p className="text-white/90 text-lg">ע&quot;ש סיגל אמגר ע&quot;ה</p>
              <p className="text-white/80 mt-2">
                מרכז לזוגיות, חינוך, חסד ותורה &middot; נתניה
              </p>
              <p className="text-white/70 text-sm mt-3">
                עמותה רשומה כדין &middot; מס&apos; עמותה 580752954
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="container py-12 max-w-3xl mx-auto">
        {/* אודות העמותה */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-3" style={{ color: "var(--color-primary)" }}>
            אודות העמותה
          </h2>
          <div className="divider mb-5" />
          <div className="prose-hebrew text-gray-700 space-y-4">
            <p>
              עמותת &quot;סיגלהיות&quot; הוקמה לזכרה של הרבנית <strong>סיגל אמגר ע&quot;ה</strong>,
              אשת הרב יורם אמגר רב קהילת &quot;דביר קדשו&quot; בנתניה — גננת מוערכת ומובילה בעיר,
              שעסקה כל חייה בחינוך ילדים ובחיזוק משפחות, ובחרה אישית בשידוכם של למעלה
              מ-14 זוגות.
            </p>
            <p>
              בהמשך דרכה, פועלת העמותה <strong>לחיזוק והעצמת זוגיות, חינוך ומשפחה</strong> —
              באמצעות פעילויות תרבות, מיזמי חסד ונתינה ארציים ומקומיים, ופעילויות מורשת
              להעמקת הזהות היהודית. העמותה פועלת בכל הארץ מתוך נתניה, ושמה לה למטרה
              לקרב בין קבוצות אוכלוסייה שונות ולצמצם את הקיטוב בין דתיים לחילונים.
            </p>
            <p>
              ניתן לצפות בפרטי הרישום הציבוריים של העמותה באתר רשם העמותות (גיידסטאר):{" "}
              <a
                href="https://www.guidestar.org.il/organization/580752954"
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-semibold"
                style={{ color: "var(--color-primary)" }}
              >
                עמוד העמותה בגיידסטאר
              </a>
            </p>
          </div>
        </section>

        {/* פעילויות העמותה */}
        <section className="mb-12">
          <h2 className="text-xl font-bold mb-4" style={{ color: "var(--color-primary)" }}>
            פעילויות העמותה
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activities.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="card p-5">
                <div className="flex items-start gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: "var(--color-warm)" }}
                  >
                    <Icon size={20} style={{ color: "var(--color-primary)" }} />
                  </div>
                  <div>
                    <h3 className="font-bold mb-1" style={{ color: "var(--color-primary)" }}>{title}</h3>
                    <p className="text-gray-500 text-sm">{desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* הרב רועי אמגר - מנהל העמותה */}
        <section className="mb-12 card p-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="w-32 h-32 rounded-full overflow-hidden flex-shrink-0 relative border-4" style={{ borderColor: "var(--color-warm)" }}>
              <Image
                src="/rabbi.jpg"
                alt="הרב רועי אמגר"
                fill
                className="object-cover"
              />
            </div>
            <div className="text-center md:text-right">
              <h2 className="text-xl font-bold mb-1" style={{ color: "var(--color-primary)" }}>
                הרב רועי אמגר
              </h2>
              <p className="text-gray-600 text-sm mb-3">
                ראש הגרעין התורני &quot;דביר קדשו&quot; ומייסד ומנכ&quot;ל עמותת &quot;סיגלהיות&quot;
              </p>
              <div className="prose-hebrew text-gray-700 text-sm space-y-2">
                <p>
                  הרב רועי אמגר עומד בראש הגרעין התורני &quot;דביר קדשו&quot; בנתניה, ובמקביל
                  ייסד ומנהל את עמותת &quot;סיגלהיות&quot; — מרכז לזוגיות, חינוך, חסד ותורה,
                  הפועל להמשך דרכה של הרבנית סיגל אמגר ע&quot;ה.
                </p>
                <p>
                  בעל תואר ראשון בחינוך ותואר שני במדיניות חינוכית, ומלמד שיעורי תורה
                  קבועים בנושאי הלכה, אמונה, פרשת שבוע וזוגיות — הן בקהילה והן באמצעות
                  ערוצי המדיה החברתית.
                </p>
              </div>
            </div>
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
