import { defineType, defineField } from "@sanity/types";

export const videoSchema = defineType({
  name: "video",
  title: "שיעור מוסרט",
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
      name: "category",
      title: "קטגוריה",
      type: "reference",
      to: [{ type: "category" }],
    }),
    defineField({
      name: "level",
      title: "רמת לומד",
      type: "string",
      options: {
        list: [
          { value: "beginner", title: "מתחיל" },
          { value: "advanced", title: "מתקדם" },
          { value: "talmidei-torah", title: "לבני תורה" },
        ],
      },
    }),
    defineField({ name: "youtubeId", title: "מזהה YouTube", type: "string" }),
    defineField({
      name: "platform",
      title: "פלטפורמה",
      type: "string",
      options: {
        list: [
          { value: "youtube", title: "YouTube" },
          { value: "instagram", title: "Instagram" },
          { value: "tiktok", title: "TikTok" },
          { value: "facebook", title: "Facebook" },
        ],
      },
      initialValue: "youtube",
    }),
    defineField({ name: "transcript", title: "תמלול", type: "text" }),
    defineField({
      name: "transcriptStatus",
      title: "סטטוס תמלול",
      type: "string",
      options: {
        list: [
          { value: "ok", title: "תקין" },
          { value: "failed", title: "נכשל" },
          { value: "pending", title: "ממתין" },
        ],
      },
      initialValue: "pending",
    }),
    defineField({ name: "summary", title: "סיכום (Claude)", type: "text" }),
    defineField({ name: "hebrewDate", title: "תאריך עברי", type: "string" }),
    defineField({ name: "publishedAt", title: "תאריך פרסום", type: "datetime" }),
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
      initialValue: "draft",
    }),
    defineField({
      name: "contentTier",
      title: "רמת תוכן",
      type: "string",
      options: {
        list: [
          { value: "free", title: "חינמי" },
          { value: "premium", title: "פרימיום" },
        ],
      },
      initialValue: "free",
    }),
  ],
});
