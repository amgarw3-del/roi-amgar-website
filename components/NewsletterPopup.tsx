"use client";

import { useEffect, useState } from "react";
import { X, CheckCircle2 } from "lucide-react";

const STORAGE_KEY = "newsletter_popup_shown";
const DELAY_MS = 2 * 60 * 1000; // 2 דקות

export default function NewsletterPopup() {
  const [visible, setVisible] = useState(false);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(STORAGE_KEY)) return;

    const timer = setTimeout(() => setVisible(true), DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  function close() {
    setVisible(false);
    sessionStorage.setItem(STORAGE_KEY, "1");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${form.firstName} ${form.lastName}`.trim(),
          email: form.email,
          phone: form.phone,
        }),
      });
      if (res.ok) {
        setStatus("success");
        setTimeout(close, 2500);
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  if (!visible) return null;

  const serif = `'Frank Ruhl Libre', var(--font-frank), serif`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="הצטרפות לניוזלטר"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        background: "rgba(15,38,56,0.55)",
        backdropFilter: "blur(4px)",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) close(); }}
    >
      <div
        style={{
          background: "var(--color-bg-paper)",
          borderRadius: "16px",
          width: "100%",
          maxWidth: "480px",
          position: "relative",
          overflow: "hidden",
          boxShadow: "0 24px 60px rgba(15,23,41,0.25)",
        }}
      >
        {/* פס צבע עליון */}
        <div style={{ height: "5px", background: "linear-gradient(90deg, var(--color-navy), var(--color-ochre))" }} />

        <div style={{ padding: "36px 32px 32px" }}>
          {/* כפתור סגירה */}
          <button
            onClick={close}
            aria-label="סגור"
            style={{
              position: "absolute",
              top: "16px",
              left: "16px",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "var(--color-muted)",
              padding: "4px",
              borderRadius: "6px",
              lineHeight: 1,
            }}
          >
            <X size={20} />
          </button>

          {status === "success" ? (
            <div style={{ textAlign: "center", padding: "16px 0" }}>
              <CheckCircle2
                size={48}
                style={{ color: "#16a34a", margin: "0 auto 16px" }}
              />
              <h2 style={{ fontFamily: serif, fontSize: "22px", color: "var(--color-navy)", marginBottom: "8px" }}>
                נרשמת בהצלחה!
              </h2>
              <p style={{ color: "var(--color-muted)", fontSize: "15px" }}>
                תודה רבה — דבר תורה שבועי בדרך אליך 📖
              </p>
            </div>
          ) : (
            <>
              {/* כותרת */}
              <div style={{ textAlign: "center", marginBottom: "28px" }}>
                {/* Spark */}
                <svg width="20" height="14" viewBox="0 0 20 14" style={{ margin: "0 auto 12px", display: "block" }} aria-hidden="true">
                  <circle cx="10" cy="9" r="2.6" fill="var(--color-ochre)" />
                  <circle cx="10" cy="9" r="5.5" fill="none" stroke="var(--color-ochre)" strokeWidth="0.5" opacity="0.4" />
                </svg>
                <h2 style={{ fontFamily: serif, fontSize: "24px", fontWeight: 700, color: "var(--color-navy)", marginBottom: "8px" }}>
                  דבר תורה שבועי ממני
                </h2>
                <p style={{ color: "var(--color-muted)", fontSize: "15px", lineHeight: 1.6 }}>
                  הצטרפו לאלפים שמקבלים בכל שבוע השראה, תובנות וכלים מתורת ישראל
                </p>
              </div>

              {/* טופס */}
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={labelStyle}>שם פרטי *</label>
                    <input
                      type="text"
                      required
                      value={form.firstName}
                      onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                      placeholder="ישראל"
                      dir="rtl"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>שם משפחה *</label>
                    <input
                      type="text"
                      required
                      value={form.lastName}
                      onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                      placeholder="ישראלי"
                      dir="rtl"
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>כתובת מייל *</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="israel@example.com"
                    dir="ltr"
                    style={{ ...inputStyle, textAlign: "left" }}
                  />
                </div>

                <div>
                  <label style={labelStyle}>מספר טלפון</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="050-0000000"
                    dir="ltr"
                    style={{ ...inputStyle, textAlign: "left" }}
                  />
                </div>

                {status === "error" && (
                  <p style={{ color: "#dc2626", fontSize: "13px", textAlign: "center" }}>
                    אירעה שגיאה, נסה שנית
                  </p>
                )}

                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="btn-primary"
                  style={{ width: "100%", marginTop: "4px", justifyContent: "center" }}
                >
                  {status === "loading" ? "שולח..." : "הצטרפות חינמית ←"}
                </button>
              </form>

              <p style={{ textAlign: "center", fontSize: "12px", color: "var(--color-muted)", marginTop: "12px" }}>
                ללא ספאם. אפשר להסיר בכל עת.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "13px",
  fontWeight: 600,
  color: "var(--color-navy)",
  marginBottom: "5px",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "11px 14px",
  border: "1.5px solid var(--color-line)",
  borderRadius: "8px",
  fontSize: "15px",
  color: "var(--color-ink-body)",
  background: "white",
  outline: "none",
  transition: "border-color 0.2s",
};
