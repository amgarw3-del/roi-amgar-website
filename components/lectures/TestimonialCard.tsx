import Image from "next/image";
import { urlFor } from "@/sanity/client";

interface TestimonialCardProps {
  quote: string;
  name: string;
  role?: string;
  photo?: { asset: { _ref: string } };
}

export default function TestimonialCard({ quote, name, role, photo }: TestimonialCardProps) {
  const photoUrl = photo ? urlFor(photo).width(96).height(96).url() : null;

  return (
    <div className="card p-6 relative">
      <span
        aria-hidden
        className="absolute top-2 right-4 text-5xl leading-none font-bold"
        style={{ color: "var(--color-ochre)", opacity: 0.4, fontFamily: "serif" }}
      >
        &ldquo;
      </span>
      <p
        className="text-gray-800 leading-relaxed mb-5 italic"
        style={{ fontSize: "17px" }}
      >
        {quote}
      </p>
      <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
        {photoUrl && (
          <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
            <Image src={photoUrl} alt={name} fill className="object-cover" />
          </div>
        )}
        <div>
          <div className="font-semibold text-gray-900">{name}</div>
          {role && <div className="text-sm text-gray-500">{role}</div>}
        </div>
      </div>
    </div>
  );
}
