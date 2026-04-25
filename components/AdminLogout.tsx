"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export default function AdminLogout() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="inline-flex items-center gap-1.5 text-sm px-4 py-2 rounded-xl font-semibold text-red-600 bg-red-50 transition-opacity hover:opacity-80"
    >
      <LogOut size={14} />
      התנתק
    </button>
  );
}
