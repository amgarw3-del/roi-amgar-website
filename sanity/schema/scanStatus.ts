import { defineType, defineField } from "@sanity/types";

// מסמך יחיד שמחזיק את סטטוס הסריקה האחרונה
export const scanStatusSchema = defineType({
  name: "scanStatus",
  title: "סטטוס סריקה",
  type: "document",
  fields: [
    defineField({ name: "lastScannedAt", title: "סריקה אחרונה", type: "datetime" }),
    defineField({ name: "latestVideoId", title: "ID וידאו אחרון", type: "string" }),
    defineField({ name: "latestPostId", title: "ID פוסט אחרון", type: "string" }),
  ],
});
