"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookOpen, Scroll, MessageCircleQuestion, Star } from "lucide-react";

const navItems = [
  { href: "/", label: "בית", icon: Home },
  { href: "/shiurim", label: "שיעורים", icon: BookOpen },
  { href: "/dvar-tora", label: "דברי תורה", icon: Scroll },
  { href: "/shaal", label: "שאל", icon: MessageCircleQuestion },
  { href: "/parasha", label: "פרשה", icon: Star },
  ];

export default function BottomNav() {
    const pathname = usePathname();

  return (
        <nav className="md:hidden fixed bottom-0 right-0 left-0 z-40 bg-white border-t border-gray-200 safe-area-inset-bottom">
              <div className="flex items-center justify-around h-16">
                {navItems.map(({ href, label, icon: Icon }) => {
                    const active = pathname === href;
                    return (
                                  <Link
                                                  key={href}
                                                  href={href}
                                                  className="flex flex-col items-center gap-0.5 flex-1 py-2 transition-colors"
                                                  style={{ color: active ? "var(--color-primary)" : "#6b7280" }}
                                                >
                                                <Icon
                                                                  size={22}
                                                                  strokeWidth={active ? 2.5 : 1.8}
                                                                />
                                                <span className="text-xs font-medium">{label}</span>span>
                                  </Link>Link>
                                );
        })}
              </div>div>
        </nav>nav>
      );
}</nav>
