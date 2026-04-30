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
          { title: "כללי", value: "general" },
        ],
      },
    }),
    defineField({ name: "order", title: "סדר", type: "number" }),
    defineField({
      name: "aliases",
      title: "שמות חלופיים / מילות חיפוש",
      type: "array",
      of: [{ type: "string" }],
      description:
        "שמות נוספים בהם המשתמשים עשויים לחפש את הנושא — דוגמא לראש השנה: 'יום הדין', 'תשרי', 'ר״ה'. עוזר לבוט החיפוש למצוא את התוכן.",
    }),
  ],
  preview: {
    select: { title: "hebrewName", subtitle: "group" },
  },
});
