import { client, queries } from "@/sanity/client";
import PDFCard from "@/components/summaries/PDFCard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "סיכומים למבחני רבנות",
  description:
    "סיכומים חינמיים להורדה למבחני הרבנות — הלכות שבת, כשרות, נידה ועוד. הוכנו על ידי הרב רועי אמגר.",
};

export const revalidate = 3600;

export default async function SikkumimPage() {
  const summaries = await client.fetch(queries.allPdfSummaries).catch(() => []);

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
            ◆ סיכומים למבחני הרבנות
          </div>
          <h1
            className="text-3xl md:text-5xl font-bold mb-4 leading-tight"
            style={{
              fontFamily: "'Frank Ruhl Libre', var(--font-frank), serif",
              color: "var(--color-bg-paper)",
            }}
          >
            סיכומים חינמיים למבחני הרבנות
          </h1>
          <p className="text-white/80 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            חומרי לימוד מרוכזים שהכין הרב רועי אמגר — להורדה חופשית וללא תשלום
          </p>
        </div>
      </section>

      {/* סיכומים */}
      <section className="container py-12 md:py-16">
        {summaries.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {summaries.map(
              (s: {
                _id: string;
                title: string;
                description?: string;
                category?: string;
                pdfUrl: string;
              }) => (
                <PDFCard
                  key={s._id}
                  title={s.title}
                  description={s.description}
                  category={s.category}
                  pdfUrl={s.pdfUrl}
                />
              )
            )}
          </div>
        ) : (
          <p className="text-center text-gray-500 py-12">
            הסיכומים יועלו בקרוב — חזרו שוב.
          </p>
        )}
      </section>
    </div>
  );
}
