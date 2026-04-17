"use client";
import { useState } from "react";

export default function DonationWidget() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      style={{
        position: "fixed",
        left: 0,
        top: "50%",
        transform: "translateY(-50%)",
        zIndex: 40,
        direction: "rtl",
      }}
    >
      {expanded ? (
        <div
          className="flex flex-col items-center gap-2 p-3 rounded-r-2xl shadow-xl"
          style={{ background: "var(--color-accent)", color: "white", minWidth: "140px" }}
        >
          <button
            onClick={() => setExpanded(false)}
            className="self-end text-white/70 hover:text-white text-sm leading-none"
            aria-label="סגור"
          >✕</button>
          <span className="text-2xl">💛</span>
          <p className="text-xs font-bold text-center leading-snug">תרומה לעמותת הרב</p>
          <a
            href="https://did.li/PosDN"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all hover:opacity-90"
            style={{ background: "white", color: "var(--color-accent)" }}
          >
            לתרומה ←
          </a>
        </div>
      ) : (
        <button
          onClick={() => setExpanded(true)}
          className="flex items-center gap-1 py-3 px-2 rounded-r-2xl shadow-lg hover:px-3 transition-all"
          style={{ background: "var(--color-accent)", color: "white", writingMode: "vertical-rl" }}
          aria-label="תרומה לעמותה"
        >
          <span style={{ writingMode: "horizontal-tb" }}>💛</span>
          <span className="text-xs font-bold" style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}>תרומה לעמותה</span>
        </button>
      )}
    </div>
  );
}
