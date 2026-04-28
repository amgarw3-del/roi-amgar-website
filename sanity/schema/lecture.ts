import { defineType, defineField } from "@sanity/types";

export const lectureSchema = defineType({
  name: "lecture",
  title: "הרצאה",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "שם ההרצאה",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "summary",
      title: "תקציר",
      type: "text",
      rows: 3,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "flyer",
      title: "פלאייר",
      type: "image",
      options: { hotspot: true },
      fields: [{ name: "alt", title: "תיאור תמונה", type: "string" }],
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
  preview: { select: { title: "title", subtitle: "summary", media: "flyer" } },
});
