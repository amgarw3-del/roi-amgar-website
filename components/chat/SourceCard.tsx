import Link from "next/link";
import type { ChatSource } from "./types";

const TYPE_COLORS: Record<string, string> = {
  video: "bg-rose-50 text-rose-700 border-rose-200",
  divarTora: "bg-amber-50 text-amber-700 border-amber-200",
  blogPost: "bg-sky-50 text-sky-700 border-sky-200",
  qna: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

export default function SourceCard({ source }: { source: ChatSource }) {
  const colorClass = TYPE_COLORS[source.type] ?? "bg-slate-50 text-slate-700 border-slate-200";
  return (
    <Link
      href={source.url}
      className="block rounded-lg border border-slate-200 bg-white p-3 hover:border-amber-300 hover:shadow-sm transition group"
    >
      <div className="flex items-start gap-2">
        <span className="shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
          {source.id}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full border ${colorClass}`}>
              {source.typeLabel}
            </span>
            {source.category && (
              <span className="text-[10px] text-slate-500">{source.category}</span>
            )}
          </div>
          <div className="text-sm text-slate-900 font-medium line-clamp-2 group-hover:text-amber-900">
            {source.title}
          </div>
        </div>
      </div>
    </Link>
  );
}
