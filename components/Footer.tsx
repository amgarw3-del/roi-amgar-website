import Link from "next/link";
import Logo from "./Logo";

const topics = [
  { href: "/parasha", label: "פרשת שבוע" },
  { href: "/halacha", label: "הלכה" },
  { href: "/emuna", label: "אמונה" },
  { href: "/zugiyut", label: "זוגיות" },
  { href: "/rega-shel-tora", label: "רגע של תורה" },
  { href: "/moadim", label: "מועדים" },
];

const content = [
  { href: "/shiurim", label: "שיעורים" },
  { href: "/dvar-tora", label: "דברי תורה" },
  { href: "/shaal", label: "שאל את הרב" },
  { href: "/about", label: "אודות" },
];

const social = [
  { label: "YouTube", href: "https://www.youtube.com/channel/UCpep2f42VluYwMqZ4kXiQTA" },
  { label: "Instagram", href: "https://instagram.com/harav_roi_amgar" },
  { label: "Facebook", href: "https://facebook.com/share/1ZMNajb5NE" },
  { label: "TikTok", href: "https://tiktok.com/@harav.roi.amgar" },
  { label: "WhatsApp", href: "https://whatsapp.com/channel/0029Vb7F1opJP212dpclkU3d" },
];

const year = new Date().getFullYear();

export default function Footer() {
  return (
    <footer
      style={{ background: "var(--color-navy-deep)", color: "var(--color-bg-paper)" }}
    >
      <div className="container" style={{ padding: "48px 1.5rem 24px" }}>
        {/* 4 עמודות */}
        <div
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10"
          style={{ marginBottom: "40px" }}
        >
          {/* עמודה 1: לוגו + תיאור */}
          <div>
            <div style={{ marginBottom: "16px" }}>
              <Logo
                size={0.9}
                color="var(--color-bg-paper)"
                accent="var(--color-ochre-light)"
              />
            </div>
            <p
              style={{
                fontSize: "14px",
                color: "rgba(250,243,226,0.6)",
                lineHeight: 1.7,
              }}
            >
              שיעורי תורה, הלכה, אמונה וזוגיות — תוכן מעמיק ומחיה מתורת ישראל.
            </p>
          </div>

          {/* עמודה 2: נושאים */}
          <div>
            <h3
              style={{
                fontSize: "13px",
                fontWeight: 700,
                color: "var(--color-bg-paper)",
                marginBottom: "16px",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              נושאים
            </h3>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
              {topics.map((t) => (
                <li key={t.href}>
                  <Link href={t.href} className="footer-link" style={{ fontSize: "14px" }}>
                    {t.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* עמודה 3: תוכן */}
          <div>
            <h3
              style={{
                fontSize: "13px",
                fontWeight: 700,
                color: "var(--color-bg-paper)",
                marginBottom: "16px",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              תוכן
            </h3>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
              {content.map((c) => (
                <li key={c.href}>
                  <Link href={c.href} className="footer-link" style={{ fontSize: "14px" }}>
                    {c.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* עמודה 4: עקבו */}
          <div>
            <h3
              style={{
                fontSize: "13px",
                fontWeight: 700,
                color: "var(--color-bg-paper)",
                marginBottom: "16px",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              עקבו אחרינו
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {social.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-link"
                  style={{ fontSize: "14px" }}
                >
                  {s.label}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* שורה תחתונה */}
        <div
          style={{
            borderTop: "1px solid rgba(250,243,226,0.12)",
            paddingTop: "20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "8px",
          }}
        >
          <p style={{ fontSize: "13px", color: "rgba(250,243,226,0.5)" }}>
            © {year} הרב רועי אמגר · כל הזכויות שמורות
          </p>
          <span
            style={{
              fontFamily: "'Frank Ruhl Libre', var(--font-frank), serif",
              fontSize: "14px",
              color: "var(--color-ochre-light)",
              letterSpacing: "0.15em",
            }}
          >
            בס״ד
          </span>
        </div>
      </div>
    </footer>
  );
}
