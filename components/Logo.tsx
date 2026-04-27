type LogoProps = {
  size?: number;
  color?: string;
  accent?: string;
  showText?: boolean;
  horizontal?: boolean;
};

export default function Logo({
  size = 1,
  color = "var(--color-navy)",
  accent = "var(--color-ochre)",
  showText = true,
  horizontal = false,
}: LogoProps) {
  const serif = `'Frank Ruhl Libre', var(--font-frank), serif`;

  if (horizontal) {
    return (
      <div
        style={{
          display: "inline-flex",
          flexDirection: "row",
          alignItems: "center",
          gap: 10 * size,
        }}
      >
        <svg
          width={16 * size}
          height={12 * size}
          viewBox="0 0 20 14"
          aria-hidden="true"
        >
          <circle cx="10" cy="9" r="2.6" fill={accent} />
          <circle
            cx="10"
            cy="9"
            r="5.5"
            fill="none"
            stroke={accent}
            strokeWidth="0.5"
            opacity="0.4"
          />
        </svg>
        {showText && (
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
            <span
              style={{
                fontFamily: serif,
                fontSize: 22 * size,
                fontWeight: 700,
                color,
                letterSpacing: "-0.01em",
              }}
            >
              הרב רועי אמגר
            </span>
            <span
              style={{
                fontSize: 9 * size,
                color: accent,
                letterSpacing: "0.35em",
                fontWeight: 600,
                marginTop: 2 * size,
              }}
            >
              תורה לחיים
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      style={{
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8 * size,
      }}
    >
      {/* Spark */}
      <svg
        width={20 * size}
        height={14 * size}
        viewBox="0 0 20 14"
        style={{ marginBottom: -2 * size }}
        aria-hidden="true"
      >
        <circle cx="10" cy="9" r="2.6" fill={accent} />
        <circle
          cx="10"
          cy="9"
          r="5.5"
          fill="none"
          stroke={accent}
          strokeWidth="0.5"
          opacity="0.4"
        />
      </svg>

      {showText && (
        <>
          <span
            style={{
              fontFamily: serif,
              fontSize: 32 * size,
              fontWeight: 700,
              color,
              letterSpacing: "-0.01em",
              lineHeight: 1,
            }}
          >
            הרב רועי אמגר
          </span>

          <div style={{ display: "flex", alignItems: "center", gap: 10 * size }}>
            <span
              style={{
                width: 36 * size,
                height: 1,
                background: accent,
                display: "block",
              }}
            />
            <span
              style={{
                fontSize: 11 * size,
                color: accent,
                letterSpacing: "0.45em",
                fontWeight: 600,
              }}
            >
              תורה לחיים
            </span>
            <span
              style={{
                width: 36 * size,
                height: 1,
                background: accent,
                display: "block",
              }}
            />
          </div>
        </>
      )}
    </div>
  );
}
