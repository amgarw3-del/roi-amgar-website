import Link from "next/link";

export default function Hero() {
  const serif = `'Frank Ruhl Libre', var(--font-frank), serif`;

  return (
    <section
      style={{ background: "var(--color-bg-hero)", paddingTop: "80px", paddingBottom: "64px" }}
    >
      <div className="container">
        <div className="hero-grid">
          {/* עמודה ימנית (ראשונה ב-RTL): טקסט */}
          <div>
            {/* Eyebrow */}
            <p
              style={{
                fontSize: "13px",
                color: "var(--color-ochre)",
                letterSpacing: "0.2em",
                fontWeight: 600,
                textTransform: "uppercase",
                marginBottom: "20px",
              }}
            >
              ◆ תורה לחיים
            </p>

            {/* כותרת ראשית */}
            <h1
              style={{
                lineHeight: 0.98,
                marginBottom: "28px",
                fontFamily: "var(--font-heebo)",
              }}
            >
              <span
                style={{
                  display: "block",
                  fontSize: "clamp(52px, 7vw, 92px)",
                  fontWeight: 800,
                  letterSpacing: "-0.025em",
                  color: "var(--color-ink)",
                }}
              >
                השראה,
              </span>
              <span
                style={{
                  display: "block",
                  fontSize: "clamp(52px, 7vw, 92px)",
                  fontWeight: 800,
                  letterSpacing: "-0.025em",
                  color: "var(--color-ink)",
                }}
              >
                תובנות וכלים
              </span>
              <span
                style={{
                  display: "block",
                  fontSize: "clamp(46px, 6.2vw, 82px)",
                  fontWeight: 600,
                  letterSpacing: "-0.02em",
                  color: "var(--color-ochre)",
                  fontFamily: serif,
                  fontStyle: "italic",
                }}
              >
                מתורת ישראל.
              </span>
            </h1>

            {/* תיאור */}
            <p
              style={{
                fontSize: "20px",
                color: "var(--color-muted-cool)",
                maxWidth: "520px",
                lineHeight: 1.7,
                marginBottom: "36px",
              }}
            >
              שיעורים, הלכה, אמונה וזוגיות — תוכן מעמיק ומחיה ישירות מתורת ישראל
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap gap-4">
              <Link href="/shiurim" className="btn-primary">
                צפו בשיעורים ←
              </Link>
              <Link
                href="/shaal"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  fontSize: "16px",
                  fontWeight: 600,
                  color: "var(--color-ink)",
                  padding: "16px 4px",
                  borderBottom: "1.5px solid var(--color-ink)",
                }}
              >
                שאל את הרב →
              </Link>
            </div>
          </div>

          {/* עמודה שמאלית (שנייה ב-RTL): פורטרט */}
          <div style={{ position: "relative" }}>
            <div
              style={{
                position: "relative",
                aspectRatio: "4/5",
                borderRadius: "24px",
                overflow: "hidden",
                maxWidth: "420px",
                margin: "0 auto",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/rabbi.jpg"
                alt="הרב רועי אמגר"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  objectPosition: "top center",
                }}
              />
            </div>

            {/* Badge */}
            <div
              style={{
                position: "absolute",
                bottom: "-12px",
                right: "-12px",
                background: "white",
                borderRadius: "12px",
                padding: "10px 16px",
                boxShadow: "0 8px 24px rgba(15, 23, 41, 0.12)",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "13px",
                fontWeight: 700,
                color: "var(--color-navy)",
                whiteSpace: "nowrap",
                border: "1px solid var(--color-line-light)",
              }}
            >
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: "#22c55e",
                  display: "inline-block",
                  flexShrink: 0,
                }}
              />
              שיעור חדש השבוע
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .hero-grid {
          display: flex;
          flex-direction: column-reverse;
          gap: 32px;
        }
        @media (min-width: 768px) {
          .hero-grid {
            display: grid;
            grid-template-columns: 1.4fr 1fr;
            gap: 80px;
            align-items: center;
          }
        }
      `}</style>
    </section>
  );
}
