"use client";

import Image from "next/image";
import { useState } from "react";
import { urlFor } from "@/sanity/client";
import { X } from "lucide-react";

interface GalleryImage {
  _id: string;
  image: { asset: { _ref: string }; alt?: string };
  caption?: string;
}

export default function GalleryGrid({ images }: { images: GalleryImage[] }) {
  const [active, setActive] = useState<number | null>(null);

  if (images.length === 0) return null;

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {images.map((img, i) => {
          const thumb = urlFor(img.image).width(500).height(500).url();
          return (
            <button
              key={img._id}
              type="button"
              onClick={() => setActive(i)}
              className="relative aspect-square overflow-hidden rounded-lg group"
            >
              <Image
                src={thumb}
                alt={img.image.alt || img.caption || "תמונה מהרצאה"}
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-cover transition-transform group-hover:scale-105"
              />
            </button>
          );
        })}
      </div>

      {active !== null && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4"
          onClick={() => setActive(null)}
        >
          <button
            type="button"
            className="absolute top-4 left-4 text-white p-2 rounded-full bg-white/10 hover:bg-white/20"
            onClick={() => setActive(null)}
            aria-label="סגור"
          >
            <X size={24} />
          </button>
          <div className="relative max-w-5xl max-h-[90vh] w-full" onClick={(e) => e.stopPropagation()}>
            <Image
              src={urlFor(images[active].image).width(1600).url()}
              alt={images[active].image.alt || images[active].caption || ""}
              width={1600}
              height={1066}
              className="object-contain w-full h-auto max-h-[90vh] rounded"
            />
            {images[active].caption && (
              <div className="text-white text-center mt-3 text-sm">{images[active].caption}</div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
