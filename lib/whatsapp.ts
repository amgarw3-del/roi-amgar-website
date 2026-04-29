const PHONE = "972504305525";

export function buildLectureInquiryUrl(lectureName?: string): string {
  const lines = [
    "שלום הרב רועי, התעניינתי בהזמנת הרצאה דרך האתר.",
    lectureName ? `נושא ההרצאה: ${lectureName}` : "",
    "מסגרת: ",
    "תאריך מבוקש: ",
    "אשמח לפרטים נוספים. תודה!",
  ].filter(Boolean);
  return `https://wa.me/${PHONE}?text=${encodeURIComponent(lines.join("\n"))}`;
}

export function buildGeneralInquiryUrl(): string {
  const text = "שלום הרב רועי, אשמח לפרטים נוספים.";
  return `https://wa.me/${PHONE}?text=${encodeURIComponent(text)}`;
}

export function buildWeddingInquiryUrl(): string {
  const lines = [
    "שלום הרב רועי, שמענו עליך ומעוניינים שתערוך לנו את החופה.",
    "תאריך החתונה המתוכנן: ",
    "מקום האירוע: ",
    "אשמח לשמוע פרטים נוספים. תודה!",
  ];
  return `https://wa.me/${PHONE}?text=${encodeURIComponent(lines.join("\n"))}`;
}
