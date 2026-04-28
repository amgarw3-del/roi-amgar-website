"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import Logo from "./Logo";

const navLinks = [
  { href: "/parasha", label: "פרשת שבוע" },
  { href: "/halacha", label: "הלכה" },
  { href: "/emuna", label: "אמונה" },
  { href: "/videos", label: "שיעורים וחיזוקים בוידאו" },
  { href: "/dvar-tora", label: "דברי תורה" },
  { href: "/moadim", label: "מועדים" },
  { href: "/lectures", label: "הרצאות" },
  { href: "/shaal", label: 'שו"ת עם הרב' },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header
      className="sticky top-0 z-50"
      style={{
        height: "76px",
        backgroundColor: "rgba(251,250,246,0.93)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        borderBottom: "1px solid var(--color-line-light)",
      }}
    >
      <div className="container h-full">
        <div className="flex items-center justify-between h-full">
          {/* Logo */}
          <Link href="/" aria-label="עמוד הבית">
            <Logo size={0.85} horizontal />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1" aria-label="ניווט ראשי">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-2 rounded-lg font-medium transition-colors"
                style={{ fontSize: "0.875rem", color: "var(--color-ink-body)" }}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* CTA + hamburger */}
          <div className="flex items-center gap-3">
            <Link
              href="/shaal"
              className="btn-primary hidden md:inline-flex"
              style={{ padding: "10px 20px", fontSize: "14px", borderRadius: "8px" }}
            >
              שאל שאלה ←
            </Link>
            <button
              className="md:hidden p-2 rounded-lg transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="תפריט"
              aria-expanded={mobileOpen}
              style={{ color: "var(--color-navy)" }}
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          className="md:hidden"
          style={{
            backgroundColor: "rgba(251,250,246,0.97)",
            backdropFilter: "blur(10px)",
            borderBottom: "1px solid var(--color-line-light)",
          }}
        >
          <nav className="container py-3 flex flex-col gap-1" aria-label="תפריט נייד">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-4 py-3 rounded-lg font-medium transition-colors"
                style={{ color: "var(--color-ink-body)" }}
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/shaal"
              className="btn-primary mt-2 text-center"
              onClick={() => setMobileOpen(false)}
            >
              שאל שאלה ←
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
