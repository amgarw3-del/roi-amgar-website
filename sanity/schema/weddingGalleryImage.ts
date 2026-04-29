import { defineType, defineField } from "@sanity/types";

export const weddingGalleryImageSchema = defineType({
  name: "weddingGalleryImage",
  title: "תמונה מחופה",
  type: "document",
  fields: [
    defineField({
      name: "image",
      title: "תמונה",
      type: "image",
      options: { hotspot: true },
      fields: [{ name: "alt", title: "תיאור", type: "string" }],
      validation: (rule) => rule.required(),
    }),
    defineField({ name: "caption", title: "כיתוב (אופציונלי)", type: "string" }),
    defineField({ name: "order", title: "סדר הצגה", type: "number", initialValue: 0 }),
  ],
  preview: { select: { title: "caption", media: "image" } },
});
