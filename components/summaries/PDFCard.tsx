"use client";

import { FileText, Download } from "lucide-react";

const categoryLabels: Record<string, string> = {
  general: "כללי",
  shabbat: "הלכות שבת",
  kashrut: "הלכות כשרות",
  nidda: "הלכות נידה",
  evelut: "הלכות אבלות",
  "yoreh-deah": "הלכות יורה דעה",
};

interface PDFCardProps {
  title: string;
  description?: string;
  category?: string;
  pdfUrl: string;
}

export default function PDFCard({ title, description, category, pdfUrl }: PDFCardProps) {
  const categoryLabel = category ? (categoryLabels[category] ?? category) : null;

  return (
    <div className="card p-5 flex flex-col gap-3 h-full">
      <div className="flex items-start gap-3">
        <div
          className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ background: "color-mix(in srgb, var(--color-ochre) 15%, transparent)" }}
        >
          <FileText size={24} style={{ color: "var(--color-ochre)" }} />
        </div>
        <div className="flex-1 min-w-0">
          {categoryLabel && (
            <span
              className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full mb-1"
              style={{
                background: "color-mix(in srgb, var(--color-navy) 10%, transparent)",
                color: "var(--color-navy)",
              }}
            >
              {categoryLabel}
            </span>
          )}
          <h3 className="font-bold text-base leading-snug" style={{ color: "var(--color-navy)" }}>
            {title}
          </h3>
        </div>
      </div>

      {description && (
        <p className="text-sm" style={{ color: "var(--color-ink-body)" }}>
          {description}
        </p>
      )}

      <div className="mt-auto pt-2 flex items-center justify-between">
        <span className="text-xs font-medium" style={{ color: "var(--color-ochre)" }}>
          ✓ חינמי להורדה
        </span>
        <a
          href={pdfUrl}
          download
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl font-semibold text-sm text-white transition-opacity hover:opacity-90"
          style={{ background: "var(--color-navy)" }}
        >
          <Download size={15} />
          הורדה
        </a>
      </div>
    </div>
  );
}
