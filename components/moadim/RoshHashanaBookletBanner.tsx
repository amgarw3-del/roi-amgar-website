import { ArrowLeft } from "lucide-react";

const BOOKLET_URL = "https://rosh-hashana-torah-lachaim.vercel.app";

export default function RoshHashanaBookletBanner() {
  return (
    <a
      href={BOOKLET_URL}
      target="_blank"
      rel="noopener"
      className="block rounded-2xl p-6 md:p-7 mb-10 transition-all hover:shadow-md"
      style={{
        background: "linear-gradient(135deg, var(--color-navy) 0%, #1a3050 100%)",
      }}
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div
            className="text-xs font-semibold mb-2 tracking-wider"
            style={{ color: "var(--color-ochre)" }}
          >
            ◆ חדש למועדים
          </div>
          <h3 className="text-white text-xl md:text-2xl font-bold mb-1">
            הלכות והנחיות לראש השנה תשפ״ז
          </h3>
          <p className="text-white/70 text-sm md:text-base">
            חוברת מלאה להורדה, הדפסה ושיתוף — כולל דיני ראש השנה שחל בשבת
          </p>
        </div>
        <span
          className="inline-flex items-center gap-2 self-start md:self-auto rounded-lg px-5 py-2.5 font-semibold whitespace-nowrap"
          style={{ background: "var(--color-ochre)", color: "var(--color-navy)" }}
        >
          לחוברת <ArrowLeft size={16} />
        </span>
      </div>
    </a>
  );
}
