import { defineType, defineField } from "@sanity/types";

export const divarToraSchema = defineType({
  name: "divarTora",
  title: "דבר תורה",
  type: "document",
  fields: [
    defineField({ name: "title", title: "כותרת", type: "string" }),
    defineField({
      name: "slug",
      title: "כתובת URL",
      type: "slug",
      options: { source: "title" },
    }),
    defineField({
      name: "teaser",
      title: "תקציר שיווקי",
      type: "text",
      rows: 2,
      description: "1-2 משפטים שמגרים לקרוא — מה ישאל הקורא שרוצה לדעת תשובה",
    }),
    defineField({
      name: "content",
      title: "תוכן מלא",
      type: "text",
      rows: 10,
    }),
    defineField({
      name: "category",
      title: "נושא",
      type: "reference",
      to: [{ type: "category" }],
    }),
    defineField({
      name: "sourceType",
      title: "מקור",
      type: "string",
      options: {
        list: [
          { value: "shiur", title: "מתמלול שיעור" },
          { value: "manual", title: "ידני" },
          { value: "uploaded", title: "מחומר שהועלה" },
        ],
      },
      initialValue: "shiur",
    }),
    defineField({ name: "hebrewDate", title: "תאריך עברי", type: "string" }),
    defineField({ name: "publishedAt", title: "תאריך פרסום", type: "datetime" }),
    defineField({
      name: "status",
      title: "סטטוס",
      type: "string",
      options: {
        list: [
          { value: "draft", title: "טיוטה" },
          { value: "published", title: "פורסם" },
        ],
      },
      initialValue: "published",
    }),
  ],
  preview: {
    select: { title: "title", subtitle: "teaser" },
  },
});
