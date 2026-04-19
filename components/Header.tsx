"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, Search } from "lucide-react";

const navLinks = [
  { href: "/parasha", label: "פרשת שבוע" },
  { href: "/halacha", label: "הלכה" },
  { href: "/emuna", label: "אמונה" },
  { href: "/zugiyut", label: "זוגיות" },
  { href: "/dvar-tora", label: "דברי תורה" },
  { href: "/moadim", label: "מועדים" },
  { href: "/shaal", label: "שאל את הרב" },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
      <div className="container">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span
              className="text-xl font-bold"
              style={{ color: "var(--color-primary)" }}
            >
              הרב רועי אמגר
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 font-medium text-sm transition-colors"
                style={{ fontSize: "0.9rem" }}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Link
              href="/search"
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="חיפוש"
            >
              <Search size={20} className="text-gray-600" />
            </Link>
            <Link
              href="/shaal"
              className="btn-primary hidden md:inline-flex text-sm py-2 px-4"
            >
              שאל שאלה
            </Link>
            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 rounded-full hover:bg-gray-100 transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="תפריט"
            >
              {mobileOpen ? (
                <X size={22} className="text-gray-600" />
              ) : (
                <Menu size={22} className="text-gray-600" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white">
          <nav className="container py-3 flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
