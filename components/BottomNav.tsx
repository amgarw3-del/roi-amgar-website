"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Video, Scroll, Mic, Heart, MessageCircleQuestion, Star, FileText, Info } from "lucide-react";

const navItems = [
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

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 right-0 left-0 z-40 bg-white border-t border-gray-200 safe-area-inset-bottom">
      <div className="flex overflow-x-auto h-16 scrollbar-none" style={{ scrollbarWidth: "none" }}>
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
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
