"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, CheckCircle, Loader2 } from "lucide-react";

interface Props {
  _id: string;
  canPublish?: boolean;
}

export default function AdminActions({ _id, canPublish = false }: Props) {
  const [loading, setLoading] = useState<"publish" | "delete" | null>(null);
  const router = useRouter();

  async function callApi(path: string) {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ _id }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      alert(d.error ?? "שגיאה");
    }
  }

  async function handlePublish() {
    if (!confirm("לפרסם את דבר התורה הזה?")) return;
    setLoading("publish");
    await callApi("/api/admin/publish");
    setLoading(null);
    router.refresh();
  }

  async function handleDelete() {
    if (!confirm("למחוק לצמיתות?")) return;
    setLoading("delete");
    await callApi("/api/admin/delete");
    setLoading(null);
    router.refresh();
  }

  return (
    <div className="flex gap-2">
      {canPublish && (
        <button
          onClick={handlePublish}
          disabled={loading !== null}
          className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg font-semibold transition-opacity hover:opacity-80 disabled:opacity-40"
          style={{ background: "var(--color-warm)", color: "var(--color-primary)" }}
        >
          {loading === "publish" ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={13} />}
          פרסם
        </button>
      )}
      <button
        onClick={handleDelete}
        disabled={loading !== null}
        className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg font-semibold transition-opacity hover:opacity-80 disabled:opacity-40 bg-red-50 text-red-600"
      >
        {loading === "delete" ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
        מחק
      </button>
    </div>
  );
}
