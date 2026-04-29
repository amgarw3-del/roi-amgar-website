import { defineType, defineField } from "@sanity/types";

export const lectureFaqSchema = defineType({
  name: "lectureFaq",
  title: "שאלה נפוצה (הרצאות)",
  type: "document",
  fields: [
    defineField({
      name: "question",
      title: "שאלה",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "answer",
      title: "תשובה",
      type: "text",
      rows: 4,
      validation: (rule) => rule.required(),
    }),
    defineField({ name: "order", title: "סדר הצגה", type: "number", initialValue: 0 }),
    defineField({
      name: "published",
      title: "מפורסם",
      type: "boolean",
      initialValue: true,
    }),
  ],
  preview: { select: { title: "question", subtitle: "answer" } },
});
