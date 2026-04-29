"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Video,
  BookOpen,
  HelpCircle,
  Tag,
  Mail,
  FileText,
  LogOut,
  Menu,
  X,
  Mic,
  Home,
} from "lucide-react";

const navItems = [
  { href: "/admin", label: "דשבורד", icon: LayoutDashboard, exact: true },
  { href: "/admin/content/homepage", label: "עמוד הבית", icon: Home },
  { href: "/admin/content/videos", label: "סרטונים", icon: Video },
  { href: "/admin/content/divrei-tora", label: "דברי תורה", icon: BookOpen },
  { href: "/admin/content/blog", label: "מאמרים", icon: FileText },
  { href: "/admin/content/qna", label: "שאל את הרב", icon: HelpCircle },
  { href: "/admin/content/lectures", label: "הרצאות", icon: Mic },
  { href: "/admin/content/categories", label: "קטגוריות", icon: Tag },
  { href: "/admin/newsletter", label: "ניוזלטר", icon: Mail },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  function isActive(href: string, exact?: boolean) {
    return exact ? pathname === href : pathname.startsWith(href);
  }

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* לוגו */}
      <div className="px-5 py-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
            style={{ background: "var(--color-primary)" }}
          >
            ר
          </div>
          <div>
            <p className="font-bold text-sm leading-tight" style={{ color: "var(--color-primary)" }}>
              לוח מנהל
            </p>
            <p className="text-xs text-gray-400">הרב רועי אמגר</p>
          </div>
        </div>
      </div>

      {/* ניווט */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon, exact }) => (
          <Link
            key={href}
            href={href}
            onClick={() => setOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              isActive(href, exact)
                ? "text-white"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`}
            style={
              isActive(href, exact)
                ? { background: "var(--color-primary)" }
                : {}
            }
          >
            <Icon size={18} className="shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      {/* כפתור התנתקות */}
      <div className="px-3 py-4 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors w-full"
        >
          <LogOut size={18} className="shrink-0" />
          התנתקות
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex flex-col w-56 shrink-0 border-l border-gray-200 bg-white sticky top-0 h-screen overflow-y-auto"
      >
        {sidebarContent}
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 right-0 left-0 z-40 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
            style={{ background: "var(--color-primary)" }}
          >
            ר
          </div>
          <span className="font-bold text-sm" style={{ color: "var(--color-primary)" }}>
            לוח מנהל
          </span>
        </div>
        <button
          onClick={() => setOpen((o) => !o)}
          className="p-1 rounded-lg text-gray-500 hover:bg-gray-100"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile sidebar overlay */}
      {open && (
        <div className="md:hidden fixed inset-0 z-30">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setOpen(false)}
          />
          <aside
            className="absolute top-0 right-0 h-full w-64 bg-white shadow-xl"
            style={{ marginTop: 52 }}
          >
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Mobile spacer */}
      <div className="md:hidden h-[52px] w-full fixed top-0 pointer-events-none" />
    </>
  );
}
