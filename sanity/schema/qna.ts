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
      title: "קטגוריה",
      type: "reference",
      to: [{ type: "category" }],
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
