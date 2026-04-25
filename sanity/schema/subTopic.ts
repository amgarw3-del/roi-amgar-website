import { defineType, defineField } from "@sanity/types";

export const subTopicSchema = defineType({
  name: "subTopic",
  title: "תת-נושא",
  type: "document",
  fields: [
    defineField({ name: "hebrewName", title: "שם עברי", type: "string" }),
    defineField({
      name: "slug",
      title: "מזהה URL",
      type: "slug",
      options: { source: "hebrewName" },
    }),
    defineField({
      name: "group",
      title: "קבוצה",
      type: "string",
      options: {
        list: [
          { title: "מועדים", value: "moed" },
          { title: "פרשיות", value: "parasha" },
          { title: "צומות", value: "fast" },
          { title: "מועדים לאומיים", value: "national" },
        ],
      },
    }),
    defineField({ name: "order", title: "סדר", type: "number" }),
  ],
  preview: {
    select: { title: "hebrewName", subtitle: "group" },
  },
});
