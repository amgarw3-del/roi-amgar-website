import type { Metadata } from "next";
import AdminSidebar from "@/components/admin/AdminSidebar";

export const metadata: Metadata = {
  title: { default: "לוח מנהל", template: "%s | לוח מנהל" },
  robots: "noindex,nofollow",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex" dir="rtl" style={{ background: "#f8f7f4" }}>
      <AdminSidebar />
      <main className="flex-1 min-w-0 overflow-auto pt-[52px] md:pt-0">
        <div className="max-w-5xl mx-auto px-4 py-6 md:px-8 md:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
