"use client";
import { useState } from "react";

export default function SubscribeBanner() {
  const [form, setForm] = useState({ name: "", phone: "", email: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setStatus("success");
        setForm({ name: "", phone: "", email: "" });
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  return (
    <section style={{ background: "var(--color-primary)" }} className="py-8">
      <div className="container">
        <div className="flex flex-col md:flex-row items-center gap-6">
          {/* טקסט */}
          <div className="text-white text-center md:text-right flex-shrink-0">
            <h3 className="text-xl font-bold mb-1">הצטרפו לרשימת הדיוור</h3>
            <p className="text-white/70 text-sm">קבלו עדכונים ושיעורים ישירות אליכם</p>
          </div>

          {/* טופס */}
          {status === "success" ? (
            <div className="flex-1 text-center bg-white/15 rounded-2xl py-4 px-6">
              <p className="text-white font-bold text-lg">🎉 נרשמתם בהצלחה! תודה</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col sm:flex-row gap-3 w-full">
              <input
                type="text"
                placeholder="שם מלא *"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="flex-1 rounded-xl px-4 py-3 text-gray-800 text-sm font-medium outline-none focus:ring-2"
                style={{ direction: "rtl" }}
              />
              <input
                type="tel"
                placeholder="טלפון"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="flex-1 rounded-xl px-4 py-3 text-gray-800 text-sm font-medium outline-none focus:ring-2"
                style={{ direction: "rtl" }}
              />
              <input
                type="email"
                placeholder="אימייל *"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="flex-1 rounded-xl px-4 py-3 text-gray-800 text-sm font-medium outline-none focus:ring-2"
                style={{ direction: "rtl" }}
              />
              <button
                type="submit"
                disabled={status === "loading"}
                className="px-6 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap"
                style={{ background: "var(--color-accent)", color: "white" }}
              >
                {status === "loading" ? "שולח..." : "הרשמה"}
              </button>
            </form>
          )}
          {status === "error" && (
            <p className="text-red-300 text-sm">שגיאה, נסה שוב</p>
          )}
        </div>
      </div>
    </section>
  );
}
