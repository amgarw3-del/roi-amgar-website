import { defineType, defineField } from "@sanity/types";

export const qnaSchema = defineType({
  name: "qna",
  title: "שאל את הרב",
  type: "document",
  fields: [
    defineField({ name: "question", title: "שאלה", type: "text" }),
    defineField({
      name: "slug",
      title: "כתובת URL",
      type: "slug",
      options: { source: "question" },
    }),
    defineField({
      name: "questionType",
      title: "סוג שאלה",
      type: "string",
      options: {
        list: [
          { value: "general", title: "כללית" },
          { value: "personal", title: "אישית" },
          { value: "practical-ruling", title: "למעשה" },
        ],
      },
    }),
    defineField({ name: "askerName", title: "שם השואל (אופציונלי)", type: "string" }),
    defineField({ name: "phone", title: "טלפון", type: "string" }),
    defineField({ name: "answer", title: "תשובה", type: "text" }),
    defineField({
      name: "answerType",
      title: "סוג תשובה",
      type: "string",
      options: {
        list: [
          { value: "for-learning", title: "לצורך לימוד" },
          { value: "practical", title: "למעשה" },
        ],
      },
      initialValue: "for-learning",
    }),
    defineField({
      name: "category",
      title: "נושא ראשי",
      type: "reference",
      to: [{ type: "category" }],
    }),
    defineField({
      name: "extraCategories",
      title: "נושאים נוספים",
      type: "array",
      of: [{ type: "reference", to: [{ type: "category" }] }],
      validation: (rule) => rule.max(2),
      description: "עד 2 נושאים נוספים (סך הכל עד 3)",
    }),
    defineField({
      name: "subTopics",
      title: "תתי-נושאים",
      type: "array",
      of: [{ type: "reference", to: [{ type: "subTopic" }] }],
      description: "מועד / פרשה / צום / אירוע לאומי — אפשר לבחור כמה",
    }),
    defineField({
      name: "searchKeywords",
      title: "מילות חיפוש לבוט",
      type: "array",
      of: [{ type: "string" }],
      description:
        "מילים שיעזרו לבוט למצוא את התשובה גם אם השואל ניסח אחרת. דוגמא: ['ספירת העומר', 'תספורת', 'גילוח']",
    }),
    defineField({ name: "hebrewDate", title: "תאריך עברי", type: "string" }),
    defineField({ name: "publishedAt", title: "תאריך פרסום", type: "datetime" }),
    defineField({
      name: "isPublic",
      title: "פורסם בפומבי",
      type: "boolean",
      initialValue: false,
    }),
  ],
});
