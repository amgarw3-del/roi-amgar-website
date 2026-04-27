"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";

export default function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setSubmitted(true);
    setLoading(false);
  }

  return (
    <section style={{ background: "var(--color-bg-cream)", padding: "64px 0" }}>
      <div className="container">
        <div
          style={{
            maxWidth: "600px",
            margin: "0 auto",
            border: "2px solid var(--color-ochre)",
            borderRadius: "4px",
            padding: "48px 40px",
            position: "relative",
            background: "var(--color-bg-paper)",
          }}
        >
          {/* פינות זהב — ימין-עליון */}
          <div
            style={{
              position: "absolute",
              top: "-6px",
              right: "-6px",
              width: "20px",
              height: "20px",
              borderTop: "3px solid var(--color-ochre)",
              borderRight: "3px solid var(--color-ochre)",
            }}
          />
          {/* פינת זהב — שמאל-עליון */}
          <div
            style={{
              position: "absolute",
              top: "-6px",
              left: "-6px",
              width: "20px",
              height: "20px",
              borderTop: "3px solid var(--color-ochre)",
              borderLeft: "3px solid var(--color-ochre)",
            }}
          />

          <div className="text-center" style={{ marginBottom: "32px" }}>
            <h2
              style={{
                color: "var(--color-navy)",
                fontSize: "24px",
                fontWeight: 700,
                marginBottom: "10px",
              }}
            >
              פרשת השבוע ישירות למייל
            </h2>
            <p style={{ color: "var(--color-muted)", fontSize: "15px", lineHeight: 1.6 }}>
              דבר תורה שבועי, שאלות ותשובות נבחרות ועדכונים על שיעורים חדשים
            </p>
          </div>

          {submitted ? (
            <div
              className="flex items-center justify-center gap-2"
              style={{ color: "#16a34a", fontWeight: 600, fontSize: "16px" }}
            >
              <CheckCircle2 size={22} />
              נרשמת בהצלחה! תודה רבה
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              style={{ display: "flex", direction: "rtl" }}
            >
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="כתובת המייל שלך"
                required
                dir="rtl"
                suppressHydrationWarning
                style={{
                  flex: 1,
                  padding: "14px 18px",
                  border: "1.5px solid var(--color-line)",
                  borderLeft: "none",
                  borderRadius: "0 4px 4px 0",
                  fontSize: "15px",
                  outline: "none",
                  background: "white",
                  color: "var(--color-ink-body)",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-ochre)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-line)")}
              />
              <button
                type="submit"
                disabled={loading}
                suppressHydrationWarning
                style={{
                  padding: "14px 24px",
                  background: "var(--color-navy)",
                  color: "var(--color-bg-paper)",
                  border: "none",
                  borderRadius: "4px 0 0 4px",
                  fontWeight: 700,
                  fontSize: "15px",
                  cursor: loading ? "wait" : "pointer",
                  whiteSpace: "nowrap",
                  transition: "background 0.2s",
                }}
              >
                {loading ? "..." : "הרשמה"}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
