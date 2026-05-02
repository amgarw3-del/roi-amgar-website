import { defineType, defineField } from "@sanity/types";

export const siteStatsSchema = defineType({
  name: "siteStats",
  title: "סטטיסטיקות אתר",
  type: "document",
  fields: [
    defineField({
      name: "chatCount",
      title: "מספר שאלות AI Chat",
      type: "number",
      initialValue: 0,
      readOnly: true,
    }),
    defineField({
      name: "chatCountUpdatedAt",
      title: "עודכן לאחרונה",
      type: "datetime",
      readOnly: true,
    }),
  ],
  preview: {
    select: { title: "chatCount" },
    prepare: ({ title }) => ({ title: `שאלות AI: ${title ?? 0}` }),
  },
});
