import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { schemaTypes } from "./sanity/schema";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production";

export default defineConfig({
  name: "roi-amgar-website",
  title: "אתר הרב רועי אמגר",
  projectId,
  dataset,
  basePath: "/studio",
  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title("ניהול תוכן")
          .items([
            S.listItem()
              .title("שיעורים וידאו")
              .schemaType("video")
              .child(S.documentTypeList("video").title("שיעורים")),
            S.listItem()
              .title("פוסטים ומאמרים")
              .schemaType("blogPost")
              .child(S.documentTypeList("blogPost").title("פוסטים")),
            S.listItem()
              .title("שאלות ותשובות")
              .schemaType("qnA")
              .child(S.documentTypeList("qnA").title("שו\"ת")),
            S.listItem()
              .title("קטגוריות")
              .schemaType("category")
              .child(S.documentTypeList("category").title("קטגוריות")),
            S.divider(),
            S.listItem()
              .title("סטטוס סריקה")
              .schemaType("scanStatus")
              .child(S.documentTypeList("scanStatus").title("סריקות")),
          ]),
    }),
  ],
  schema: {
    types: schemaTypes,
  },
});
