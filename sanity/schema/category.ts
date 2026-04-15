import { defineType, defineField } from "@sanity/types";

export const categorySchema = defineType({
  name: "category",
  title: "קטגוריה",
  type: "document",
  fields: [
    defineField({ name: "name", title: "שם (אנגלית/slug)", type: "string" }),
    defineField({ name: "hebrewName", title: "שם עברי", type: "string" }),
    defineField({
      name: "slug",
      title: "כתובת URL",
      type: "slug",
      options: { source: "name" },
    }),
    defineField({ name: "description", title: "תיאור", type: "text" }),
    defineField({
      name: "pillarPageContent",
      title: "תוכן Pillar Page (SEO)",
      type: "array",
      of: [{ type: "block" }],
    }),
  ],
});
