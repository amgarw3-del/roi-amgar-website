import { defineType, defineField } from "@sanity/types";

export const weddingTestimonialSchema = defineType({
  name: "weddingTestimonial",
  title: "המלצה מחתן וכלה",
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
      title: "שם הזוג",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "role",
      title: "תאריך / עיר החתונה (אופציונלי)",
      type: "string",
    }),
    defineField({
      name: "photo",
      title: "תמונה (אופציונלי)",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "order",
      title: "סדר הצגה",
      type: "number",
      initialValue: 0,
    }),
  ],
  preview: { select: { title: "name", subtitle: "role", media: "photo" } },
});
