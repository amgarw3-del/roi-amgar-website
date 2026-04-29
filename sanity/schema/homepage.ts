import { defineType, defineField } from "@sanity/types";

export const BLOCK_TYPES = [
  { value: "hero", title: "Hero (כותרת ראשית)" },
  { value: "categories", title: "תחומי לימוד" },
  { value: "videos", title: "סרטונים אחרונים" },
  { value: "shorts", title: "סרטונים קצרים (רואים תורה)" },
  { value: "lecturesStrip", title: "פס הרצאות" },
  { value: "divreiTora", title: "דברי תורה" },
  { value: "blog", title: "מאמרים" },
  { value: "qna", title: "שאל את הרב" },
  { value: "newsletter", title: "ניוזלטר" },
  { value: "social", title: "רשתות חברתיות" },
  { value: "donation", title: "תרומה" },
] as const;

export const homepageSchema = defineType({
  name: "homepage",
  title: "עמוד הבית",
  type: "document",
  fields: [
    defineField({
      name: "heroTitle",
      title: "כותרת ראשית",
      type: "string",
    }),
    defineField({
      name: "heroSubtitle",
      title: "כותרת משנית",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "heroImage",
      title: "תמונת רקע ל-Hero",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "heroCtaLabel",
      title: "טקסט כפתור Hero",
      type: "string",
    }),
    defineField({
      name: "heroCtaHref",
      title: "קישור כפתור Hero",
      type: "string",
    }),
    defineField({
      name: "blocks",
      title: "בלוקים בעמוד",
      type: "array",
      of: [
        {
          type: "object",
          name: "homeBlock",
          fields: [
            defineField({
              name: "type",
              title: "סוג בלוק",
              type: "string",
              options: { list: BLOCK_TYPES.map((b) => ({ title: b.title, value: b.value })) },
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "enabled",
              title: "מופעל",
              type: "boolean",
              initialValue: true,
            }),
          ],
          preview: {
            select: { type: "type", enabled: "enabled" },
            prepare: ({ type, enabled }) => ({
              title: BLOCK_TYPES.find((b) => b.value === type)?.title ?? type,
              subtitle: enabled ? "מופעל" : "מוסתר",
            }),
          },
        },
      ],
    }),
  ],
});
