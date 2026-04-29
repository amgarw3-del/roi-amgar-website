import { defineType, defineField } from "@sanity/types";

export const pdfSummarySchema = defineType({
  name: "pdfSummary",
  title: "סיכום למבחן רבנות",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "כותרת הסיכום",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "description",
      title: "תיאור קצר",
      type: "text",
      rows: 2,
    }),
    defineField({
      name: "category",
      title: "קטגוריה",
      type: "string",
      options: {
        list: [
          { title: "כללי", value: "general" },
          { title: "הלכות שבת", value: "shabbat" },
          { title: "הלכות כשרות", value: "kashrut" },
          { title: "הלכות נידה", value: "nidda" },
          { title: "הלכות אבלות", value: "evelut" },
          { title: "הלכות יורה דעה", value: "yoreh-deah" },
        ],
      },
      initialValue: "general",
    }),
    defineField({
      name: "pdfFile",
      title: "קובץ PDF",
      type: "file",
      options: { accept: ".pdf" },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "order",
      title: "סדר הצגה",
      type: "number",
      initialValue: 0,
    }),
    defineField({
      name: "published",
      title: "מפורסם",
      type: "boolean",
      initialValue: true,
    }),
  ],
  preview: {
    select: { title: "title", subtitle: "category" },
  },
});
