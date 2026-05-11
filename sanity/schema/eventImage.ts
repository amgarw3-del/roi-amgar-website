import { defineType, defineField } from "@sanity/types";

/**
 * cache לתמונות אירוע שנוצרו ע"י Gemini.
 * cacheKey = `${eventKey}-${hebrewYear}` (לדוגמה: vayera-5786)
 * שימוש חוזר חוסך קריאות API ומבטיח עקביות ויזואלית.
 */
export const eventImageSchema = defineType({
  name: "eventImage",
  title: "תמונת אירוע (cache)",
  type: "document",
  fields: [
    defineField({
      name: "cacheKey",
      title: "מפתח cache",
      type: "string",
      description: "eventKey + hebrewYear (לדוגמה: vayera-5786)",
      validation: (rule) => rule.required(),
    }),
    defineField({ name: "eventKey", title: "מזהה אירוע", type: "string" }),
    defineField({ name: "eventName", title: "שם בעברית", type: "string" }),
    defineField({ name: "hebrewYear", title: "שנה עברית", type: "string" }),
    defineField({
      name: "image",
      title: "תמונה (1024x1024)",
      type: "image",
      options: { hotspot: false },
    }),
    defineField({ name: "generatedAt", title: "נוצר בתאריך", type: "datetime" }),
    defineField({
      name: "approvedByRabbi",
      title: "אושר על ידי הרב",
      type: "boolean",
      initialValue: false,
      description: "סמן אם הרב אישר את התמונה לשימוש חוזר בשנים הבאות",
    }),
  ],
  preview: {
    select: { title: "eventName", subtitle: "hebrewYear", media: "image" },
  },
});
