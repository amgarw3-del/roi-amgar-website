"use client";

import Image from "next/image";
import { useState } from "react";
import { X } from "lucide-react";
import { urlFor } from "@/sanity/client";
import { buildLectureInquiryUrl } from "@/lib/whatsapp";

interface LectureCardProps {
  title: string;
  summary: string;
  flyer: { asset: { _ref: string }; alt?: string };
}

function WhatsAppIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
    </svg>
  );
}

export default function LectureCard({ title, summary, flyer }: LectureCardProps) {
  const [open, setOpen] = useState(false);
  const flyerThumb = urlFor(flyer).width(800).height(1067).url();
  const flyerLarge = urlFor(flyer).width(1200).url();
  const whatsappUrl = buildLectureInquiryUrl(title);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="card overflow-hidden flex flex-col text-right w-full cursor-pointer transition-shadow hover:shadow-lg"
      >
        <div className="relative w-full" style={{ aspectRatio: "3/4" }}>
          <Image
            src={flyerThumb}
            alt={flyer.alt || title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover"
          />
        </div>
        <div className="p-5 flex flex-col flex-1">
          <h3
            className="font-bold text-lg mb-2 leading-snug"
            style={{ color: "var(--color-navy)" }}
          >
            {title}
          </h3>
          <p className="text-gray-600 text-sm line-clamp-3 mb-4 leading-relaxed flex-1">
            {summary}
          </p>
          <div className="flex items-center justify-between gap-2">
            <span
              className="text-sm font-semibold"
              style={{ color: "var(--color-ochre)" }}
            >
              לפרטים מלאים ←
            </span>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1.5 rounded-lg py-2 px-3 text-xs font-semibold"
              style={{ background: "#25D366", color: "white" }}
            >
              <WhatsAppIcon size={14} />
              להזמנה
            </a>
          </div>
        </div>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 overflow-y-auto"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative bg-white rounded-2xl max-w-3xl w-full my-8 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            style={{ background: "var(--color-bg-paper, #faf6ed)" }}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute top-3 left-3 z-10 p-2 rounded-full bg-white/90 hover:bg-white shadow"
              aria-label="סגור"
            >
              <X size={20} />
            </button>

            <div className="grid md:grid-cols-2 gap-0">
              <div className="relative w-full bg-gray-100" style={{ aspectRatio: "3/4" }}>
                <Image
                  src={flyerLarge}
                  alt={flyer.alt || title}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>

              <div className="p-6 md:p-8 flex flex-col">
                <h2
                  className="text-2xl md:text-3xl font-bold mb-4 leading-tight"
                  style={{
                    color: "var(--color-navy)",
                    fontFamily: "'Frank Ruhl Libre', var(--font-frank), serif",
                  }}
                >
                  {title}
                </h2>

                <div className="text-gray-700 leading-relaxed space-y-3 mb-6 whitespace-pre-line">
                  {summary}
                </div>

                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-auto inline-flex items-center justify-center gap-2 rounded-lg py-3 px-5 font-semibold"
                  style={{ background: "#25D366", color: "white" }}
                >
                  <WhatsAppIcon size={20} />
                  להזמנת ההרצאה בוואטסאפ
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
