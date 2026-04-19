export default function Logo() {
  return (
    <div className="flex items-center gap-2.5" dir="rtl">
      {/* אייקון ספר תורה */}
      <svg
        width="36"
        height="36"
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* עמודי התורה */}
        <rect x="4" y="6" width="5" height="24" rx="2.5" fill="#06415D" />
        <rect x="27" y="6" width="5" height="24" rx="2.5" fill="#06415D" />
        {/* גליל הספר */}
        <rect x="8" y="9" width="20" height="18" rx="1" fill="#EEF4F8" stroke="#06415D" strokeWidth="1.2" />
        {/* שורות כתב */}
        <line x1="11" y1="14" x2="25" y2="14" stroke="#C8956A" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="11" y1="18" x2="25" y2="18" stroke="#C8956A" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="11" y1="22" x2="20" y2="22" stroke="#C8956A" strokeWidth="1.2" strokeLinecap="round" />
        {/* כתר עליון */}
        <path d="M15 6 L18 2 L21 6" stroke="#C8956A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <circle cx="18" cy="2" r="1.2" fill="#C8956A" />
      </svg>

      {/* טקסט הלוגו */}
      <div className="flex flex-col leading-tight">
        <span
          className="font-bold tracking-wide"
          style={{ color: "var(--color-primary)", fontSize: "1.1rem", letterSpacing: "0.02em" }}
        >
          הרב רועי אמגר
        </span>
        <span
          className="font-medium"
          style={{ color: "var(--color-accent)", fontSize: "0.65rem", letterSpacing: "0.08em" }}
        >
          תורה לחיים
        </span>
      </div>
    </div>
  );
}
