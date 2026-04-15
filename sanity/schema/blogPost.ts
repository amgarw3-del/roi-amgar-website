import { defineType, defineField } from "@sanity/types";

export const blogPostSchema = defineType({
  name: "blogPost",
  title: "פוסט בלוג",
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
      name: "category",
      title: "קטגוריה",
      type: "reference",
      to: [{ type: "category" }],
    }),
    defineField({
      name: "level",
      title: "רמת לומד",
      type: "string",
      options: {
        list: [
          { value: "beginner", title: "מתחיל" },
          { value: "advanced", title: "מתקדם" },
          { value: "talmidei-torah", title: "לבני תורה" },
        ],
      },
    }),
    defineField({
      name: "body",
      title: "תוכן",
      type: "array",
      of: [{ type: "block" }],
    }),
    defineField({
      name: "source",
      title: "מקור",
      type: "string",
      options: {
        list: [
          { value: "manual", title: "ידני" },
          { value: "facebook", title: "Facebook" },
          { value: "instagram", title: "Instagram" },
          { value: "auto-summary", title: "סיכום אוטומטי" },
        ],
      },
      initialValue: "manual",
    }),
    defineField({ name: "hebrewDate", title: "תאריך עברי", type: "string" }),
    defineField({ name: "publishedAt", title: "תאריך פרסום", type: "datetime" }),
    defineField({
      name: "contentTier",
      title: "רמת תוכן",
      type: "string",
      options: {
        list: [
          { value: "free", title: "חינמי" },
          { value: "premium", title: "פרימיום" },
        ],
      },
      initialValue: "free",
    }),
  ],
});
