import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function LecturesPromoBanner() {
  return (
    <section className="container my-8 md:my-12">
      <Link
        href="/lectures"
        className="block rounded-2xl p-6 md:p-7 transition-all hover:shadow-md"
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
              ◆ הזמנת הרצאות
            </div>
            <h3 className="text-white text-xl md:text-2xl font-bold mb-1">
              מזמינים את הרב רועי אמגר להרצאה בקהילתכם
            </h3>
            <p className="text-white/70 text-sm md:text-base">
              מגוון נושאים · התאמה אישית · זמינות גבוהה
            </p>
          </div>
          <span
            className="inline-flex items-center gap-2 self-start md:self-auto rounded-lg px-5 py-2.5 font-semibold whitespace-nowrap"
            style={{ background: "var(--color-ochre)", color: "var(--color-navy)" }}
          >
            לפרטים <ArrowLeft size={16} />
          </span>
        </div>
      </Link>
    </section>
  );
}
