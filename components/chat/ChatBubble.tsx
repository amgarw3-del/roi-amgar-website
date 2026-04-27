"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import ChatPanel from "./ChatPanel";

export default function ChatBubble() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Hide on admin/studio
  const hidden = pathname?.startsWith("/admin") || pathname?.startsWith("/studio");

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (hidden) return null;

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "סגור עוזר חיפוש" : "פתח עוזר חיפוש"}
        aria-expanded={open}
        className={`fixed bottom-20 md:bottom-6 left-4 md:left-6 z-[55] w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 ${
          open
            ? "bg-slate-700 hover:bg-slate-800 scale-95"
            : "bg-gradient-to-br from-amber-500 to-amber-700 hover:scale-105"
        } text-white`}
      >
        {open ? (
          <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
            <path d="M7 7l10 10M17 7l-10 10" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7">
            <path
              d="M12 3a9 9 0 0 0-9 9c0 1.7.5 3.3 1.4 4.7L3 21l4.5-1.3A9 9 0 1 0 12 3z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinejoin="round"
              fill="none"
            />
            <circle cx="8.5" cy="12" r="1" fill="currentColor" />
            <circle cx="12" cy="12" r="1" fill="currentColor" />
            <circle cx="15.5" cy="12" r="1" fill="currentColor" />
          </svg>
        )}
      </button>

      {open && <ChatPanel onClose={() => setOpen(false)} />}
    </>
  );
}
