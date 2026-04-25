"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Settings } from "lucide-react";

export default function AdminBar() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    fetch("/api/admin/session")
      .then((r) => (r.ok ? setVisible(true) : null))
      .catch(() => null);
  }, []);

  if (!visible) return null;

  return (
    <div
      className="w-full flex items-center justify-between px-4 py-2 text-sm font-semibold"
      style={{ background: "var(--color-primary)", color: "#fff" }}
    >
      <span className="opacity-80">מצב מנהל</span>
      <Link
        href="/admin"
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg transition-opacity hover:opacity-80"
        style={{ background: "rgba(255,255,255,0.15)" }}
      >
        <Settings size={13} />
        לוח מנהל
      </Link>
    </div>
  );
}
