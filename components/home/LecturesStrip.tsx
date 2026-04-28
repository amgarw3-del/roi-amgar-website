import Image from "next/image";
import Link from "next/link";
import { client, queries, urlFor } from "@/sanity/client";
import { ArrowLeft } from "lucide-react";

interface Lecture {
  _id: string;
  title: string;
  flyer: { asset: { _ref: string }; alt?: string };
}

export default async function LecturesStrip() {
  const lectures: Lecture[] = await client.fetch(queries.featuredLectures(3)).catch(() => []);

  if (lectures.length === 0) return null;

  return (
    <section className="container my-12">
      <div className="flex items-end justify-between mb-5">
        <div>
          <div
            className="text-xs font-semibold mb-1 tracking-wider"
            style={{ color: "var(--color-ochre)" }}
          >
            ◆ הרצאות זמינות להזמנה
          </div>
          <h2
            className="text-2xl font-bold"
            style={{ color: "var(--color-navy)" }}
          >
            הזמינו את הרב לקהילתכם
          </h2>
        </div>
        <Link
          href="/lectures"
          className="text-sm font-semibold flex items-center gap-1"
          style={{ color: "var(--color-primary)" }}
        >
          לכל ההרצאות <ArrowLeft size={14} />
        </Link>
      </div>

      <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 -mx-4 px-4 md:mx-0 md:px-0">
        {lectures.map((l) => (
          <Link
            key={l._id}
            href="/lectures"
            className="snap-start flex-shrink-0 w-64 md:w-72 card overflow-hidden"
          >
            <div className="relative w-full" style={{ aspectRatio: "3/4" }}>
              <Image
                src={urlFor(l.flyer).width(600).height(800).url()}
                alt={l.flyer.alt || l.title}
                fill
                sizes="288px"
                className="object-cover"
              />
            </div>
            <div className="p-3">
              <h3 className="font-semibold text-sm leading-snug line-clamp-2" style={{ color: "var(--color-navy)" }}>
                {l.title}
              </h3>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
