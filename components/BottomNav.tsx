"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useEffect } from "react";
import { Home, Video, Scroll, Mic, Heart, MessageCircleQuestion, Star, FileText, Info } from "lucide-react";

const BASE_ITEMS = [
  { href: "/", label: "בית", icon: Home },
  { href: "/videos", label: "רואים תורה", icon: Video },
  { href: "/dvar-tora", label: "דברי תורה", icon: Scroll },
  { href: "/lectures", label: "הרצאות", icon: Mic },
  { href: "/hupot", label: "עריכת חופה", icon: Heart },
  { href: "/shaal", label: "שאל", icon: MessageCircleQuestion },
  { href: "/parasha", label: "פרשה", icon: Star },
  { href: "/sikkumim", label: "סיכומים", icon: FileText },
  { href: "/about", label: "אודות", icon: Info },
];

// Triple for infinite circular scroll
const tripled = [...BASE_ITEMS, ...BASE_ITEMS, ...BASE_ITEMS];

export default function BottomNav() {
  const pathname = usePathname();
  const scrollRef = useRef<HTMLDivElement>(null);
  const jumping = useRef(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    // Start scrolled to the middle set so user can go both directions
    el.scrollLeft = el.scrollWidth / 3;
  }, []);

  function handleScroll() {
    const el = scrollRef.current;
    if (!el || jumping.current) return;
    const oneSet = el.scrollWidth / 3;
    if (el.scrollLeft < oneSet * 0.4) {
      jumping.current = true;
      el.scrollLeft += oneSet;
      jumping.current = false;
    } else if (el.scrollLeft > oneSet * 2.6) {
      jumping.current = true;
      el.scrollLeft -= oneSet;
      jumping.current = false;
    }
  }

  return (
    <nav className="md:hidden fixed bottom-0 right-0 left-0 z-40 bg-white border-t border-gray-200 safe-area-inset-bottom">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        dir="ltr"
        className="flex overflow-x-auto h-16"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {tripled.map(({ href, label, icon: Icon }, i) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={i}
              href={href}
              className="flex flex-col items-center justify-center gap-0.5 flex-shrink-0 py-2 transition-colors"
              style={{
                width: "20vw",
                minWidth: "64px",
                color: active ? "var(--color-primary)" : "#6b7280",
              }}
            >
              <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
              <span className="text-xs font-medium leading-none text-center px-1">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
