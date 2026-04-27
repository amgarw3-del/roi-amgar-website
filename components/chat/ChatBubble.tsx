"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import ChatPanel from "./ChatPanel";

export default function ChatBubble() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const hidden = pathname?.startsWith("/admin") || pathname?.startsWith("/studio");

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
        className="fixed bottom-24 md:bottom-6 left-4 md:left-6 z-[55] w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105 focus-visible:scale-105"
        style={{
          background: open
            ? "var(--color-navy-deep)"
            : "linear-gradient(135deg, var(--color-navy) 0%, var(--color-navy-deep) 100%)",
          color: "var(--color-bg-paper)",
          boxShadow:
            "0 8px 22px rgba(15, 23, 41, 0.22), 0 2px 6px rgba(15, 23, 41, 0.12)",
          border: "1.5px solid rgba(168, 106, 44, 0.35)",
        }}
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
            <path
              d="M8 11.5h8M8 14h5"
              stroke="var(--color-ochre-light)"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        )}
        {!open && (
          <span
            className="absolute -top-1 -right-1 w-3 h-3 rounded-full"
            style={{
              background: "var(--color-ochre)",
              boxShadow: "0 0 0 2px var(--color-bg-hero)",
            }}
            aria-hidden
          />
        )}
      </button>

      {open && <ChatPanel onClose={() => setOpen(false)} />}
    </>
  );
}
