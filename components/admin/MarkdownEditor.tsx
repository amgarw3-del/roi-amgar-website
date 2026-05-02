"use client";

import { useRef, useState } from "react";
import { Bold, Italic, Quote, Eye, Pencil } from "lucide-react";
import DivarToraContent from "@/components/DivarToraContent";

interface Props {
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  placeholder?: string;
  className?: string;
}

type Wrap = "bold" | "italic" | "quote";

export default function MarkdownEditor({
  value,
  onChange,
  rows = 14,
  placeholder,
  className,
}: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [mode, setMode] = useState<"edit" | "preview">("edit");

  function applyWrap(kind: Wrap) {
    const ta = ref.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const before = value.slice(0, start);
    const selected = value.slice(start, end);
    const after = value.slice(end);
    let next = value;
    let nextStart = start;
    let nextEnd = end;

    if (kind === "bold" || kind === "italic") {
      const marker = kind === "bold" ? "**" : "*";
      const placeholderText = kind === "bold" ? "מודגש" : "מוטה";
      const text = selected || placeholderText;
      next = `${before}${marker}${text}${marker}${after}`;
      nextStart = start + marker.length;
      nextEnd = nextStart + text.length;
    } else if (kind === "quote") {
      // Insert "> " at start of each selected line; if no selection, start a new quoted line.
      if (selected.length === 0) {
        const needsNewline = before.length > 0 && !before.endsWith("\n");
        const insert = `${needsNewline ? "\n" : ""}> `;
        next = `${before}${insert}${after}`;
        nextStart = before.length + (needsNewline ? 1 : 0) + 2;
        nextEnd = nextStart;
      } else {
        const quoted = selected
          .split("\n")
          .map((l) => (l.startsWith("> ") ? l : `> ${l}`))
          .join("\n");
        next = `${before}${quoted}${after}`;
        nextStart = start;
        nextEnd = start + quoted.length;
      }
    }

    onChange(next);
    requestAnimationFrame(() => {
      ta.focus({ preventScroll: true });
      ta.setSelectionRange(nextStart, nextEnd);
    });
  }

  return (
    <div className="w-full">
      <div className="flex items-center gap-1 mb-1.5 flex-wrap">
        <ToolbarButton onClick={() => applyWrap("bold")} title="מודגש (**טקסט**)">
          <Bold size={14} />
        </ToolbarButton>
        <ToolbarButton onClick={() => applyWrap("italic")} title="מוטה (*טקסט*)">
          <Italic size={14} />
        </ToolbarButton>
        <ToolbarButton onClick={() => applyWrap("quote")} title="ציטוט (> טקסט)">
          <Quote size={14} />
        </ToolbarButton>
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => setMode(mode === "edit" ? "preview" : "edit")}
          className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium hover:bg-gray-100 text-gray-600"
          title={mode === "edit" ? "תצוגה מקדימה" : "חזרה לעריכה"}
        >
          {mode === "edit" ? <Eye size={13} /> : <Pencil size={13} />}
          {mode === "edit" ? "תצוגה מקדימה" : "עריכה"}
        </button>
      </div>

      {mode === "edit" ? (
        <textarea
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          placeholder={placeholder}
          className={
            className ??
            "w-full px-3 py-2 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-200 leading-relaxed"
          }
        />
      ) : (
        <div
          className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white min-h-[200px]"
          style={{ minHeight: `${rows * 1.5}rem` }}
        >
          {value.trim() ? (
            <DivarToraContent content={value} />
          ) : (
            <p className="text-sm text-gray-400">אין תוכן להציג.</p>
          )}
        </div>
      )}
    </div>
  );
}

function ToolbarButton({
  onClick,
  title,
  children,
}: {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="p-1.5 rounded-md hover:bg-gray-100 text-gray-600 border border-gray-200"
    >
      {children}
    </button>
  );
}
