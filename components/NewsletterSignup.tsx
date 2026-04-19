"use client";

import { useState } from "react";
import { Mail, CheckCircle2 } from "lucide-react";

export default function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    // TODO: connect to Mailchimp API
    await new Promise((r) => setTimeout(r, 800));
    setSubmitted(true);
    setLoading(false);
  }

  return (
    <section style={{ background: "white" }} className="py-12">
      <div className="container">
        <div className="max-w-xl mx-auto text-center">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: "var(--color-primary)" }}
          >
            <Mail size={22} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--color-primary)" }}>
            פרשת השבוע ישירות למייל
          </h2>
          <p className="text-gray-600 mb-6">
            דבר תורה שבועי, שאלות ותשובות נבחרות ועדכונים על שיעורים חדשים
          </p>

          {submitted ? (
            <div className="flex items-center justify-center gap-2 text-green-700 font-semibold">
              <CheckCircle2 size={22} />
              נרשמת בהצלחה! תודה רבה
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
            >
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="כתובת המייל שלך"
                required
                className="flex-1 px-4 py-3 rounded-full border-2 border-gray-200 focus:border-primary focus:outline-none text-right"
                dir="rtl"
                suppressHydrationWarning
              />
              <button
                type="submit"
                disabled={loading}
                className="btn-primary whitespace-nowrap"
                suppressHydrationWarning
              >
                {loading ? "נרשם..." : "הרשמה חינמית"}
              </button>
            </form>
          )}

          <div className="mt-4 flex flex-wrap justify-center gap-4">
            <a
              href="https://wa.me/972XXXXXXXXX?text=הרשמה+לקבוצת+פרשת+שבוע"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm font-medium text-green-700 hover:text-green-800"
            >
              📱 קבוצת WhatsApp פרשת שבוע
            </a>
            <a
              href="https://wa.me/972XXXXXXXXX?text=הרשמה+לעדכונים"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm font-medium text-green-700 hover:text-green-800"
            >
              🔔 עדכוני שיעורים חדשים
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
