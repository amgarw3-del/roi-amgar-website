import { defineType, defineField } from "@sanity/types";

export const divarToraSchema = defineType({
  name: "divarTora",
  title: "דבר תורה",
  type: "document",
  fields: [
    defineField({ name: "title", title: "כותרת", type: "string" }),
    defineField({
      name: "slug",
      title: "כתובת URL",
      type: "slug",
      options: { source: "title" },
    }),
    defineField({
      name: "teaser",
      title: "תקציר שיווקי",
      type: "text",
      rows: 2,
      description: "1-2 משפטים שמגרים לקרוא — מה ישאל הקורא שרוצה לדעת תשובה",
    }),
    defineField({
      name: "content",
      title: "תוכן מלא",
      type: "text",
      rows: 10,
      description:
        "תומך ב-Markdown: **מודגש**, *מוטה*, > ציטוט (גופן פרנק רוהל). שורה ריקה = פסקה חדשה.",
    }),
    defineField({
      name: "category",
      title: "נושא ראשי",
      type: "reference",
      to: [{ type: "category" }],
    }),
    defineField({
      name: "extraCategories",
      title: "נושאים נוספים",
      type: "array",
      of: [{ type: "reference", to: [{ type: "category" }] }],
      validation: (rule) => rule.max(2),
      description: "עד 2 נושאים נוספים (סך הכל עד 3)",
    }),
    defineField({
      name: "subTopics",
      title: "תתי-נושאים",
      type: "array",
      of: [{ type: "reference", to: [{ type: "subTopic" }] }],
      description: "מועד / פרשה / צום / אירוע לאומי — אפשר לבחור כמה",
    }),
    defineField({
      name: "sourceType",
      title: "מקור",
      type: "string",
      options: {
        list: [
          { value: "shiur", title: "מתמלול שיעור" },
          { value: "manual", title: "ידני" },
          { value: "uploaded", title: "מחומר שהועלה" },
        ],
      },
      initialValue: "shiur",
    }),
    defineField({ name: "sourceVideoId", title: "מזהה סרטון מקור", type: "string" }),
    defineField({ name: "hebrewDate", title: "תאריך עברי", type: "string" }),
    defineField({ name: "publishedAt", title: "תאריך פרסום", type: "datetime" }),
    defineField({ name: "emailedAt", title: "נשלח למייל בתאריך", type: "datetime" }),
    defineField({
      name: "status",
      title: "סטטוס",
      type: "string",
      options: {
        list: [
          { value: "draft", title: "טיוטה" },
          { value: "published", title: "פורסם" },
        ],
      },
      initialValue: "published",
    }),
    defineField({
      name: "downloadCount",
      title: "מספר הורדות",
      type: "number",
      initialValue: 0,
      readOnly: true,
      description: "מתעדכן אוטומטית בכל הורדת Word",
    }),
  ],
  preview: {
    select: { title: "title", subtitle: "teaser" },
  },
});
