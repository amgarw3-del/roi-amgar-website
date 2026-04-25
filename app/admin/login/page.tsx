"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/admin/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    setLoading(false);
    if (res.ok) {
      router.push("/admin");
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "שגיאה — נסה שוב");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50" dir="rtl">
      <div className="bg-white rounded-2xl shadow-lg p-10 w-full max-w-sm">
        <div className="flex flex-col items-center gap-3 mb-8">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{ background: "var(--color-warm)" }}
          >
            <Lock size={24} style={{ color: "var(--color-primary)" }} />
          </div>
          <h1 className="text-xl font-bold" style={{ color: "var(--color-primary)" }}>
            כניסת מנהל
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="סיסמה"
            autoFocus
            required
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-right focus:outline-none focus:ring-2"
            style={{ "--tw-ring-color": "var(--color-primary)" } as React.CSSProperties}
          />
          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ background: "var(--color-primary)" }}
          >
            {loading ? "מתחבר..." : "כניסה"}
          </button>
        </form>
      </div>
    </div>
  );
}
