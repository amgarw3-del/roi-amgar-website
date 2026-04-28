import { defineType, defineField } from "@sanity/types";

export const testimonialSchema = defineType({
  name: "testimonial",
  title: "המלצה",
  type: "document",
  fields: [
    defineField({
      name: "quote",
      title: "ציטוט",
      type: "text",
      rows: 4,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "name",
      title: "שם הממליץ",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({ name: "role", title: "תפקיד / קהילה", type: "string" }),
    defineField({
      name: "photo",
      title: "תמונת פרופיל (אופציונלי)",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({ name: "order", title: "סדר הצגה", type: "number", initialValue: 0 }),
  ],
  preview: { select: { title: "name", subtitle: "role", media: "photo" } },
});
